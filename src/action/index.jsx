import { createRoot } from 'react-dom/client'
import locale from 'antd/locale/zh_CN';
import { ConfigProvider } from 'antd';
import App from './pages'
import './index.less'

createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={locale}>
    <App />
  </ConfigProvider>)
