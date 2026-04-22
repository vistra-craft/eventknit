import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', () => {}); // Suppress ECONNRESET noise during HMR
        },
      },
      '/socket.io': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        ws: true,
      },
    }
  },
})