import AppRoutes from '@/AppRoutes'
import '@/index.css'
import { useUIStore } from '@/stores/ui'
import { useEffect } from 'react'

export default function App() {
  const { theme } = useUIStore()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <AppRoutes />
    </div>
  )
}
