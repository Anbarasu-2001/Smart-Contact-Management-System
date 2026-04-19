import React, { useState, useEffect } from "react";
import usePrivateCall from "./usePrivateCall";

interface RealTimeCallUIProps {
  contactId: string;
  incoming?: boolean;
  name?: string;
  initialType?: "audio" | "video";
  autoCall?: boolean;
}

const RealTimeCallUI: React.FC<RealTimeCallUIProps> = ({ 
  contactId, 
  incoming = false, 
  name, 
  initialType = "video", 
  autoCall = false 
}) => {
  const [callType, setCallType] = useState<"audio" | "video">(initialType);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [inCall, setInCall] = useState(false);
  
  const { 
    localVideoRef, 
    remoteVideoRef, 
    startCall, 
    setRemoteModeListener 
  } = usePrivateCall(
    contactId, 
    incoming ? (undefined as any) : callType, 
    setCallType, 
    setStatus
  );

  useEffect(() => {
    setRemoteModeListener((mode) => {
      setCallType(mode);
      setInCall(true);
    });
  }, [setRemoteModeListener]);

  useEffect(() => {
    if ((incoming || autoCall) && !inCall) {
      if (!incoming) {
        setInCall(true);
        startCall();
      } else {
        // For incoming, hook automatically handles it once setupPeerConnection is called
        setInCall(true);
      }
    }
  }, [incoming, autoCall, inCall, startCall]);

  const handleManualStart = (type: "audio" | "video") => {
    setCallType(type);
    setInCall(true);
    // startCall will be triggered by the hook effect when mode changes
    // Actually, in the hook, startCall needs to be called manually if we want control
    startCall(); 
  };

  const endCall = () => {
    // Refresh page or trigger cleanup
    window.location.reload(); 
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto px-4">
      {!inCall && (
        <div className="flex flex-col items-center gap-6 p-10 bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 w-full">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-2">
             <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
             </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {incoming ? `Incoming from ${name || "Unknown"}` : `Call ${name || "Contact"}`}
          </h2>
          <p className="text-slate-500 text-center max-w-xs">
            Establish a secure, end-to-end encrypted connection for crystal clear communication.
          </p>
          
          {!incoming && (
            <div className="flex gap-4 w-full justify-center">
              <button
                className="group px-8 py-4 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-slate-800 font-bold rounded-2xl shadow-sm border border-slate-200 hover:shadow-md"
                onClick={() => handleManualStart("audio")}
              >
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                Voice Call
              </button>
              <button
                className="group px-8 py-4 bg-slate-900 hover:bg-black transition-all flex items-center justify-center gap-3 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl scale-105 active:scale-100"
                onClick={() => handleManualStart("video")}
              >
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                Video Call
              </button>
            </div>
          )}
          
          {incoming && (
            <div className="flex flex-col items-center gap-2">
               <span className="flex h-3 w-3 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
               </span>
               <p className="text-blue-600 font-medium animate-pulse">Waiting for connection...</p>
            </div>
          )}
        </div>
      )}

      {inCall && (
        <div className="flex flex-col items-center gap-6 p-8 bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 w-full animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between w-full mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {callType === "audio" ? "Voice Session" : "Video Session"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`}></div>
                <p className="text-sm font-medium text-slate-500 capitalize">{status}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 uppercase tracking-wider">
               Secure E2EE
            </div>
          </div>
          
          {callType === "audio" && (
            <div className="w-48 h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden my-6 border-8 border-white">
               <div className="absolute inset-0 bg-blue-400 opacity-10 animate-pulse"></div>
               <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                 <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                 </svg>
               </div>
               <audio ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full" style={{ display: callType === "video" ? "grid" : "none" }}>
            <div className="relative group">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-square bg-slate-900 rounded-2xl object-cover shadow-lg border-2 border-white ring-1 ring-slate-200"
              />
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">You</div>
            </div>
            <div className="relative group">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full aspect-square bg-slate-900 rounded-2xl object-cover shadow-lg border-2 border-white ring-1 ring-slate-200"
              />
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">{name || "Remote"}</div>
              {status !== 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-2xl">
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <p className="text-white text-xs font-bold">Connecting...</p>
                   </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-4">
             <button className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </button>
             <button
               className="px-10 py-4 bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center gap-3 text-white font-bold rounded-2xl shadow-xl shadow-red-200 scale-105 active:scale-100 hover:rotate-1"
               onClick={endCall}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2.586-2.586a2 2 0 00-2.828-2.828L13.172 5.172 10.586 2.586a2 2 0 00-2.828 2.828L10.343 8M5 13h14a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>
               End Call
             </button>
             <button className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeCallUI;
