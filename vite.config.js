import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path' // Added for path.resolve

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true,
                type: 'module', // Fixes MIME type issue in dev
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Advanced Weather App',
                short_name: 'Weather',
                description: 'Advanced weather application with offline support',
                theme_color: '#ffffff',
                // background_color and display removed as per instruction
                icons: [
                    {
                        src: 'icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Updated globPatterns
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'weather-api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 10 // 10 minutes
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173
    }
})
