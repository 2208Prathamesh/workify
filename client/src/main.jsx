import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import 'react-loading-skeleton/dist/skeleton.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '14px 20px',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#fff' },
            style: {
              borderLeft: '3px solid #10B981',
            },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
            style: {
              borderLeft: '3px solid #EF4444',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
