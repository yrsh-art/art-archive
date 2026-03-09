import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './reference.css'
import ReferenceBoard from './windows/ReferenceBoard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReferenceBoard />
  </StrictMode>,
)
