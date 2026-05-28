import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GalleryPage } from './pages/GalleryPage.tsx'

const isGallery = window.location.pathname === '/gallery' ||
                  window.location.pathname.startsWith('/gallery/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isGallery ? <GalleryPage /> : <App />}
  </StrictMode>,
)
