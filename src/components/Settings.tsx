import { useState, useEffect } from 'react'
import { Button, Card, Select, Typography, Switch, message, InputNumber, Divider, Radio } from 'antd'
import { useTheme } from '../contexts/ThemeContext'

const { Title, Text } = Typography
const { Option } = Select

interface Settings {
  theme: 'light' | 'dark'
  fontSize: number
  fontFamily: string
  notifications: boolean
  autoStart: boolean
  soundEnabled: boolean
  language: string
  startPage: string
  autoBackup: boolean
  backupInterval: number
}

const fontFamilies = [
  { value: 'system-ui', label: 'Mặc định hệ thống' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Inter', label: 'Inter' }
]

const startPages = [
  { value: '/', label: 'Trang chủ' },
  { value: '/tabs', label: 'Quản lý Tab' },
  { value: '/focus', label: 'Tập trung' },
  { value: '/tasks', label: 'Công việc' },
  { value: '/notes', label: 'Ghi chú' }
]

const Settings = () => {
  const { toggleTheme } = useTheme()
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    fontSize: 14,
    fontFamily: 'system-ui',
    notifications: true,
    autoStart: false,
    soundEnabled: true,
    language: 'vi',
    startPage: '/',
    autoBackup: false,
    backupInterval: 24
  })

  useEffect(() => {
    // Lấy cài đặt từ storage
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings)
      } else {
        // Nếu chưa có cài đặt, lưu cài đặt mặc định
        const defaultSettings: Settings = {
          theme: 'light' as const,
          fontSize: 14,
          fontFamily: 'system-ui',
          notifications: true,
          autoStart: false,
          soundEnabled: true,
          language: 'vi',
          startPage: 'dashboard',
          autoBackup: true,
          backupInterval: 24
        }
        chrome.storage.sync.set({ settings: defaultSettings })
        setSettings(defaultSettings)
      }
    })
  }, [])

  const applySettings = async (newSettings: Settings) => {
    try {
      // Lưu settings vào storage
      await chrome.storage.sync.set({ settings: newSettings })

      // Gửi message đến background script để áp dụng settings
      chrome.runtime.sendMessage({ 
        type: 'APPLY_SETTINGS',
        settings: newSettings
      })

      // Áp dụng theme
      if (newSettings.theme !== settings.theme) {
        toggleTheme()
      }

      message.success('Đã lưu và áp dụng cài đặt')
    } catch (error) {
      message.error('Có lỗi khi lưu cài đặt')
    }
  }

  const saveSettings = () => {
    applySettings(settings)
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const exportSettings = () => {
    const data = JSON.stringify(settings, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    chrome.downloads.download({
      url: url,
      filename: 'extension-settings.json',
      saveAs: true
    })
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        setSettings(importedSettings)
        applySettings(importedSettings)
        message.success('Đã nhập cài đặt thành công')
      } catch (error) {
        message.error('File không hợp lệ')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <Title level={4} className="!mb-0">Cài đặt</Title>
        <div className="space-x-2">
          <Button onClick={exportSettings}>
            Xuất cài đặt
          </Button>
          <Button onClick={() => document.getElementById('import-settings')?.click()}>
            Nhập cài đặt
          </Button>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importSettings}
          />
          <Button type="primary" onClick={saveSettings}>
            Lưu cài đặt
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <div className="space-y-6">
          <div>
            <Title level={5}>Giao diện</Title>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text>Chế độ tối</Text>
                <Switch
                  checked={settings.theme === 'dark'}
                  onChange={(checked) => updateSetting('theme', checked ? 'dark' : 'light')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Text>Font chữ</Text>
                <Select
                  value={settings.fontFamily}
                  onChange={(value) => updateSetting('fontFamily', value)}
                  style={{ width: 200 }}
                >
                  {fontFamilies.map(font => (
                    <Option key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Text>Cỡ chữ (px)</Text>
                <InputNumber
                  min={12}
                  max={20}
                  value={settings.fontSize}
                  onChange={(value) => value && updateSetting('fontSize', value)}
                  style={{ width: 100 }}
                />
              </div>
            </div>
          </div>

          <Divider />

          <div>
            <Title level={5}>Ngôn ngữ</Title>
            <Radio.Group
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full flex justify-start gap-8"
            >
              <Radio value="vi">Tiếng Việt</Radio>
              <Radio value="en">English</Radio>
            </Radio.Group>
          </div>

          <Divider />

          <div>
            <Title level={5}>Trang khởi động</Title>
            <Select
              value={settings.startPage}
              onChange={(value) => updateSetting('startPage', value)}
              style={{ width: '100%' }}
            >
              {startPages.map(page => (
                <Option key={page.value} value={page.value}>{page.label}</Option>
              ))}
            </Select>
          </div>

          <Divider />

          <div>
            <Title level={5}>Thông báo</Title>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text>Bật thông báo</Text>
                <Switch
                  checked={settings.notifications}
                  onChange={(checked) => updateSetting('notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Text>Bật âm thanh</Text>
                <Switch
                  checked={settings.soundEnabled}
                  onChange={(checked) => updateSetting('soundEnabled', checked)}
                />
              </div>
            </div>
          </div>

          <Divider />

          <div>
            <Title level={5}>Sao lưu</Title>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text>Tự động sao lưu</Text>
                <Switch
                  checked={settings.autoBackup}
                  onChange={(checked) => updateSetting('autoBackup', checked)}
                />
              </div>

              {settings.autoBackup && (
                <div className="flex items-center justify-between">
                  <Text>Thời gian sao lưu (giờ)</Text>
                  <InputNumber
                    min={1}
                    max={168}
                    value={settings.backupInterval}
                    onChange={(value) => value && updateSetting('backupInterval', value)}
                    style={{ width: 100 }}
                  />
                </div>
              )}
            </div>
          </div>

          <Divider />

          <div>
            <Title level={5}>Khác</Title>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text>Tự động khởi động</Text>
                <Switch
                  checked={settings.autoStart}
                  onChange={(checked) => updateSetting('autoStart', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Settings 