import React, { useEffect, useState } from 'react';
import '../styles/UpdateNotification.css';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate, onDismiss }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <p>Доступно обновление приложения</p>
        <div className="update-buttons">
          <button className="update-btn" onClick={() => { onUpdate(); setShow(false); }}>
            Обновить
          </button>
          <button className="dismiss-btn" onClick={() => { onDismiss(); setShow(false); }}>
            Позже
          </button>
        </div>
      </div>
    </div>
  );
};
