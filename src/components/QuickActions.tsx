import { useState, useEffect } from 'react'
import { Button, Card, Input, List, Typography, Modal, Select } from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  ThunderboltOutlined,
  LinkOutlined 
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

interface QuickAction {
  id: string
  name: string
  url: string
  shortcut: string
  category: string
}

const QuickActions = () => {
  const [actions, setActions] = useState<QuickAction[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<QuickAction | null>(null)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [category, setCategory] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    chrome.storage.local.get(['quickActions', 'actionCategories'], (result) => {
      if (result.quickActions) {
        setActions(result.quickActions)
      }
      if (result.actionCategories) {
        setCategories(result.actionCategories)
      }
    })
  }, [])

  const saveAction = () => {
    if (!name || !url) return

    const newActions = [...actions]
    
    if (currentAction) {
      const index = newActions.findIndex(a => a.id === currentAction.id)
      newActions[index] = {
        ...currentAction,
        name,
        url,
        shortcut,
        category
      }
    } else {
      newActions.push({
        id: Date.now().toString(),
        name,
        url,
        shortcut,
        category
      })
    }

    setActions(newActions)
    chrome.storage.local.set({ quickActions: newActions })

    if (category && !categories.includes(category)) {
      const newCategories = [...categories, category]
      setCategories(newCategories)
      chrome.storage.local.set({ actionCategories: newCategories })
    }

    resetForm()
  }

  const deleteAction = (id: string) => {
    const newActions = actions.filter(action => action.id !== id)
    setActions(newActions)
    chrome.storage.local.set({ quickActions: newActions })
  }

  const editAction = (action: QuickAction) => {
    setCurrentAction(action)
    setName(action.name)
    setUrl(action.url)
    setShortcut(action.shortcut)
    setCategory(action.category)
    setIsModalVisible(true)
  }

  const resetForm = () => {
    setCurrentAction(null)
    setName('')
    setUrl('')
    setShortcut('')
    setCategory('')
    setIsModalVisible(false)
  }

  const executeAction = (url: string) => {
    chrome.tabs.create({ url })
  }

  const filteredActions = actions.filter(action => {
    return categoryFilter === 'all' ? true : action.category === categoryFilter
  })

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

      <div className="flex gap-4">
        <Select
          className="w-40"
          value={categoryFilter}
          onChange={setCategoryFilter}
        >
          <Option value="all">Tất cả danh mục</Option>
          {categories.map(cat => (
            <Option key={cat} value={cat}>{cat}</Option>
          ))}
        </Select>
      </div>

      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={filteredActions}
        renderItem={action => (
          <List.Item>
            <Card
              actions={[
                <Button
                  type="text"
                  icon={<ThunderboltOutlined />}
                  onClick={() => executeAction(action.url)}
                />,
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => editAction(action)}
                />,
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteAction(action.id)}
                />
              ]}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LinkOutlined className="text-gray-400" />
                  <Text strong>{action.name}</Text>
                </div>
                {action.shortcut && (
                  <Text keyboard className="text-sm">
                    {action.shortcut}
                  </Text>
                )}
                {action.category && (
                  <div>
                    <Text type="secondary" className="text-sm">
                      {action.category}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={currentAction ? 'Sửa thao tác' : 'Thêm thao tác'}
        open={isModalVisible}
        onOk={saveAction}
        onCancel={resetForm}
      >
        <div className="space-y-4">
          <div>
            <Text>Tên thao tác</Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Mở Gmail"
            />
          </div>

          <div>
            <Text>URL</Text>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Text>Phím tắt (tùy chọn)</Text>
            <Input
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              placeholder="VD: Ctrl+Shift+G"
            />
          </div>

          <div>
            <Text>Danh mục</Text>
            <Select
              className="w-full"
              value={category}
              onChange={setCategory}
              showSearch
              allowClear
              placeholder="Chọn hoặc thêm danh mục mới"
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default QuickActions 