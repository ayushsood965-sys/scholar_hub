import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // 1. Standalone check
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    // 2. Mobile/Tablet viewport or touch check
    const isMobileDevice = 
      window.innerWidth <= 768 || 
      ('ontouchstart' in window) || 
      navigator.maxTouchPoints > 0;

    // 3. localStorage dismissed check
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';

    // 4. iOS detection
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

    // If already installed, dismissed, or not on mobile, don't show prompt
    if (isStandalone || isDismissed || !isMobileDevice) {
      return;
    }

    // iOS doesn't support 'beforeinstallprompt', so we show prompt directly for iOS Safari
    if (isIosDevice) {
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install banner
      e.preventDefault();
      // Store the event for triggering later
      setDeferredPrompt(e);
      // Show the install modal overlay
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIosDevice) {
      // Switch screen to show iOS step-by-step instructions
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    // Trigger the install prompt
    deferredPrompt.prompt();

    // Wait for response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt user choice: ${outcome}`);

    // Reset prompt event
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Prevent showing prompt again on next refresh
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Icon & App Name */}
        <div style={{
          position: 'relative',
          width: '96px',
          height: '96px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 12px 24px -10px rgba(99, 102, 241, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#ffffff'
        }}>
          <img src="/hpu_logo.png" alt="ScholarSync" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.025em', color: '#ffffff' }}>
            ScholarSync
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
            Simplify Academic & PhD Thesis Progress Tracking
          </p>
        </div>

        {!showIosInstructions ? (
          <>
            {/* Value Props */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              margin: '12px 0',
              textAlign: 'left',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <span>✨</span> <span>Access your dashboard instantly from your home screen</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <span>⚡</span> <span>Faster loading times & offline support</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <span>🔔</span> <span>Get real-time academic review notifications</span>
              </div>
            </div>

            {/* Install Button */}
            <button
              onClick={handleInstallClick}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 10px 20px -8px rgba(99, 102, 241, 0.6)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.target.style.transform = 'none'}
            >
              Install App
            </button>
          </>
        ) : (
          /* iOS step-by-step instructions */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0', color: '#818cf8' }}>
              How to Install on iPhone / iPad:
            </h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.88rem', color: '#cbd5e1' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 700
              }}>1</div>
              <div style={{ lineHeight: '1.4' }}>
                Tap the <strong>Share</strong> button in Safari toolbar below (or on top for iPad) <span style={{ fontSize: '1.2rem', verticalAlign: 'middle' }}>📤</span>.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.88rem', color: '#cbd5e1' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 700
              }}>2</div>
              <div style={{ lineHeight: '1.4' }}>
                Scroll down the share menu list and tap <strong>Add to Home Screen</strong> <span style={{ fontSize: '1.2rem', verticalAlign: 'middle' }}>➕</span>.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.88rem', color: '#cbd5e1' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 700
              }}>3</div>
              <div style={{ lineHeight: '1.4' }}>
                Tap <strong>Add</strong> in the top-right corner to complete the installation.
              </div>
            </div>
          </div>
        )}

        {/* Hyperlink below */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            textDecoration: 'underline',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: '8px 16px',
            marginTop: '8px',
            outline: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#cbd5e1'}
          onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
        >
          Continue on browser
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
