interface WebsiteStats {
  domain: string;
  totalTime: number;
  visitCount: number;
  lastVisit: number;
}

interface WebsiteData {
  [key: string]: WebsiteStats;
}

let websiteData: WebsiteData = {};
let currentTab: { id?: number; domain?: string; startTime?: number } = {};

// Hàm lấy domain từ URL
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

// Lưu dữ liệu vào file
async function saveWebsiteData() {
  try {
    const { storageLocation } = await chrome.storage.local.get('storageLocation');
    if (storageLocation?.filename) {
      const updatedData = {
        last_updated: new Date().toISOString(),
        website_stats: websiteData
      };

      // Tạo Blob từ dữ liệu mới
      const blob = new Blob([JSON.stringify(updatedData, null, 2)], {
        type: 'application/json'
      });

      // Tạo URL cho blob
      const url = URL.createObjectURL(blob);

      // Ghi đè file cũ
      await chrome.downloads.download({
        url: url,
        filename: storageLocation.filename,
        conflictAction: 'overwrite'
      });

      // Cleanup
      URL.revokeObjectURL(url);
    }
    
    // Vẫn lưu vào storage.local để truy cập nhanh
    await chrome.storage.local.set({ websiteData });
  } catch (error) {
    console.error('Error saving website data:', error);
  }
}

// Cập nhật thống kê cho tab hiện tại
function updateCurrentTabStats() {
  if (currentTab.id && currentTab.domain && currentTab.startTime) {
    const now = Date.now();
    const timeSpent = Math.floor((now - currentTab.startTime) / 1000); // Chuyển đổi thành giây

    if (!websiteData[currentTab.domain]) {
      websiteData[currentTab.domain] = {
        domain: currentTab.domain,
        totalTime: 0,
        visitCount: 0,
        lastVisit: now
      };
    }

    websiteData[currentTab.domain].totalTime += timeSpent;
    currentTab.startTime = now;
    
    saveWebsiteData();
  }
}

// Xử lý khi tab được active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Cập nhật thống kê cho tab trước đó
    updateCurrentTabStats();

    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const domain = getDomain(tab.url);
      currentTab = {
        id: activeInfo.tabId,
        domain,
        startTime: Date.now()
      };

      if (!websiteData[domain]) {
        websiteData[domain] = {
          domain,
          totalTime: 0,
          visitCount: 1,
          lastVisit: Date.now()
        };
      } else {
        websiteData[domain].visitCount++;
        websiteData[domain].lastVisit = Date.now();
      }
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Xử lý khi URL thay đổi
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    updateCurrentTabStats();

    const domain = getDomain(changeInfo.url);
    currentTab = {
      id: tabId,
      domain,
      startTime: Date.now()
    };

    if (!websiteData[domain]) {
      websiteData[domain] = {
        domain,
        totalTime: 0,
        visitCount: 1,
        lastVisit: Date.now()
      };
    } else {
      websiteData[domain].visitCount++;
      websiteData[domain].lastVisit = Date.now();
    }
  }
});

// Khởi tạo dữ liệu khi extension được load
chrome.runtime.onStartup.addListener(async () => {
  try {
    const result = await chrome.storage.local.get('websiteData');
    websiteData = result.websiteData || {};
  } catch (error) {
    console.error('Error loading website data:', error);
  }
});

// API để lấy thống kê
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_STATS') {
    const { startDate, endDate } = message;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    // Lọc và định dạng dữ liệu theo khoảng thời gian
    const filteredData = Object.values(websiteData)
      .filter(site => site.lastVisit >= start && site.lastVisit <= end)
      .map(site => ({
        domain: site.domain,
        totalTime: site.totalTime,
        visitCount: site.visitCount
      }));

    sendResponse({ success: true, data: filteredData });
  }
  return true;
}); 