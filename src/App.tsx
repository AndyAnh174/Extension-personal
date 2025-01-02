import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import { useTheme } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import TabManager from './components/TabManager'
import WebBlocker from './components/WebBlocker'
import Reminders from './components/Reminders'
import Settings from './components/Settings'
import Notes from './components/Notes'
import ReadingList from './components/ReadingList'
import FocusMode from './components/FocusMode'
import TaskManager from './components/TaskManager'
import QuickActions from './components/QuickActions'
import MeetingAssistant from './components/MeetingAssistant'
import Analytics from './components/Analytics'

const { darkAlgorithm, defaultAlgorithm } = theme

const App = () => {
  const { theme: currentTheme } = useTheme()

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
        algorithm: currentTheme === 'dark' ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tabs" element={<TabManager />} />
            <Route path="/blocker" element={<WebBlocker />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/reading-list" element={<ReadingList />} />
            <Route path="/focus" element={<FocusMode />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/quick-actions" element={<QuickActions />} />
            <Route path="/meeting" element={<MeetingAssistant />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
