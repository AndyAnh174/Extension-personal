import { useState, useEffect } from 'react'
import { Button, Card, Progress, Select, Typography, notification } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, RedoOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

interface PomodoroSettings {
  workTime: number
  breakTime: number
  longBreakTime: number
  longBreakInterval: number
}

const defaultSettings: PomodoroSettings = {
  workTime: 25,
  breakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4
}

const Pomodoro = () => {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings)
  const [timeLeft, setTimeLeft] = useState(settings.workTime * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isWorkTime, setIsWorkTime] = useState(true)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [totalWorkTime, setTotalWorkTime] = useState(0)

  useEffect(() => {
    // Lấy cài đặt từ storage
    chrome.storage.local.get(['pomodoroSettings', 'totalWorkTime'], (result) => {
      if (result.pomodoroSettings) {
        setSettings(result.pomodoroSettings)
      }
      if (result.totalWorkTime) {
        setTotalWorkTime(result.totalWorkTime)
      }
    })
  }, [])

  useEffect(() => {
    let interval: number | null = null

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(time => time - 1)
        if (isWorkTime) {
          setTotalWorkTime(prev => prev + 1)
        }
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [isRunning, timeLeft, isWorkTime])

  const handleTimerComplete = () => {
    notification.info({
      message: isWorkTime ? 'Đã đến giờ nghỉ!' : 'Đã đến giờ làm việc!',
      description: isWorkTime ? 'Hãy nghỉ ngơi một chút.' : 'Hãy bắt đầu công việc.',
      placement: 'topRight'
    })

    if (isWorkTime) {
      setSessionsCompleted(prev => prev + 1)
      const isLongBreak = sessionsCompleted + 1 >= settings.longBreakInterval
      setTimeLeft(isLongBreak ? settings.longBreakTime * 60 : settings.breakTime * 60)
      if (isLongBreak) {
        setSessionsCompleted(0)
      }
    } else {
      setTimeLeft(settings.workTime * 60)
    }
    
    setIsWorkTime(prev => !prev)
    setIsRunning(false)

    // Lưu tổng thời gian làm việc
    chrome.storage.local.set({ totalWorkTime })
  }

  const toggleTimer = () => {
    setIsRunning(prev => !prev)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(settings.workTime * 60)
    setIsWorkTime(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      <Title level={4}>Pomodoro Timer</Title>

      <Card className="text-center">
        <div className="mb-8">
          <Progress
            type="circle"
            percent={(timeLeft / (settings.workTime * 60)) * 100}
            format={() => formatTime(timeLeft)}
            status={isWorkTime ? 'active' : 'success'}
            size={200}
          />
        </div>

        <div className="space-x-4">
          <Button
            type="primary"
            size="large"
            icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={toggleTimer}
          >
            {isRunning ? 'Tạm dừng' : 'Bắt đầu'}
          </Button>
          <Button
            size="large"
            icon={<RedoOutlined />}
            onClick={resetTimer}
          >
            Đặt lại
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <Text>Phiên làm việc: {sessionsCompleted}/{settings.longBreakInterval}</Text>
          </div>
          <div>
            <Text>Tổng thời gian làm việc: {formatTotalTime(totalWorkTime)}</Text>
          </div>
        </div>
      </Card>

      <Card title="Cài đặt">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text>Thời gian làm việc</Text>
            <Select
              className="w-full"
              value={settings.workTime}
              onChange={(value) => {
                const newSettings = { ...settings, workTime: value }
                setSettings(newSettings)
                chrome.storage.local.set({ pomodoroSettings: newSettings })
                if (isWorkTime) setTimeLeft(value * 60)
              }}
            >
              {[15, 25, 30, 45, 60].map(mins => (
                <Option key={mins} value={mins}>{mins} phút</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>Thời gian nghỉ ngắn</Text>
            <Select
              className="w-full"
              value={settings.breakTime}
              onChange={(value) => {
                const newSettings = { ...settings, breakTime: value }
                setSettings(newSettings)
                chrome.storage.local.set({ pomodoroSettings: newSettings })
                if (!isWorkTime) setTimeLeft(value * 60)
              }}
            >
              {[5, 10, 15].map(mins => (
                <Option key={mins} value={mins}>{mins} phút</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>Thời gian nghỉ dài</Text>
            <Select
              className="w-full"
              value={settings.longBreakTime}
              onChange={(value) => {
                const newSettings = { ...settings, longBreakTime: value }
                setSettings(newSettings)
                chrome.storage.local.set({ pomodoroSettings: newSettings })
              }}
            >
              {[15, 20, 30].map(mins => (
                <Option key={mins} value={mins}>{mins} phút</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>Số phiên trước nghỉ dài</Text>
            <Select
              className="w-full"
              value={settings.longBreakInterval}
              onChange={(value) => {
                const newSettings = { ...settings, longBreakInterval: value }
                setSettings(newSettings)
                chrome.storage.local.set({ pomodoroSettings: newSettings })
              }}
            >
              {[2, 3, 4, 5, 6].map(count => (
                <Option key={count} value={count}>{count} phiên</Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Pomodoro 