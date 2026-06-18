import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext'
import { NotificationProvider } from './context/NotificationContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <NotificationProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)


