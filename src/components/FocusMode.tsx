import { useState, useEffect } from 'react'
import { Button, Card, Input, List, Typography, TimePicker, Switch, Tag } from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined,
  ClockCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface FocusRule {
  id: string
  url: string
  startTime: string
  endTime: string
  isActive: boolean
  timeSpent: number
}

const FocusMode = () => {
  const [rules, setRules] = useState<FocusRule[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [startTime, setStartTime] = useState<dayjs.Dayjs>(dayjs().hour(9).minute(0))
  const [endTime, setEndTime] = useState<dayjs.Dayjs>(dayjs().hour(17).minute(0))
  const [isFocusModeOn, setIsFocusModeOn] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['focusRules', 'isFocusModeOn'], (result) => {
      if (result.focusRules) {
        setRules(result.focusRules)
      }
      if (typeof result.isFocusModeOn === 'boolean') {
        setIsFocusModeOn(result.isFocusModeOn)
      }
    })
  }, [])

  useEffect(() => {
    // Lưu trạng thái Focus Mode
    chrome.storage.local.set({ isFocusModeOn })

    if (isFocusModeOn) {
      // Bắt đầu theo dõi thời gian truy cập
      startTracking()
    } else {
      // Dừng theo dõi
      stopTracking()
    }
  }, [isFocusModeOn])

  const startTracking = () => {
    // Thêm listener cho chrome.webNavigation
    chrome.webNavigation.onCompleted.addListener(handleNavigation)
  }

  const stopTracking = () => {
    // Xóa listener
    chrome.webNavigation.onCompleted.removeListener(handleNavigation)
  }

  const handleNavigation = (details: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
    const url = new URL(details.url).hostname
    const currentTime = dayjs()

    rules.forEach(rule => {
      if (rule.isActive && url.includes(rule.url)) {
        const start = dayjs(rule.startTime, 'HH:mm')
        const end = dayjs(rule.endTime, 'HH:mm')

        if (currentTime.isAfter(start) && currentTime.isBefore(end)) {
          // Chặn trang web
          chrome.tabs.update(details.tabId, { url: 'blocked.html' })

          // Cập nhật thời gian sử dụng
          const updatedRules = rules.map(r => {
            if (r.id === rule.id) {
              return { ...r, timeSpent: (r.timeSpent || 0) + 1 }
            }
            return r
          })
          setRules(updatedRules)
          chrome.storage.local.set({ focusRules: updatedRules })
        }
      }
    })
  }

  const addRule = () => {
    if (!newUrl) return

    const newRule: FocusRule = {
      id: Date.now().toString(),
      url: newUrl,
      startTime: startTime.format('HH:mm'),
      endTime: endTime.format('HH:mm'),
      isActive: true,
      timeSpent: 0
    }

    const updatedRules = [...rules, newRule]
    setRules(updatedRules)
    chrome.storage.local.set({ focusRules: updatedRules })
    setNewUrl('')
  }

  const toggleRule = (id: string) => {
    const updatedRules = rules.map(rule => {
      if (rule.id === id) {
        return { ...rule, isActive: !rule.isActive }
      }
      return rule
    })
    setRules(updatedRules)
    chrome.storage.local.set({ focusRules: updatedRules })
  }

  const deleteRule = (id: string) => {
    const updatedRules = rules.filter(rule => rule.id !== id)
    setRules(updatedRules)
    chrome.storage.local.set({ focusRules: updatedRules })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4}>Chế độ tập trung</Title>
        <Switch
          checked={isFocusModeOn}
          onChange={setIsFocusModeOn}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      </div>

      <Card title="Thêm quy tắc mới">
        <div className="space-y-4">
          <div>
            <Text>URL trang web</Text>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="facebook.com"
            />
          </div>

          <div className="flex gap-4">
            <div>
              <Text>Thời gian bắt đầu</Text>
              <TimePicker
                value={startTime}
                onChange={(time) => time && setStartTime(time)}
                format="HH:mm"
                className="w-full"
              />
            </div>
            <div>
              <Text>Thời gian kết thúc</Text>
              <TimePicker
                value={endTime}
                onChange={(time) => time && setEndTime(time)}
                format="HH:mm"
                className="w-full"
              />
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addRule}
            block
          >
            Thêm quy tắc
          </Button>
        </div>
      </Card>

      <List
        dataSource={rules}
        renderItem={rule => (
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Text strong>{rule.url}</Text>
                <div className="space-x-2">
                  <Tag icon={<ClockCircleOutlined />}>
                    {rule.startTime} - {rule.endTime}
                  </Tag>
                  {rule.timeSpent > 0 && (
                    <Tag icon={<WarningOutlined />} color="red">
                      Đã chặn {formatTime(rule.timeSpent)}
                    </Tag>
                  )}
                </div>
              </div>
              <div className="space-x-2">
                <Switch
                  checked={rule.isActive}
                  onChange={() => toggleRule(rule.id)}
                  size="small"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteRule(rule.id)}
                />
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  )
}

export default FocusMode 