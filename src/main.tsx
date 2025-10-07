import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import DailyUpdateService from './services/dailyUpdateService'

// Initialize the daily update service when the app starts
DailyUpdateService.initialize();

// Log service status
console.log('Daily Update Service Status:', DailyUpdateService.getStatus());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)












