import { useState, useEffect } from 'react'

const Dashboard = () => {
  const [quote, setQuote] = useState('')
  const [stats, setStats] = useState({
    openTabs: 0,
    focusTime: 0,
    blockedSites: 0
  })

  useEffect(() => {
    // Lấy số lượng tab đang mở
    chrome.tabs.query({}, (tabs) => {
      setStats(prev => ({ ...prev, openTabs: tabs.length }))
    })

    // Lấy quote ngẫu nhiên
    fetch('https://api.quotable.io/random')
      .then(res => res.json())
      .then(data => setQuote(data.content))
  }, [])

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <p className="text-gray-600 italic">{quote || 'Đang tải quote...'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium mb-2">Tab đang mở</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.openTabs}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium mb-2">Thời gian tập trung</h3>
          <p className="text-2xl font-bold text-green-600">{stats.focusTime}p</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium mb-2">Trang web đã chặn</h3>
          <p className="text-2xl font-bold text-red-600">{stats.blockedSites}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium mb-2">Nhắc nhở</h3>
          <button className="text-sm text-blue-600 hover:underline">
            Uống nước nào!
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 