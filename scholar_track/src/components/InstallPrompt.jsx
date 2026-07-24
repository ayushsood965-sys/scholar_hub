import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import axios from 'axios';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [srcPortal, setSrcPortal] = useState('SCHOLAR_TRACK');

  useEffect(() => {
    // Check if ?install=true is present in the URL
    const queryParams = new URLSearchParams(window.location.search);
    const forceInstall = queryParams.get('install') === 'true';
    const src = queryParams.get('src');
    if (src) {
      setSrcPortal(src);
    }

    // 1. Standalone check
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    // 2. Mobile/Tablet viewport or touch check
    const isMobileDevice = 
      window.innerWidth <= 768 || 
      ('ontouchstart' in window) || 
      navigator.maxTouchPoints > 0;

    // 3. localStorage daily dismissed check (shows at most once per day)
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDismissedDate = localStorage.getItem('pwa_prompt_dismissed_date');
    const isDismissedToday = lastDismissedDate === todayStr;

    // 4. Check for early captured beforeinstallprompt event
    if (window.deferredPWAEvent) {
      setDeferredPrompt(window.deferredPWAEvent);
    }

    // If already installed, or not on mobile, don't show prompt
    if (isStandalone || !isMobileDevice) {
      return;
    }

    // If forced via URL, show prompt immediately (ignore dismissed state)
    if (forceInstall) {
      setIsVisible(true);
      // Clean query parameters from URL
      const url = new URL(window.location);
      url.searchParams.delete('install');
      url.searchParams.delete('src');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    } else if (!isDismissedToday) {
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install banner
      e.preventDefault();
      // Store the event for triggering later
      setDeferredPrompt(e);
      window.deferredPWAEvent = e;
      // Show the install modal if not dismissed today, or if forced
      if (!isDismissedToday || forceInstall) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const handleTriggerModal = () => {
      setIsVisible(true);
      const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
      const currentPrompt = deferredPrompt || window.deferredPWAEvent;
      if (isIosDevice) {
        setShowIosInstructions(true);
      } else if (!currentPrompt) {
        setShowAndroidInstructions(true);
      }
    };
    
    window.addEventListener('trigger-pwa-install-modal', handleTriggerModal);
    return () => {
      window.removeEventListener('trigger-pwa-install-modal', handleTriggerModal);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    const activePrompt = deferredPrompt || window.deferredPWAEvent;
    
    // Log the click attempt to the backend
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language || navigator.userLanguage || '';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    
    // Parse OS
    let operatingSystem = 'Unknown';
    if (/android/i.test(userAgent)) operatingSystem = 'Android';
    else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) operatingSystem = 'iOS';
    else if (/windows/i.test(userAgent)) operatingSystem = 'Windows';
    else if (/mac/i.test(userAgent)) operatingSystem = 'macOS';
    else if (/linux/i.test(userAgent)) operatingSystem = 'Linux';

    // Parse Browser
    let browserName = 'Unknown';
    if (/chrome|crios/i.test(userAgent) && !/edge|edg/i.test(userAgent) && !/opr/i.test(userAgent)) browserName = 'Chrome';
    else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browserName = 'Safari';
    else if (/firefox|fxios/i.test(userAgent)) browserName = 'Firefox';
    else if (/edge|edg/i.test(userAgent)) browserName = 'Edge';
    else if (/opr/i.test(userAgent)) browserName = 'Opera';

    // Parse Device Type
    let deviceType = 'Desktop';
    if (/mobi/i.test(userAgent)) deviceType = 'Mobile';
    else if (/ipad|tablet/i.test(userAgent)) deviceType = 'Tablet';

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios.post(`${API_URL}/install-logs`, {
      portal: srcPortal,
      targetApp: 'SCHOLAR_TRACK',
      installType: (activePrompt && !isIosDevice) ? 'Native' : 'Manual',
      userAgent,
      operatingSystem,
      browserName,
      deviceType,
      screenResolution,
      language,
      timezone
    }, { headers }).catch(err => console.error('Error logging app install:', err));

    if (isIosDevice) {
      // Switch screen to show iOS step-by-step instructions
      setShowIosInstructions(true);
      return;
    }

    if (!activePrompt) {
      // If native prompt is not available, show manual instructions for Android/Chrome
      setShowAndroidInstructions(true);
      return;
    }

    // Trigger the install prompt
    activePrompt.prompt();

    // Wait for response
    const { outcome } = await activePrompt.userChoice;
    console.log(`PWA install prompt user choice: ${outcome}`);

    // Reset prompt event
    setDeferredPrompt(null);
    window.deferredPWAEvent = null;
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Record today's date so prompt will not auto-show again until tomorrow
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('pwa_prompt_dismissed_date', todayStr);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const appName = "ScholarTrack";
  const appSubtitle = "Enterprise Attendance & Compliance Portal";
  const valueProps = [
    "Mark attendance instantly from your home screen",
    "Request leaves & track compliance on the go",
    "Get real-time attendance and compliance warnings"
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(6, 78, 59, 0.3)',
      backdropFilter: 'blur(12px)',
      zIndex: 999999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '380px',
        width: '100%',
        background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
        border: '2px solid #A7F3D0',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 25px 50px -12px rgba(4, 120, 87, 0.2), 0 12px 24px -10px rgba(4, 120, 87, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
        color: '#065F46',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: '#047857',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 800
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.color = '#065F46'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#047857'; }}
        >
          ✕
        </button>

        {/* Icon Container */}
        <div style={{
          position: 'relative',
          width: '88px',
          height: '88px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 10px 20px -8px rgba(4, 120, 87, 0.25)',
          border: '2px solid #A7F3D0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--color-surface)',
          marginBottom: '16px'
        }}>
          <img src="/hpu_logo.png" alt="ScholarTrack" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </div>

        {/* App Title */}
        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#065F46' }}>
          {appName}
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#047857', margin: '0 0 20px 0', fontWeight: 600, lineHeight: 1.4 }}>
          {appSubtitle}
        </p>

        {/* OS Support Indicators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '6px 16px',
          background: '#DCFCE7',
          borderRadius: '20px',
          border: '1px solid #A7F3D0',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#065F46'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-5.71-4.79L16 2.08A.495.495 0 0 0 15.65 2a.5.5 0 0 0-.35.15L13.8 3.65C13.21 3.42 12.61 3.3 12 3.3c-.61 0-1.21.12-1.8.35L8.7 2.15a.5.5 0 0 0-.7 0 .49.49 0 0 0-.15.35c0 .13.05.26.15.35l1.5 1.5C7.38 5.56 6.06 7.6 6 10h12c-.06-2.4-1.38-4.44-3.51-5.65zM9 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            Android
          </span>
          <span style={{ color: '#A7F3D0' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94 1.07.08 2.16-.52 2.81-1.33z"/>
            </svg>
            iOS
          </span>
          <span style={{ color: '#A7F3D0' }}>|</span>
          <span>PWA App</span>
        </div>

        {!showIosInstructions && !showAndroidInstructions ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%'
          }}>
            {/* Value props in premium box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left',
              background: '#F0FDF4',
              padding: '14px 16px',
              borderRadius: '16px',
              border: '1px solid #A7F3D0',
              marginBottom: '8px'
            }}>
              {valueProps.map((prop, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color: '#047857', alignItems: 'flex-start', lineHeight: 1.3 }}>
                  <span style={{ color: '#10B981' }}>✓</span> <span>{prop}</span>
                </div>
              ))}
            </div>

            {/* Install Button (App Store / Play Store styled but generic) */}
            <button
              onClick={handleInstallClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: '#000000',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: '#ffffff' }}>
                {/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94 1.07.08 2.16-.52 2.81-1.33z"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
                  </svg>
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.6rem', color: '#a3a3a3', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream ? "Install on iOS Safari" : "Download Web App"}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>Install App</div>
              </div>
            </button>
          </div>
        ) : showIosInstructions ? (
          /* iOS Instructions with green styling */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '100%',
            background: '#F0FDF4',
            padding: '18px',
            borderRadius: '18px',
            border: '1px solid #A7F3D0',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 6px 0', color: '#065F46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>How to Install on iOS:</span>
              <button 
                onClick={() => setShowIosInstructions(false)}
                style={{ background: 'none', border: 'none', color: '#047857', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Go Back
              </button>
            </h4>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.78rem', color: '#047857' }}>
              <div style={{ background: '#DCFCE7', color: '#065F46', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, border: '1px solid #A7F3D0' }}>1</div>
              <div style={{ lineHeight: '1.4' }}>
                Tap Safari's <strong>Share</strong> button <span style={{ fontSize: '1rem' }}>📤</span> in bottom toolbar.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.78rem', color: '#047857' }}>
              <div style={{ background: '#DCFCE7', color: '#065F46', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, border: '1px solid #A7F3D0' }}>2</div>
              <div style={{ lineHeight: '1.4' }}>
                Scroll down and select <strong>Add to Home Screen</strong> <span style={{ fontSize: '1rem' }}>➕</span>.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.78rem', color: '#047857' }}>
              <div style={{ background: '#DCFCE7', color: '#065F46', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, border: '1px solid #A7F3D0' }}>3</div>
              <div style={{ lineHeight: '1.4' }}>
                Tap <strong>Add</strong> in the top-right corner to complete the install.
              </div>
            </div>
          </div>
        ) : (
          /* Android / General Instructions */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '100%',
            background: '#F0FDF4',
            padding: '18px',
            borderRadius: '18px',
            border: '1px solid #A7F3D0',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 6px 0', color: '#065F46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>How to Install:</span>
              <button 
                onClick={() => setShowAndroidInstructions(false)}
                style={{ background: 'none', border: 'none', color: '#047857', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Go Back
              </button>
            </h4>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.78rem', color: '#047857' }}>
              <div style={{ background: '#DCFCE7', color: '#065F46', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, border: '1px solid #A7F3D0' }}>1</div>
              <div style={{ lineHeight: '1.4' }}>
                Tap the browser's <strong>Menu</strong> button (three dots <span style={{ fontSize: '1rem' }}>⋮</span> in the top right corner).
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.78rem', color: '#047857' }}>
              <div style={{ background: '#DCFCE7', color: '#065F46', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, border: '1px solid #A7F3D0' }}>2</div>
              <div style={{ lineHeight: '1.4' }}>
                Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.78rem', color: '#047857' }}>
              <div style={{ background: '#DCFCE7', color: '#065F46', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, border: '1px solid #A7F3D0' }}>3</div>
              <div style={{ lineHeight: '1.4' }}>
                Follow the browser prompt to complete the installation.
              </div>
            </div>
          </div>
        )}

        {/* Continue to web link */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#047857',
            textDecoration: 'underline',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 16px',
            marginTop: '20px',
            outline: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#065F46'}
          onMouseLeave={(e) => e.target.style.color = '#047857'}
        >
          Continue on browser
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
