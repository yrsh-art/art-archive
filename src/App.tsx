import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ArtworkProvider } from './context/ArtworkContext'
import { ThemeProvider } from './context/ThemeContext'
import { AIProvider } from './context/AIContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Upload from './pages/Upload'
import Categories from './pages/Categories'
import Favorites from './pages/Favorites'
import Capture from './pages/Capture'
import Reference from './pages/Reference'
import Settings from './pages/Settings'
import ThemeGenerator from './pages/ThemeGenerator'
import Chat from './pages/Chat'
import CanvasPage from './pages/CanvasPage'
import Showcase from './pages/Showcase'
import Discover from './pages/Discover'
import './index.css'

function App() {
  return (
    <ThemeProvider>
      <ArtworkProvider>
        <AIProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/capture" element={<Capture />} />
                <Route path="/reference" element={<Reference />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/theme-generator" element={<ThemeGenerator />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/canvas" element={<CanvasPage />} />
                <Route path="/showcase" element={<Showcase />} />
                <Route path="/discover" element={<Discover />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </AIProvider>
      </ArtworkProvider>
    </ThemeProvider>
  )
}

export default App
