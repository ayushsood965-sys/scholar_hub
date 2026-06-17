import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThesisProvider } from './context/ThesisContext'
import { ToastProvider } from './context/ToastContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <NotificationProvider>
        <AuthProvider>
          <ThesisProvider>
            <App />
          </ThesisProvider>
        </AuthProvider>
      </NotificationProvider>
    </ToastProvider>
  </React.StrictMode>,
)

