import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')

  // Validate required environment variables in production build
  if (mode === 'production') {
    const requiredEnvVars = [
      'VITE_API_BASE_URL',
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_APP_ID'
    ]

    const missingVars = requiredEnvVars.filter(key => !env[key] || env[key].startsWith('your-'))
    
    if (missingVars.length > 0) {
      throw new Error(
        `❌ Missing required environment variables for production build:\n` +
        missingVars.map(v => `  - ${v}`).join('\n') +
        `\n\nPlease set these in your Vercel environment variables.`
      )
    }

    console.log('✅ All required environment variables are set')
  }

  return {
    plugins: [react()],
    server: {
      port: 3002,
      host: true,
      // Proxy for local development only
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-ui': ['framer-motion', 'lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
    }
  }
})
