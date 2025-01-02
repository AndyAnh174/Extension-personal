// Kiểm tra và chặn các trang web
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  const { blockedSites } = await chrome.storage.local.get(['blockedSites'])
  if (!blockedSites) return

  const url = new URL(details.url)
  const currentTime = new Date()
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()

  for (const site of blockedSites) {
    if (url.hostname.includes(site.url)) {
      const [startHour, startMinute] = site.startTime.split(':').map(Number)
      const [endHour, endMinute] = site.endTime.split(':').map(Number)

      const isInBlockedTimeRange =
        (currentHour > startHour || (currentHour === startHour && currentMinute >= startMinute)) &&
        (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute))

      if (isInBlockedTimeRange) {
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('blocked.html')
        })
        break
      }
    }
  }
})

// Thiết lập nhắc nhở uống nước
const setupWaterReminder = async () => {
  const { settings } = await chrome.storage.local.get(['settings'])
  if (!settings?.notifications || !settings?.waterReminderInterval) return

  chrome.alarms.create('waterReminder', {
    periodInMinutes: settings.waterReminderInterval
  })
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'waterReminder') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Nhắc nhở uống nước',
      message: 'Đã đến giờ uống nước rồi! 💧'
    })
  }
})

// Khởi tạo các tác vụ nền
chrome.runtime.onInstalled.addListener(() => {
  // Thiết lập cài đặt mặc định
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          theme: 'light',
          quoteSource: 'quotable',
          waterReminderInterval: 30,
          notifications: true
        }
      })
    }
  })

  setupWaterReminder()
}) 