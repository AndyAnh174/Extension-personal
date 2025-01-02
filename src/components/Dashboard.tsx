import { useEffect, useState } from 'react'
import { Card, Typography, Row, Col, Statistic, Timeline } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  BookOutlined,
  BellOutlined
} from '@ant-design/icons'

const { Title } = Typography

interface DashboardStats {
  openTabs: number
  focusTime: number
  completedTasks: number
  savedArticles: number
  upcomingReminders: Array<{
    id: string
    title: string
    time: string
  }>
  recentNotes: Array<{
    id: string
    title: string
    createdAt: string
  }>
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    openTabs: 0,
    focusTime: 0,
    completedTasks: 0,
    savedArticles: 0,
    upcomingReminders: [],
    recentNotes: []
  })

  useEffect(() => {
    // Lấy số tab đang mở
    chrome.tabs.query({}, (tabs) => {
      setStats(prev => ({ ...prev, openTabs: tabs.length }))
    })

    // Lấy dữ liệu từ storage
    chrome.storage.sync.get(['focusTime', 'tasks', 'articles', 'reminders', 'notes'], (result) => {
      const focusTime = result.focusTime || 0
      const completedTasks = (result.tasks || []).filter((t: any) => t.completed).length
      const savedArticles = (result.articles || []).length
      
      const upcomingReminders = (result.reminders || [])
        .filter((r: any) => r.isActive)
        .slice(0, 5)
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          time: new Date(r.nextTrigger).toLocaleTimeString()
        }))

      const recentNotes = (result.notes || [])
        .sort((a: any, b: any) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((n: any) => ({
          id: n.id,
          title: n.title,
          createdAt: new Date(n.createdAt).toLocaleDateString()
        }))

      setStats(prev => ({
        ...prev,
        focusTime,
        completedTasks,
        savedArticles,
        upcomingReminders,
        recentNotes
      }))
    })
  }, [])

  return (
    <div className="space-y-8">
      <Title level={4}>Tổng quan</Title>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tab đang mở"
              value={stats.openTabs}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Thời gian tập trung"
              value={Math.round(stats.focusTime / 60)}
              suffix="phút"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Công việc hoàn thành"
              value={stats.completedTasks}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Bài viết đã lưu"
              value={stats.savedArticles}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Nhắc nhở sắp tới" extra={<BellOutlined />}>
            <Timeline>
              {stats.upcomingReminders.map(reminder => (
                <Timeline.Item key={reminder.id}>
                  <div className="flex justify-between">
                    <span>{reminder.title}</span>
                    <span className="text-gray-500">{reminder.time}</span>
                  </div>
                </Timeline.Item>
              ))}
              {stats.upcomingReminders.length === 0 && (
                <div className="text-gray-500">Không có nhắc nhở nào sắp tới</div>
              )}
            </Timeline>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Ghi chú gần đây" extra={<BookOutlined />}>
            <Timeline>
              {stats.recentNotes.map(note => (
                <Timeline.Item key={note.id}>
                  <div className="flex justify-between">
                    <span>{note.title}</span>
                    <span className="text-gray-500">{note.createdAt}</span>
                  </div>
                </Timeline.Item>
              ))}
              {stats.recentNotes.length === 0 && (
                <div className="text-gray-500">Chưa có ghi chú nào</div>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard 