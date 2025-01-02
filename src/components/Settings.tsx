import { useState, useEffect } from 'react'

interface Settings {
  theme: 'light' | 'dark'
  quoteSource: string
  waterReminderInterval: number
  notifications: boolean
}

const Settings = () => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    quoteSource: 'quotable',
    waterReminderInterval: 30,
    notifications: true
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings)
      }
    })
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    setIsDirty(true)
    setSaveMessage('')
  }

  const handleSave = () => {
    chrome.storage.local.set({ settings }, () => {
      setIsDirty(false)
      setSaveMessage('Đã lưu cài đặt!')
      setTimeout(() => setSaveMessage(''), 3000)
    })
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt</h1>
        <div className="flex items-center gap-4">
          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium mb-4 text-gray-800">Giao diện</h3>
          <select
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium mb-4 text-gray-800">Nguồn trích dẫn</h3>
          <select
            value={settings.quoteSource}
            onChange={(e) => updateSettings({ quoteSource: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="quotable">Quotable API</option>
            <option value="custom">Tùy chỉnh</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium mb-4 text-gray-800">Nhắc nhở uống nước</h3>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="15"
              max="120"
              value={settings.waterReminderInterval}
              onChange={(e) => updateSettings({ waterReminderInterval: parseInt(e.target.value) })}
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-600">phút</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800">Thông báo</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSettings({ notifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 