"use client";
import React from "react";
import { usePrivateCall } from "./usePrivateCall";

interface PrivateCallUIProps {
  contactId: string;
  incoming?: boolean;
}


import { useState } from "react";
const PrivateCallUI: React.FC<PrivateCallUIProps> = ({ contactId, incoming }) => {
  const [mode, setMode] = useState<'audio' | 'video'>("audio");
  const [autoStarted, setAutoStarted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>("connecting");
  const { localVideoRef, remoteVideoRef, startCall, setRemoteModeListener } = usePrivateCall(contactId, mode, setMode, setConnectionStatus);

  // Listen for remote mode (from offer)
  React.useEffect(() => {
    setRemoteModeListener((remoteMode) => {
      setMode(remoteMode);
      if (incoming && !autoStarted) {
        setAutoStarted(true);
        setTimeout(() => startCall(), 0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming, setRemoteModeListener]);

  // For outgoing call, auto-start if incoming
  React.useEffect(() => {
    if (incoming && !autoStarted) {
      setAutoStarted(true);
      startCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-lg font-bold mb-4">Private Call</h2>
      <div className="mb-2 text-sm text-gray-500">
        {connectionStatus === 'connecting' && 'Connecting...'}
        {connectionStatus === 'connected' && 'Call connected!'}
        {connectionStatus === 'disconnected' && 'Call disconnected.'}
      </div>
      {/* Only show mode selection and start button for outgoing calls */}
      {!incoming && (
        <>
          <div className="mb-4 flex gap-4">
            <button
              className={`px-4 py-2 rounded ${mode === 'audio' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setMode('audio')}
            >
              Audio Call
            </button>
            <button
              className={`px-4 py-2 rounded ${mode === 'video' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setMode('video')}
            >
              Video Call
            </button>
          </div>
          <div className="mt-4 flex gap-4">
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={startCall}>
              Start {mode === 'audio' ? 'Audio' : 'Video'} Call
            </button>
            {/* Add mute/end call logic as needed */}
          </div>
        </>
      )}
      {/* Always show video elements for video mode, or a message for audio mode */}
      {mode === 'video' && (
        <>
          <video ref={localVideoRef} autoPlay muted playsInline className="rounded-lg border w-64 h-40 bg-black mb-2" />
          <video ref={remoteVideoRef} autoPlay playsInline className="rounded-lg border w-64 h-40 bg-black" />
        </>
      )}
      {mode === 'audio' && (
        <div className="text-gray-600 mt-4">Audio call in progress...</div>
      )}
    </div>
  );
};

export default PrivateCallUI;
