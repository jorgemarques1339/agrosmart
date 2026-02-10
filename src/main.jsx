import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Renderizar a App
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// --- REGISTO DO SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('AgroSmart PWA: Service Worker registado com sucesso: ', registration.scope);
      })
      .catch((err) => {
        console.log('AgroSmart PWA: Falha no registo do Service Worker: ', err);
      });
  });
}