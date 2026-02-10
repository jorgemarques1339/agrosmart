import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// --- REGISTO DO SERVICE WORKER COM AUTO-RELOAD ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      
      // Deteta se há uma atualização à espera
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão encontrada! O sw.js vai disparar o skipWaiting
            console.log('Nova versão disponível. A atualizar...');
          }
        };
      };
    });
  });

  // Recarrega a página automaticamente quando o novo SW assume o controlo
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}