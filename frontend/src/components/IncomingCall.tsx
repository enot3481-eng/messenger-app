import React, { useEffect, useState } from 'react';
import '../styles/IncomingCall.css';

interface IncomingCallProps {
  caller: string;
  onAnswer: () => void;
  onReject: () => void;
}

export const IncomingCall: React.FC<IncomingCallProps> = ({ caller, onAnswer, onReject }) => {
  const [ringSound] = useState(new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='));

  useEffect(() => {
    ringSound.loop = true;
    ringSound.play();

    return () => {
      ringSound.pause();
    };
  }, [ringSound]);

  return (
    <div className="incoming-call">
      <div className="incoming-call-content">
        <h2>Входящий вызов</h2>
        <p>{caller}</p>
        <div className="call-buttons">
          <button className="answer-btn" onClick={onAnswer}>Ответить</button>
          <button className="reject-btn" onClick={onReject}>Отклонить</button>
        </div>
      </div>
    </div>
  );
};
