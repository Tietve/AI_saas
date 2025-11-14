import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/chat-design.css'
// Import i18n config để khởi tạo ngôn ngữ
import './shared/config/i18n'

createRoot(document.getElementById('root')!).render(
  <App />,
)
