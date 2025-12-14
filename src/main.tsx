import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LoadScript } from '@react-google-maps/api';

const libraries = ['places']; // Only load what you need

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadScript
      googleMapsApiKey="AIzaSyAlwkR078ja6eYka4GoD98JPkQoCf4jiaE"
      libraries={libraries}
    >
      <App />
    </LoadScript>
  </StrictMode>
);
