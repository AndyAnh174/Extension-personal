// Áp dụng cài đặt khi extension khởi động
chrome.runtime.onStartup.addListener(() => {
  applySettings()
})

// Áp dụng cài đặt khi extension được cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener(() => {
  applySettings()
})

// Lắng nghe message từ popup
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'SET_AUTO_START') {
    chrome.storage.sync.set({ autoStart: true })
  } else if (message.type === 'REMOVE_AUTO_START') {
    chrome.storage.sync.set({ autoStart: false })
  }
})

// Lắng nghe alarm cho reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'backup') {
    performBackup()
  } else {
    // Kiểm tra nếu là alarm của reminder
    const { reminders = [] } = await chrome.storage.sync.get(['reminders'])
    const reminder = reminders.find((r: any) => r.id === alarm.name)
    
    if (reminder) {
      // Kiểm tra settings
      const { settings } = await chrome.storage.sync.get(['settings'])
      if (!settings?.notifications) return

      // Hiển thị notification
      chrome.notifications.create(reminder.id, {
        type: 'basic',
        iconUrl: '/icons/icon128.png',
        title: reminder.title,
        message: reminder.message,
        priority: 2,
        requireInteraction: true
      })

      // Phát âm thanh nếu được bật
      if (settings?.soundEnabled) {
        const audio = new Audio(chrome.runtime.getURL('notification.mp3'))
        audio.play()
      }

      // Cập nhật nextTrigger
      const updatedReminders = reminders.map((r: any) => {
        if (r.id === reminder.id) {
          return {
            ...r,
            nextTrigger: Date.now() + r.interval * 60 * 1000
          }
        }
        return r
      })
      
      chrome.storage.sync.set({ reminders: updatedReminders })
    }
  }
})

// Xử lý click vào notification
chrome.notifications.onClicked.addListener((reminderId) => {
  // Mở popup khi click vào notification
  chrome.action.openPopup()
  // Đóng notification
  chrome.notifications.clear(reminderId)
})

async function applySettings() {
  const { settings } = await chrome.storage.sync.get(['settings'])
  if (!settings) return

  // Áp dụng theme
  document.documentElement.setAttribute('data-theme', settings.theme)

  // Áp dụng font
  document.documentElement.style.setProperty('--font-family', settings.fontFamily)
  document.documentElement.style.fontSize = `${settings.fontSize}px`

  // Xử lý notifications
  if (settings.notifications) {
    Notification.requestPermission()
  }

  // Xử lý backup tự động
  if (settings.autoBackup) {
    chrome.alarms.create('backup', {
      periodInMinutes: settings.backupInterval * 60
    })
  } else {
    chrome.alarms.clear('backup')
  }
}

async function performBackup() {
  const data = await chrome.storage.sync.get(null)
  const backup = {
    timestamp: new Date().toISOString(),
    data
  }

  // Lưu backup vào local storage
  const { backups = [] } = await chrome.storage.local.get(['backups'])
  backups.push(backup)

  // Giữ lại 10 bản backup gần nhất
  if (backups.length > 10) {
    backups.shift()
  }

  await chrome.storage.local.set({ backups })
} 