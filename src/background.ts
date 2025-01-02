// Áp dụng cài đặt khi extension khởi động
chrome.runtime.onStartup.addListener(() => {
  applySettings()
})

// Áp dụng cài đặt khi extension được cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener(() => {
  applySettings()
})

// Lắng nghe message từ popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_AUTO_START') {
    chrome.storage.sync.set({ autoStart: true })
  } else if (message.type === 'REMOVE_AUTO_START') {
    chrome.storage.sync.set({ autoStart: false })
  }
})

// Xử lý backup tự động
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'backup') {
    performBackup()
  }
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