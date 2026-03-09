import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './capture.css'
import QuickCapture from './windows/QuickCapture'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuickCapture />
  </StrictMode>,
)
