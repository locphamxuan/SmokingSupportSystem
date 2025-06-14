import React from 'react';
import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom'; // Loại bỏ BrowserRouter tại đây
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <BrowserRouter> // Loại bỏ BrowserRouter tại đây */}
      <App />
    {/* </BrowserRouter> // Loại bỏ BrowserRouter tại đây */}
  </React.StrictMode>
); 