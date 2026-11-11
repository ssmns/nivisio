import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { ToastProvider } from './components/Toast'
import { LanguageProvider } from './lib/i18n'
import { LibraryPage } from './pages/LibraryPage'
import { ReaderPage } from './pages/ReaderPage'
import { AboutPage } from './pages/AboutPage'
import { TemplatesPage } from './pages/TemplatesPage'

export default function App() {
  const { mode, setMode } = useTheme()

  return (
    <LanguageProvider>
      <ToastProvider>
        <div className="app-canvas">
          <div className="app-art" aria-hidden="true" />
          <HashRouter>
            <Routes>
              <Route path="/" element={<LibraryPage theme={mode} onTheme={setMode} />} />
              <Route path="/read/:id" element={<ReaderPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/developer" element={<AboutPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </div>
      </ToastProvider>
    </LanguageProvider>
  )
}
