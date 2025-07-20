import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://nexus-backend-5l70.onrender.com'
      // ||'http://localhost:3001'
    },
    host: '0.0.0.0', 
    port: 5173,      
    allowedHosts: [ 
      'nexusdashboard.onrender.com', 
      'localhost',     
      'https://nexus-backend-5l70.onrender.com',            
    ],
  }
});