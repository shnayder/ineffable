import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/app';
import Provider from '@/app/provider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>
);
