import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, BellIcon } from '@heroicons/react/24/outline'

interface Reminder {
  id: string
  title: string
  message: string
  interval: number // phút
  isActive: boolean
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [newReminder, setNewReminder] = useState({
    title: '',
    message: '',
    interval: 30,
    isActive: true
  })

  useEffect(() => {
    chrome.storage.local.get(['reminders'], (result) => {
      if (result.reminders) {
        setReminders(result.reminders)
      } else {
        // Tạo reminder mặc định cho uống nước
        const defaultReminder: Reminder = {
          id: 'water',
          title: 'Uống nước',
          message: 'Đã đến giờ uống nước rồi! 💧',
          interval: 30,
          isActive: true
        }
        setReminders([defaultReminder])
        chrome.storage.local.set({ reminders: [defaultReminder] })
      }
    })
  }, [])

  const addReminder = () => {
    if (!newReminder.title || !newReminder.message) return

    const reminder: Reminder = {
      id: Date.now().toString(),
      ...newReminder
    }

    const updatedReminders = [...reminders, reminder]
    setReminders(updatedReminders)
    chrome.storage.local.set({ reminders: updatedReminders })
    
    // Tạo alarm cho reminder mới
    if (reminder.isActive) {
      chrome.alarms.create(reminder.id, {
        periodInMinutes: reminder.interval
      })
    }

    setNewReminder({
      title: '',
      message: '',
      interval: 30,
      isActive: true
    })
  }

  const toggleReminder = (reminder: Reminder) => {
    const updatedReminder = { ...reminder, isActive: !reminder.isActive }
    const updatedReminders = reminders.map(r => 
      r.id === reminder.id ? updatedReminder : r
    )
    
    setReminders(updatedReminders)
    chrome.storage.local.set({ reminders: updatedReminders })

    if (updatedReminder.isActive) {
      chrome.alarms.create(reminder.id, {
        periodInMinutes: reminder.interval
      })
    } else {
      chrome.alarms.clear(reminder.id)
    }
  }

  const removeReminder = (reminderId: string) => {
    const updatedReminders = reminders.filter(r => r.id !== reminderId)
    setReminders(updatedReminders)
    chrome.storage.local.set({ reminders: updatedReminders })
    chrome.alarms.clear(reminderId)
  }

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý nhắc nhở</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
            <input
              type="text"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              placeholder="Ví dụ: Uống nước"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">Nội dung thông báo</label>
            <input
              type="text"
              value={newReminder.message}
              onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
              placeholder="Nội dung sẽ hiển thị trong thông báo"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">Thời gian lặp lại (phút)</label>
            <input
              type="number"
              min="1"
              max="1440"
              value={newReminder.interval}
              onChange={(e) => setNewReminder({ ...newReminder, interval: parseInt(e.target.value) })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={addReminder}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm nhắc nhở
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reminders.map(reminder => (
          <div key={reminder.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-800">{reminder.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reminder.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {reminder.isActive ? 'Đang bật' : 'Đã tắt'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
                <p className="text-sm text-gray-500 mt-1">Lặp lại mỗi {reminder.interval} phút</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleReminder(reminder)}
                  className={`p-2 rounded-lg transition-colors ${
                    reminder.isActive 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={reminder.isActive ? 'Tắt nhắc nhở' : 'Bật nhắc nhở'}
                >
                  <BellIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => removeReminder(reminder.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa nhắc nhở"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reminders 