import { useState, useEffect } from 'react'
import { Input, Button, Card, Typography, Modal, Tabs } from 'antd'
import { 
  DeleteOutlined, 
  DragOutlined,
  SaveOutlined,
  FolderAddOutlined 
} from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const { Title, Text } = Typography
const { TabPane } = Tabs

interface TabGroup {
  id: string
  name: string
  tabs: chrome.tabs.Tab[]
}

const TabManager = () => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([])
  const [currentTabs, setCurrentTabs] = useState<chrome.tabs.Tab[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedTabs, setSelectedTabs] = useState<string[]>([])

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

  const createNewGroup = (tabs: chrome.tabs.Tab[]) => {
    if (!newGroupName) return

    const newGroup: TabGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      tabs
    }

    const updatedGroups = [...tabGroups, newGroup]
    setTabGroups(updatedGroups)
    chrome.storage.local.set({ tabGroups: updatedGroups })
    setNewGroupName('')
    setIsModalVisible(false)
    setSelectedTabs([])
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

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceId = result.source.droppableId
    const destinationId = result.destination.droppableId

    if (sourceId === 'current-tabs' && destinationId.startsWith('group-')) {
      const groupId = destinationId.replace('group-', '')
      const draggedTab = currentTabs[result.source.index]
      
      const updatedGroups = tabGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            tabs: [...group.tabs, draggedTab]
          }
        }
        return group
      })

      setTabGroups(updatedGroups)
      chrome.storage.local.set({ tabGroups: updatedGroups })
    }
  }

  const handleTabSelect = (tabId: string) => {
    setSelectedTabs(prev => {
      if (prev.includes(tabId)) {
        return prev.filter(id => id !== tabId)
      }
      return [...prev, tabId]
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">Quản lý Tab</Title>
        <div className="space-x-2">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => createNewGroup(currentTabs)}
            title="Lưu tất cả tab hiện tại"
          >
            Lưu tất cả
          </Button>
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setIsModalVisible(true)}
            title="Chọn tab để lưu"
          >
            Lưu tùy chọn
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Tab hiện tại" key="1">
            <Droppable droppableId="current-tabs">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {currentTabs.map((tab, index) => (
                    <Draggable
                      key={tab.id?.toString()}
                      draggableId={tab.id?.toString() || ''}
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="!mb-2"
                          size="small"
                        >
                          <div className="flex items-center gap-3">
                            <DragOutlined className="text-gray-400" />
                            {tab.favIconUrl && (
                              <img src={tab.favIconUrl} alt="" className="w-4 h-4" />
                            )}
                            <Text ellipsis className="flex-1">{tab.title}</Text>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </TabPane>

          <TabPane tab="Nhóm đã lưu" key="2">
            <div className="space-y-4">
              {tabGroups.map(group => (
                <Droppable key={group.id} droppableId={`group-${group.id}`}>
                  {(provided) => (
                    <Card
                      title={group.name}
                      extra={
                        <div className="space-x-2">
                          <Button
                            type="text"
                            icon={<SaveOutlined />}
                            onClick={() => openTabGroup(group)}
                            title="Mở nhóm tab"
                          />
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteGroup(group.id)}
                            title="Xóa nhóm"
                          />
                        </div>
                      }
                      className="!mb-4"
                    >
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {group.tabs.map((tab, index) => (
                          <Card
                            key={index}
                            size="small"
                            className="!mb-2"
                          >
                            <div className="flex items-center gap-3">
                              {tab.favIconUrl && (
                                <img src={tab.favIconUrl} alt="" className="w-4 h-4" />
                              )}
                              <Text ellipsis className="flex-1">{tab.title}</Text>
                            </div>
                          </Card>
                        ))}
                        {provided.placeholder}
                      </div>
                    </Card>
                  )}
                </Droppable>
              ))}
            </div>
          </TabPane>
        </Tabs>
      </DragDropContext>

      <Modal
        title="Lưu tab đã chọn"
        open={isModalVisible}
        onOk={() => {
          const selectedTabsData = currentTabs.filter(
            tab => tab.id && selectedTabs.includes(tab.id.toString())
          )
          createNewGroup(selectedTabsData)
        }}
        onCancel={() => {
          setIsModalVisible(false)
          setSelectedTabs([])
        }}
      >
        <div className="space-y-4">
          <Input
            placeholder="Tên nhóm tab"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {currentTabs.map(tab => (
              <Card
                key={tab.id}
                size="small"
                className={`cursor-pointer transition-colors ${
                  selectedTabs.includes(tab.id?.toString() || '') 
                    ? 'border-primary' 
                    : ''
                }`}
                onClick={() => tab.id && handleTabSelect(tab.id.toString())}
              >
                <div className="flex items-center gap-3">
                  {tab.favIconUrl && (
                    <img src={tab.favIconUrl} alt="" className="w-4 h-4" />
                  )}
                  <Text ellipsis className="flex-1">{tab.title}</Text>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TabManager 