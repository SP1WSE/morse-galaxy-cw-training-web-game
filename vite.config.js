import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // KLUCZOWA ZMIANA: Definiujemy podkatalog, w którym znajduje się gra
  base: '/cwgame/', 
  
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Morse Galaxy',
        short_name: 'MorseCW',
        description: 'Ucz się alfabetu Morse\'a ratując galaktykę.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});