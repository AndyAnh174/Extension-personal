import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface BlockedSite {
  id: string
  url: string
  startTime: string
  endTime: string
}

const WebBlocker = () => {
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([])
  const [newSite, setNewSite] = useState({
    url: '',
    startTime: '09:00',
    endTime: '17:00'
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Lấy danh sách trang web đã chặn
    chrome.storage.local.get(['blockedSites'], (result) => {
      if (result.blockedSites) {
        setBlockedSites(result.blockedSites)
      }
    })
  }, [])

  const addBlockedSite = () => {
    if (!newSite.url) return

    const site: BlockedSite = {
      id: Date.now().toString(),
      ...newSite
    }

    const updatedSites = [...blockedSites, site]
    setBlockedSites(updatedSites)
    chrome.storage.local.set({ blockedSites: updatedSites })
    setNewSite({
      url: '',
      startTime: '09:00',
      endTime: '17:00'
    })
  }

  const removeSite = (siteId: string) => {
    const updatedSites = blockedSites.filter(site => site.id !== siteId)
    setBlockedSites(updatedSites)
    chrome.storage.local.set({ blockedSites: updatedSites })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragPosition({
      x: e.clientX - e.currentTarget.offsetLeft,
      y: e.clientY - e.currentTarget.offsetTop
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const container = e.currentTarget
    container.style.left = `${e.clientX - dragPosition.x}px`
    container.style.top = `${e.clientY - dragPosition.y}px`
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div 
      className="h-full overflow-hidden relative"
      style={{ cursor: isDragging ? 'move' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Chặn Trang Web</h1>

        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">URL trang web</label>
            <input
              type="text"
              value={newSite.url}
              onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
              placeholder="Ví dụ: facebook.com"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Thời gian bắt đầu</label>
              <input
                type="time"
                value={newSite.startTime}
                onChange={(e) => setNewSite({ ...newSite, startTime: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Thời gian kết thúc</label>
              <input
                type="time"
                value={newSite.endTime}
                onChange={(e) => setNewSite({ ...newSite, endTime: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={addBlockedSite}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm trang web
          </button>
        </div>

        <div className="mt-8 space-y-4 max-h-[300px] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh sách trang web bị chặn</h2>
          {blockedSites.map(site => (
            <div key={site.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{site.url}</h3>
                  <p className="text-sm text-gray-600">
                    {site.startTime} - {site.endTime}
                  </p>
                </div>
                <button
                  onClick={() => removeSite(site.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa trang web này"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WebBlocker 