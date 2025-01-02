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

// Xử lý các reminder
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const { reminders } = await chrome.storage.local.get(['reminders'])
  if (!reminders) return

  const reminder = reminders.find(r => r.id === alarm.name)
  if (reminder && reminder.isActive) {
    chrome.notifications.create(reminder.id, {
      type: 'basic',
      iconUrl: 'icons/icon.svg',
      title: reminder.title,
      message: reminder.message
    })
  }
})

// Khởi tạo các tác vụ nền
chrome.runtime.onInstalled.addListener(async () => {
  // Thiết lập cài đặt mặc định
  const { settings } = await chrome.storage.local.get(['settings'])
  if (!settings) {
    await chrome.storage.local.set({
      settings: {
        theme: 'light',
        quoteSource: 'quotable',
        waterReminderInterval: 30,
        notifications: true
      }
    })
  }

  // Thiết lập reminders mặc định
  const { reminders } = await chrome.storage.local.get(['reminders'])
  if (!reminders) {
    const defaultReminder = {
      id: 'water',
      title: 'Uống nước',
      message: 'Đã đến giờ uống nước rồi! 💧',
      interval: 30,
      isActive: true
    }
    await chrome.storage.local.set({ reminders: [defaultReminder] })
    
    if (defaultReminder.isActive) {
      chrome.alarms.create(defaultReminder.id, {
        periodInMinutes: defaultReminder.interval
      })
    }
  } else {
    // Khởi tạo lại các alarm cho các reminder đang active
    reminders.forEach(reminder => {
      if (reminder.isActive) {
        chrome.alarms.create(reminder.id, {
          periodInMinutes: reminder.interval
        })
      }
    })
  }
}) 