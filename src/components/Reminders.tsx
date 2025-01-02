import { useState, useEffect } from 'react'
import { Card, Button, Input, InputNumber, Switch, Typography, Modal, message } from 'antd'
import { PlusOutlined, BellOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface Reminder {
  id: string
  title: string
  message: string
  interval: number // phút
  isActive: boolean
  nextTrigger?: number
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newReminder, setNewReminder] = useState<Omit<Reminder, 'id'>>({
    title: '',
    message: '',
    interval: 30,
    isActive: true
  })

  useEffect(() => {
    loadReminders()
  }, [])

  const loadReminders = () => {
    chrome.storage.sync.get(['reminders'], (result) => {
      if (result.reminders) {
        setReminders(result.reminders)
      }
    })
  }

  const addReminder = () => {
    if (!newReminder.title || !newReminder.message) {
      message.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      ...newReminder,
      nextTrigger: Date.now() + newReminder.interval * 60 * 1000
    }

    const updatedReminders = [...reminders, reminder]
    setReminders(updatedReminders)
    chrome.storage.sync.set({ reminders: updatedReminders })

    if (reminder.isActive) {
      chrome.alarms.create(reminder.id, {
        periodInMinutes: reminder.interval,
        when: Date.now() + reminder.interval * 60 * 1000
      })
    }

    setIsModalVisible(false)
    setNewReminder({
      title: '',
      message: '',
      interval: 30,
      isActive: true
    })
    message.success('Đã thêm nhắc nhở mới')
  }

  const toggleReminder = (reminder: Reminder) => {
    const updatedReminder = { 
      ...reminder, 
      isActive: !reminder.isActive,
      nextTrigger: Date.now() + reminder.interval * 60 * 1000
    }
    const updatedReminders = reminders.map(r => 
      r.id === reminder.id ? updatedReminder : r
    )
    
    setReminders(updatedReminders)
    chrome.storage.sync.set({ reminders: updatedReminders })

    if (updatedReminder.isActive) {
      chrome.alarms.create(reminder.id, {
        periodInMinutes: reminder.interval,
        when: Date.now() + reminder.interval * 60 * 1000
      })
      message.success('Đã bật nhắc nhở')
    } else {
      chrome.alarms.clear(reminder.id)
      message.success('Đã tắt nhắc nhở')
    }
  }

  const removeReminder = (reminderId: string) => {
    const updatedReminders = reminders.filter(r => r.id !== reminderId)
    setReminders(updatedReminders)
    chrome.storage.sync.set({ reminders: updatedReminders })
    chrome.alarms.clear(reminderId)
    message.success('Đã xóa nhắc nhở')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4}>Quản lý nhắc nhở</Title>
        <Button 
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm nhắc nhở
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reminders.map(reminder => (
          <Card key={reminder.id} className="shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Title level={5} className="!mb-0">{reminder.title}</Title>
                <Text className="text-gray-500">{reminder.message}</Text>
                <div className="flex items-center gap-2">
                  <BellOutlined className="text-gray-400" />
                  <Text className="text-gray-500">
                    {reminder.interval} phút một lần
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={reminder.isActive}
                  onChange={() => toggleReminder(reminder)}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeReminder(reminder.id)}
                />
              </div>
            </div>
          </Card>
        ))}

        {reminders.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Chưa có nhắc nhở nào
          </div>
        )}
      </div>

      <Modal
        title="Thêm nhắc nhở mới"
        open={isModalVisible}
        onOk={addReminder}
        onCancel={() => setIsModalVisible(false)}
      >
        <div className="space-y-4">
          <div>
            <Text>Tiêu đề</Text>
            <Input
              value={newReminder.title}
              onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ví dụ: Uống nước"
            />
          </div>

          <div>
            <Text>Nội dung thông báo</Text>
            <Input.TextArea
              value={newReminder.message}
              onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Nội dung sẽ hiển thị trong thông báo"
            />
          </div>

          <div>
            <Text>Thời gian lặp lại (phút)</Text>
            <InputNumber
              min={1}
              max={1440}
              value={newReminder.interval}
              onChange={(value) => value && setNewReminder(prev => ({ ...prev, interval: value }))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Text>Bật ngay</Text>
            <Switch
              checked={newReminder.isActive}
              onChange={(checked) => setNewReminder(prev => ({ ...prev, isActive: checked }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Reminders