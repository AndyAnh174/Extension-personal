import { useState, useEffect } from 'react'
import { Card, Button, Typography, Modal, Input, message, Tooltip } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  CopyOutlined,
  SaveOutlined,
  ShareAltOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface QuickAction {
  id: string
  name: string
  type: 'url' | 'script' | 'command'
  content: string
  icon?: string
  shortcut?: string
}

const defaultActions: QuickAction[] = [
  {
    id: 'save-tabs',
    name: 'Lưu tất cả tab',
    type: 'command',
    content: 'save_all_tabs',
    icon: 'save'
  },
  {
    id: 'copy-urls',
    name: 'Copy URL tất cả tab',
    type: 'command',
    content: 'copy_all_urls',
    icon: 'copy'
  },
  {
    id: 'share-tabs',
    name: 'Chia sẻ tab',
    type: 'command',
    content: 'share_tabs',
    icon: 'share'
  }
]

const QuickActions = () => {
  const [actions, setActions] = useState<QuickAction[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null)
  const [newAction, setNewAction] = useState<Omit<QuickAction, 'id'>>({
    name: '',
    type: 'url',
    content: ''
  })

  useEffect(() => {
    loadActions()
  }, [])

  const loadActions = () => {
    chrome.storage.sync.get(['quickActions'], (result) => {
      if (result.quickActions) {
        setActions(result.quickActions)
      } else {
        // Khởi tạo actions mặc định
        chrome.storage.sync.set({ quickActions: defaultActions })
        setActions(defaultActions)
      }
    })
  }

  const saveActions = (newActions: QuickAction[]) => {
    chrome.storage.sync.set({ quickActions: newActions })
    setActions(newActions)
  }

  const addAction = () => {
    if (!newAction.name || !newAction.content) {
      message.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    const action: QuickAction = {
      id: Date.now().toString(),
      ...newAction
    }

    saveActions([...actions, action])
    setIsModalVisible(false)
    setNewAction({
      name: '',
      type: 'url',
      content: ''
    })
    message.success('Đã thêm thao tác nhanh')
  }

  const updateAction = () => {
    if (!editingAction || !editingAction.name || !editingAction.content) {
      message.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    const updatedActions = actions.map(a => 
      a.id === editingAction.id ? editingAction : a
    )
    saveActions(updatedActions)
    setEditingAction(null)
    message.success('Đã cập nhật thao tác nhanh')
  }

  const removeAction = (actionId: string) => {
    const updatedActions = actions.filter(a => a.id !== actionId)
    saveActions(updatedActions)
    message.success('Đã xóa thao tác nhanh')
  }

  const executeAction = async (action: QuickAction) => {
    try {
      switch (action.type) {
        case 'url':
          chrome.tabs.create({ url: action.content })
          break

        case 'script':
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.executeScript(tabs[0].id, {
                code: action.content
              })
            }
          })
          break

        case 'command':
          switch (action.content) {
            case 'save_all_tabs':
              const tabs = await chrome.tabs.query({})
              const tabGroup = {
                id: Date.now().toString(),
                name: `Tabs ${new Date().toLocaleString()}`,
                tabs
              }
              const { tabGroups = [] } = await chrome.storage.sync.get(['tabGroups'])
              chrome.storage.sync.set({ tabGroups: [...tabGroups, tabGroup] })
              message.success('Đã lưu tất cả tab')
              break

            case 'copy_all_urls':
              const allTabs = await chrome.tabs.query({})
              const urls = allTabs.map(tab => tab.url).join('\n')
              await navigator.clipboard.writeText(urls)
              message.success('Đã copy URL của tất cả tab')
              break

            case 'share_tabs':
              const currentTabs = await chrome.tabs.query({})
              const tabUrls = currentTabs.map(tab => tab.url).join('\n')
              const shareData = {
                title: 'Chia sẻ tabs',
                text: 'Danh sách tabs:',
                url: tabUrls
              }
              if (navigator.share) {
                await navigator.share(shareData)
              } else {
                await navigator.clipboard.writeText(tabUrls)
                message.success('Đã copy URL để chia sẻ')
              }
              break
          }
          break
      }
    } catch (error) {
      message.error('Có lỗi khi thực hiện thao tác')
    }
  }

  const getActionIcon = (action: QuickAction) => {
    switch (action.icon || action.type) {
      case 'save':
        return <SaveOutlined />
      case 'copy':
        return <CopyOutlined />
      case 'share':
        return <ShareAltOutlined />
      case 'url':
        return <LinkOutlined />
      case 'script':
        return <ThunderboltOutlined />
      default:
        return <ThunderboltOutlined />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4}>Thao tác nhanh</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm thao tác
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map(action => (
          <Card key={action.id} className="shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getActionIcon(action)}
                <div>
                  <Text strong>{action.name}</Text>
                  {action.shortcut && (
                    <Text className="block text-xs text-gray-500">
                      Phím tắt: {action.shortcut}
                    </Text>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip title="Thực hiện">
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => executeAction(action)}
                  />
                </Tooltip>
                <Tooltip title="Sửa">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setEditingAction(action)}
                  />
                </Tooltip>
                <Tooltip title="Xóa">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeAction(action.id)}
                  />
                </Tooltip>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        title={editingAction ? 'Sửa thao tác nhanh' : 'Thêm thao tác nhanh'}
        open={isModalVisible || !!editingAction}
        onOk={editingAction ? updateAction : addAction}
        onCancel={() => {
          setIsModalVisible(false)
          setEditingAction(null)
          setNewAction({
            name: '',
            type: 'url',
            content: ''
          })
        }}
      >
        <div className="space-y-4">
          <div>
            <Text>Tên thao tác</Text>
            <Input
              value={editingAction?.name || newAction.name}
              onChange={(e) => {
                if (editingAction) {
                  setEditingAction({ ...editingAction, name: e.target.value })
                } else {
                  setNewAction(prev => ({ ...prev, name: e.target.value }))
                }
              }}
              placeholder="Ví dụ: Mở Gmail"
            />
          </div>

          <div>
            <Text>Loại thao tác</Text>
            <Input.Group compact>
              <Button.Group>
                <Button
                  type={(editingAction?.type || newAction.type) === 'url' ? 'primary' : 'default'}
                  onClick={() => {
                    if (editingAction) {
                      setEditingAction({ ...editingAction, type: 'url' })
                    } else {
                      setNewAction(prev => ({ ...prev, type: 'url' }))
                    }
                  }}
                >
                  URL
                </Button>
                <Button
                  type={(editingAction?.type || newAction.type) === 'script' ? 'primary' : 'default'}
                  onClick={() => {
                    if (editingAction) {
                      setEditingAction({ ...editingAction, type: 'script' })
                    } else {
                      setNewAction(prev => ({ ...prev, type: 'script' }))
                    }
                  }}
                >
                  Script
                </Button>
              </Button.Group>
            </Input.Group>
          </div>

          <div>
            <Text>
              {(editingAction?.type || newAction.type) === 'url' ? 'URL' : 'Mã JavaScript'}
            </Text>
            <Input.TextArea
              value={editingAction?.content || newAction.content}
              onChange={(e) => {
                if (editingAction) {
                  setEditingAction({ ...editingAction, content: e.target.value })
                } else {
                  setNewAction(prev => ({ ...prev, content: e.target.value }))
                }
              }}
              placeholder={
                (editingAction?.type || newAction.type) === 'url'
                  ? 'https://example.com'
                  : 'document.querySelector("button").click()'
              }
              rows={4}
            />
          </div>

          <div>
            <Text>Phím tắt (tùy chọn)</Text>
            <Input
              value={editingAction?.shortcut || newAction.shortcut}
              onChange={(e) => {
                if (editingAction) {
                  setEditingAction({ ...editingAction, shortcut: e.target.value })
                } else {
                  setNewAction(prev => ({ ...prev, shortcut: e.target.value }))
                }
              }}
              placeholder="Ctrl+Shift+1"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default QuickActions