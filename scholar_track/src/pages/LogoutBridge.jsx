import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Preloader from '../components/Preloader';
import UrlNotConfigured from './UrlNotConfigured';
import { GATEWAY_URL } from '../config';

export default function LogoutBridge() {
  const [searchParams] = useSearchParams();
  const [showUnconfigured, setShowUnconfigured] = useState(false);

  useEffect(() => {
    const performLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('login_origin');
      sessionStorage.clear();

      if (!GATEWAY_URL) {
        setShowUnconfigured(true);
        return;
      }

      const toastMsg = searchParams.get('toast');
      const redirectUrl = toastMsg
        ? `${GATEWAY_URL}?toast=${encodeURIComponent(toastMsg)}`
        : GATEWAY_URL;
      
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 600);
    };

    performLogout();
  }, [searchParams]);

  if (showUnconfigured) {
    return <UrlNotConfigured variableName="VITE_GATEWAY_URL" />;
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "var(--color-bg, #0f172a)",
      color: "#ffffff"
    }}>
      <Preloader text="Securing your session and logging out..." />
    </div>
  );
}
