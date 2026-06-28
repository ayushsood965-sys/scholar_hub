import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Preloader from '../components/ui/Preloader';

export default function LogoutBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('login_origin');
      sessionStorage.clear();

      const toastMsg = searchParams.get('toast');
      const redirectPath = toastMsg ? `/?toast=${encodeURIComponent(toastMsg)}` : '/';
      
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 600);
    };

    performLogout();
  }, [navigate, searchParams]);

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
