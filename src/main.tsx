// src/main.jsx - CORRECTED & FINAL VERSION
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LoadScript } from '@react-google-maps/api';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <LoadScript
      googleMapsApiKey="AIzaSyAlwkR078ja6eYka4GoD98JPkQoCf4jiaE"
      libraries={['places']}  // ← THIS IS THE MISSING LINE!
      loadingElement={
        <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center text-white animate-pulse">
            <div className="w-20 h-20 border-4 border-white/30 border-t-emerald-400 rounded-full mx-auto mb-6 animate-spin"></div>
            <p className="text-xl font-bold">Loading GPS Tracking...</p>
          </div>
        </div>
      }
    >
      <App />
    </LoadScript>
  </StrictMode>
);