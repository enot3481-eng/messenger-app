import React, { useEffect, useRef, useState } from 'react';
import '../styles/CallWindow.css';

interface CallWindowProps {
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  duration: number;
  onEndCall: () => void;
  onToggleAudio: (enabled: boolean) => void;
  onToggleVideo: (enabled: boolean) => void;
}

export const CallWindow: React.FC<CallWindowProps> = ({
  remoteStream,
  localStream,
  duration,
  onEndCall,
  onToggleAudio,
  onToggleVideo
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleToggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    onToggleAudio(!audioEnabled);
  };

  const handleToggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    onToggleVideo(!videoEnabled);
  };

  return (
    <div className="call-window">
      <div className="call-main-video">
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>

      <div className="call-local-video">
        <video ref={localVideoRef} autoPlay playsInline muted />
      </div>

      <div className="call-info">
        <span className="call-duration">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
      </div>

      <div className="call-controls">
        <button 
          className={`control-btn ${audioEnabled ? 'active' : ''}`}
          onClick={handleToggleAudio}
          title="Микрофон"
        >
          🎤
        </button>
        <button 
          className={`control-btn ${videoEnabled ? 'active' : ''}`}
          onClick={handleToggleVideo}
          title="Камера"
        >
          📹
        </button>
        <button 
          className="control-btn end-call"
          onClick={onEndCall}
          title="Завершить вызов"
        >
          📞
        </button>
      </div>
    </div>
  );
};
