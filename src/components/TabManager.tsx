import { useState, useEffect } from 'react'
import { PlusIcon, BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface TabGroup {
  id: string
  name: string
  tabs: chrome.tabs.Tab[]
}

const TabManager = () => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([])
  const [currentTabs, setCurrentTabs] = useState<chrome.tabs.Tab[]>([])
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    // Lấy danh sách tab hiện tại
    chrome.tabs.query({}, (tabs) => {
      setCurrentTabs(tabs)
    })

    // Lấy các nhóm tab đã lưu
    chrome.storage.local.get(['tabGroups'], (result) => {
      if (result.tabGroups) {
        setTabGroups(result.tabGroups)
      }
    })
  }, [])

  const createNewGroup = () => {
    if (!newGroupName) return

    const newGroup: TabGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      tabs: currentTabs
    }

    const updatedGroups = [...tabGroups, newGroup]
    setTabGroups(updatedGroups)
    chrome.storage.local.set({ tabGroups: updatedGroups })
    setNewGroupName('')
  }

  const openTabGroup = (group: TabGroup) => {
    group.tabs.forEach(tab => {
      chrome.tabs.create({ url: tab.url })
    })
  }

  const deleteGroup = (groupId: string) => {
    const updatedGroups = tabGroups.filter(g => g.id !== groupId)
    setTabGroups(updatedGroups)
    chrome.storage.local.set({ tabGroups: updatedGroups })
  }

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold mb-6">Quản lý Tab</h1>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Tên nhóm tab mới"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={createNewGroup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {tabGroups.map(group => (
          <div key={group.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{group.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => openTabGroup(group)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Mở nhóm tab"
                >
                  <BookmarkIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa nhóm"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {group.tabs.length} tab
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TabManager 