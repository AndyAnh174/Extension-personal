import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TabManager from './components/TabManager'
import WebBlocker from './components/WebBlocker'
import Settings from './components/Settings'
import Dashboard from './components/Dashboard'
import Reminders from './components/Reminders'

function App() {
  return (
    <Router>
      <div className="w-[400px] h-[600px] flex">
        <Sidebar />
        <main className="flex-1 p-4 bg-gray-50 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tabs" element={<TabManager />} />
            <Route path="/blocker" element={<WebBlocker />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
