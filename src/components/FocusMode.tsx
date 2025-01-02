import { useState, useEffect } from 'react'
import { Card, Button, Input, Switch, Typography, Modal, message, List } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface FocusRule {
  id: string
  name: string
  urls: string[]
  isActive: boolean
}

const FocusMode = () => {
  const [rules, setRules] = useState<FocusRule[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<FocusRule | null>(null)
  const [newRule, setNewRule] = useState<Omit<FocusRule, 'id'>>({
    name: '',
    urls: [],
    isActive: true
  })
  const [tempUrl, setTempUrl] = useState('')

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = () => {
    chrome.storage.sync.get(['focusRules'], (result) => {
      if (result.focusRules) {
        setRules(result.focusRules)
      }
    })
  }

  const addUrl = () => {
    if (!tempUrl) return

    if (editingRule) {
      setEditingRule({
        ...editingRule,
        urls: [...editingRule.urls, tempUrl]
      })
    } else {
      setNewRule(prev => ({
        ...prev,
        urls: [...prev.urls, tempUrl]
      }))
    }
    setTempUrl('')
  }

  const removeUrl = (url: string) => {
    if (editingRule) {
      setEditingRule({
        ...editingRule,
        urls: editingRule.urls.filter(u => u !== url)
      })
    } else {
      setNewRule(prev => ({
        ...prev,
        urls: prev.urls.filter(u => u !== url)
      }))
    }
  }

  const saveRule = () => {
    const ruleToSave = editingRule || {
      id: Date.now().toString(),
      ...newRule
    }

    if (!ruleToSave.name || ruleToSave.urls.length === 0) {
      message.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    const updatedRules = editingRule
      ? rules.map(r => r.id === editingRule.id ? ruleToSave : r)
      : [...rules, ruleToSave]

    setRules(updatedRules)
    chrome.storage.sync.set({ focusRules: updatedRules })

    setIsModalVisible(false)
    setEditingRule(null)
    setNewRule({
      name: '',
      urls: [],
      isActive: true
    })
    message.success(editingRule ? 'Đã cập nhật quy tắc' : 'Đã thêm quy tắc mới')
  }

  const toggleRule = (rule: FocusRule) => {
    const updatedRule = { ...rule, isActive: !rule.isActive }
    const updatedRules = rules.map(r => 
      r.id === rule.id ? updatedRule : r
    )
    
    setRules(updatedRules)
    chrome.storage.sync.set({ focusRules: updatedRules })

    // Gửi message đến background script để cập nhật chặn
    chrome.runtime.sendMessage({
      type: 'UPDATE_FOCUS_RULES',
      rules: updatedRules
    })

    message.success(updatedRule.isActive ? 'Đã bật chế độ tập trung' : 'Đã tắt chế độ tập trung')
  }

  const removeRule = (ruleId: string) => {
    const updatedRules = rules.filter(r => r.id !== ruleId)
    setRules(updatedRules)
    chrome.storage.sync.set({ focusRules: updatedRules })
    message.success('Đã xóa quy tắc')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4}>Chế độ tập trung</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm quy tắc
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map(rule => (
          <Card key={rule.id} className="shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Title level={5} className="!mb-0">{rule.name}</Title>
                <div className="space-y-1">
                  {rule.urls.map(url => (
                    <Text key={url} className="block text-gray-500">
                      {url}
                    </Text>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.isActive}
                  onChange={() => toggleRule(rule)}
                />
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingRule(rule)
                    setIsModalVisible(true)
                  }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeRule(rule.id)}
                />
              </div>
            </div>
          </Card>
        ))}

        {rules.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Chưa có quy tắc nào
          </div>
        )}
      </div>

      <Modal
        title={editingRule ? 'Sửa quy tắc' : 'Thêm quy tắc mới'}
        open={isModalVisible}
        onOk={saveRule}
        onCancel={() => {
          setIsModalVisible(false)
          setEditingRule(null)
          setNewRule({
            name: '',
            urls: [],
            isActive: true
          })
          setTempUrl('')
        }}
      >
        <div className="space-y-4">
          <div>
            <Text>Tên quy tắc</Text>
            <Input
              value={editingRule?.name || newRule.name}
              onChange={(e) => {
                if (editingRule) {
                  setEditingRule({ ...editingRule, name: e.target.value })
                } else {
                  setNewRule(prev => ({ ...prev, name: e.target.value }))
                }
              }}
              placeholder="Ví dụ: Tập trung học tập"
            />
          </div>

          <div>
            <Text>Thêm URL</Text>
            <div className="flex gap-2">
              <Input
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="Nhập URL cần chặn (ví dụ: facebook.com)"
                onPressEnter={addUrl}
              />
              <Button onClick={addUrl}>Thêm</Button>
            </div>
          </div>

          <List
            size="small"
            bordered
            dataSource={editingRule?.urls || newRule.urls}
            renderItem={url => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeUrl(url)}
                  />
                ]}
              >
                {url}
              </List.Item>
            )}
          />

          <div className="flex items-center justify-between">
            <Text>Bật ngay</Text>
            <Switch
              checked={editingRule?.isActive || newRule.isActive}
              onChange={(checked) => {
                if (editingRule) {
                  setEditingRule({ ...editingRule, isActive: checked })
                } else {
                  setNewRule(prev => ({ ...prev, isActive: checked }))
                }
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default FocusMode 