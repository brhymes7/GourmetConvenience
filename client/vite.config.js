import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server runs the React app.
// The API server is separate and controlled by VITE_API_BASE_URL in client/.env if needed.
export default defineConfig({
  plugins: [react()]
});
