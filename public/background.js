// Lưu trữ rules hiện tại
let currentRules = [];

// Debug function
function debugLog(type, ...args) {
  console.log(`[${type}]`, ...args);
}

// Kiểm tra xem URL có bị chặn không
function checkBlockedUrl(url, rule) {
  const hostname = new URL(url).hostname;
  return rule.urls.some(blockedUrl => {
    const isBlocked = hostname.includes(blockedUrl) || url.includes(blockedUrl);
    if (isBlocked) {
      debugLog('Match', `URL ${url} matches pattern ${blockedUrl}`);
    }
    return isBlocked;
  });
}

// Kiểm tra thời gian
function checkBlockedTime(rule) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const [startHour, startMinute] = rule.startTime.split(':').map(Number);
  const [endHour, endMinute] = rule.endTime.split(':').map(Number);

  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  debugLog('Time', {
    current: `${currentHour}:${currentMinute} (${currentTimeInMinutes})`,
    start: `${startHour}:${startMinute} (${startTimeInMinutes})`,
    end: `${endHour}:${endMinute} (${endTimeInMinutes})`
  });

  return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
}

// Khởi tạo extension
function initializeExtension() {
  debugLog('Init', 'Extension starting...');
  
  // Lấy rules từ storage
  chrome.storage.sync.get(['focusRules'], (result) => {
    if (result.focusRules) {
      currentRules = result.focusRules;
      debugLog('Rules', 'Loaded rules:', currentRules);
    }
  });
}

// Chạy khởi tạo khi extension được cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener(initializeExtension);

// Chạy khởi tạo khi extension được khởi động
chrome.runtime.onStartup.addListener(initializeExtension);

// Lắng nghe message từ popup
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  debugLog('Message', 'Received message:', message);
  
  if (message.type === 'UPDATE_FOCUS_RULES' && message.rules) {
    currentRules = message.rules;
    debugLog('Rules', 'Updated rules:', currentRules);
  }
});

// Kiểm tra URL khi tab được cập nhật
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || tab.url) {
    const url = changeInfo.url || tab.url;
    debugLog('URL', 'Checking URL:', url);
    
    // Kiểm tra từng rule
    currentRules.forEach(rule => {
      if (rule.isActive && checkBlockedUrl(url, rule) && checkBlockedTime(rule)) {
        debugLog('Block', 'Blocking access to:', url);
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL('blocked.html')
        });
      }
    });
  }
});

// Kiểm tra khi người dùng điều hướng
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Chỉ xử lý frame chính
    debugLog('Navigation', 'Checking navigation to:', details.url);
    
    // Kiểm tra từng rule
    currentRules.forEach(rule => {
      if (rule.isActive && checkBlockedUrl(details.url, rule) && checkBlockedTime(rule)) {
        debugLog('Block', 'Blocking navigation to:', details.url);
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('blocked.html')
        });
      }
    });
  }
}); 