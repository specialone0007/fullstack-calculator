import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Calculator } from './components/Calculator'
import './index.css'

const root = document.getElementById('root')
if (root === null) {
  throw new Error('index.html has no #root element')
}

createRoot(root).render(
  <StrictMode>
    <Calculator />
  </StrictMode>,
)
