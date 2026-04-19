"use client";
import { useEffect, useRef } from "react";
import socketService from "../../utils/socketService";
import { generateKey, exportKey, importKey } from "../../utils/e2ee";
import { createEncryptor, createDecryptor } from "../../utils/webrtcE2EE";

export function usePrivateCall(
  contactId: string,
  mode: 'audio' | 'video',
  setMode?: (mode: 'audio' | 'video') => void,
  setConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected') => void
) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteModeListenerRef = useRef<((mode: 'audio' | 'video') => void) | null>(null);
  const bufferedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isSetupRef = useRef(false);

  useEffect(() => {
    if (!contactId || isSetupRef.current) return;
    isSetupRef.current = true;

    if (setConnectionStatus) setConnectionStatus('connecting');

    let userId: string | null = null;
    if (typeof window !== 'undefined') {
      userId = localStorage.getItem('userId');
    }

    let callKey: CryptoKey | null = null;
    let isCaller = false;

    const setupPeerConnection = async (remoteKeyRaw?: ArrayBuffer) => {
      console.log('[WebRTC] Starting setupPeerConnection', { hasRemoteKey: !!remoteKeyRaw });
      
      // 1. Key management
      if (remoteKeyRaw) {
        callKey = await importKey(remoteKeyRaw);
      } else {
        callKey = await generateKey();
        const exported = await exportKey(callKey);
        socketService.emit("callKey", { to: contactId, from: userId, key: Array.from(new Uint8Array(exported)) });
        isCaller = true;
      }

      // 2. Setup peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = pc;
      
      console.log('[WebRTC] New RTCPeerConnection created');

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] Local ICE candidate found');
          socketService.emit("ice-candidate", { to: contactId, from: userId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote track', event.streams[0]?.id);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          // Ensure it plays
          remoteVideoRef.current.play().catch(e => console.error('[WebRTC] Remote video play error:', e));
        }
        if (setConnectionStatus) setConnectionStatus('connected');
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        if (setConnectionStatus) {
          if (pc.connectionState === 'connected') setConnectionStatus('connected');
          else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) setConnectionStatus('disconnected');
          else setConnectionStatus('connecting');
        }
      };

      // 3. Signaling Listeners (ATTACH EARLY)
      const processBufferedCandidates = async () => {
        if (!pc.remoteDescription) return;
        console.log(`[WebRTC] Processing ${bufferedCandidatesRef.current.length} buffered candidates`);
        while (bufferedCandidatesRef.current.length > 0) {
          const cand = bufferedCandidatesRef.current.shift();
          if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
      };

      const handleIncomingCall = async (data: any) => {
         // Accept from either the specific contactId or the resolved userId if they match
         if (data.from !== contactId) {
            console.log('[WebRTC] Ignoring call from unexpected sender:', data.from, 'expected:', contactId);
            return;
         }
         
         console.log('[WebRTC] Received offer (incomingCall)');
         if (data.type && setMode) {
           setMode(data.type);
           if (remoteModeListenerRef.current) remoteModeListenerRef.current(data.type);
         }

         try {
           await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
           await processBufferedCandidates();
           const answer = await pc.createAnswer();
           await pc.setLocalDescription(answer);
           socketService.emit("accept-call", { to: data.from, from: userId, answer });
         } catch (err) {
           console.error('[WebRTC] Error handling incoming call:', err);
         }
      };

      const handleCallAccepted = async (data: any) => {
         console.log('[WebRTC] Received call-accepted (answer)');
         try {
           await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
           await processBufferedCandidates();
         } catch (err) {
           console.error('[WebRTC] Error handling call accepted:', err);
         }
      };

      const handleIceCandidate = async (data: any) => {
         if (data.candidate) {
           if (pc.remoteDescription) {
             await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
           } else {
             console.log('[WebRTC] Buffering remote ICE candidate (desc not set)');
             bufferedCandidatesRef.current.push(data.candidate);
           }
         }
      };

      socketService.on("incomingCall", handleIncomingCall);
      socketService.on("call-accepted", handleCallAccepted);
      socketService.on("ice-candidate", handleIceCandidate);

      // 4. Get local media (Backgrounded)
      const startMedia = async () => {
        try {
          console.log('[WebRTC] Requesting local media...', mode);
          const constraints = mode === 'audio' ? { audio: true, video: false } : { audio: true, video: true };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          // E2EE logic
          // @ts-ignore
          if (pc.getSenders && callKey) {
            for (const sender of pc.getSenders()) {
              const anySender = sender as any;
              if (sender.track && anySender.createEncodedStreams) {
                 try {
                   const { readable, writable } = anySender.createEncodedStreams();
                   readable.pipeThrough(createEncryptor(callKey)).pipeTo(writable);
                 } catch (e) { console.warn('E2EE encryption failed', e); }
              }
            }
          }

          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
          console.log('[WebRTC] Local tracks added to PeerConnection');
        } catch (err) {
          console.error('[WebRTC] getUserMedia error:', err);
          if (setConnectionStatus) setConnectionStatus('disconnected');
        }
      };

      // Start media request in background so signaling can continue
      startMedia();

      return () => {
        console.log('[WebRTC] Cleaning up PeerConnection');
        socketService.off("incomingCall", handleIncomingCall);
        socketService.off("call-accepted", handleCallAccepted);
        socketService.off("ice-candidate", handleIceCandidate);
        pc.close();
      };
    };

    let cleanup: (() => void) | undefined;

    if (mode) {
      setupPeerConnection().then(cb => { cleanup = cb; });
    } else {
      socketService.on("callKey", async ({ from, key }) => {
        if (from !== contactId) return;
        setupPeerConnection(new Uint8Array(key).buffer).then(cb => { cleanup = cb; });
      });
    }

    return () => {
      if (cleanup) cleanup();
      socketService.off("callKey");
      isSetupRef.current = false;
    };
  }, [contactId, mode, setMode, setConnectionStatus]);

  const startCall = async () => {
    console.log('[WebRTC] Executing startCall');
    // Simple retry if pc is not ready yet due to async setup
    for (let i = 0; i < 5; i++) {
      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketService.emit("call-user", { to: contactId, from: localStorage.getItem('userId'), offer, type: mode });
          return;
        } catch (err) {
          console.error('[WebRTC] createOffer error:', err);
          return;
        }
      }
      console.log('[WebRTC] PeerConnection not ready, retrying startCall...', i + 1);
      await new Promise(r => setTimeout(r, 300));
    }
    console.error('[WebRTC] Failed to start call: PeerConnection timed out');
  };

  const setRemoteModeListener = (cb: (mode: 'audio' | 'video') => void) => {
    remoteModeListenerRef.current = cb;
  };

  return { localVideoRef, remoteVideoRef, startCall, setRemoteModeListener };
}

export default usePrivateCall;
