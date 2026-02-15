import React, { useEffect } from 'react';
import '../styles/InstallPrompt.css';

export const InstallPrompt: React.FC = () => {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const deferredPromptRef = React.useRef<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      deferredPromptRef.current = null;
      setCanInstall(false);
    }
  };

  if (!canInstall || isInstalled) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-content">
        <h3>Установить приложение</h3>
        <p>Установите Messenger как приложение для быстрого доступа</p>
        <div className="install-buttons">
          <button className="install-btn" onClick={handleInstall}>
            Установить
          </button>
          <button className="install-close" onClick={() => setCanInstall(false)}>
            Позже
          </button>
        </div>
      </div>
    </div>
  );
};
