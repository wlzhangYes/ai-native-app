import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App.tsx';

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK !== 'false') {
    const { worker } = await import('./mocks/server');
    return worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
