
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize the root component
createRoot(document.getElementById("root")!).render(<App />);

// Track pageviews when the location changes
declare global {
  interface Window {
    gtag: (key: string, ...args: any[]) => void;
  }
}
