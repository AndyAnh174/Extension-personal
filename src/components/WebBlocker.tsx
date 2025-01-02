import { useState, useEffect } from 'react'
import { Input, TimePicker, Button, Card, List, Typography, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

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

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">Chặn Trang Web</Title>
      </div>

      <Card className="shadow-lg">
        <div className="space-y-4">
          <div>
            <Text strong>URL trang web</Text>
            <Input
              value={newSite.url}
              onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
              placeholder="Ví dụ: facebook.com"
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text strong>Thời gian bắt đầu</Text>
              <TimePicker
                className="w-full mt-2"
                value={dayjs(newSite.startTime, 'HH:mm')}
                onChange={(time) => 
                  setNewSite({ ...newSite, startTime: time?.format('HH:mm') || '09:00' })
                }
                format="HH:mm"
              />
            </div>
            <div>
              <Text strong>Thời gian kết thúc</Text>
              <TimePicker
                className="w-full mt-2"
                value={dayjs(newSite.endTime, 'HH:mm')}
                onChange={(time) => 
                  setNewSite({ ...newSite, endTime: time?.format('HH:mm') || '17:00' })
                }
                format="HH:mm"
              />
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addBlockedSite}
            className="w-full"
            size="large"
          >
            Thêm trang web
          </Button>
        </div>
      </Card>

      <div>
        <Title level={5} className="!mb-4">Danh sách trang web bị chặn</Title>
        <List
          dataSource={blockedSites}
          renderItem={site => (
            <Card className="mb-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text strong className="text-lg">{site.url}</Text>
                  <div className="mt-1">
                    <Text type="secondary">
                      {site.startTime} - {site.endTime}
                    </Text>
                  </div>
                </div>
                <Tooltip title="Xóa trang web này">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeSite(site.id)}
                  />
                </Tooltip>
              </div>
            </Card>
          )}
        />
      </div>
    </div>
  )
}

export default WebBlocker 