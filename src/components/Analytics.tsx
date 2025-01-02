import { useState, useEffect } from 'react'
import { Card, Typography, Progress, List, DatePicker } from 'antd'
import { 
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReadOutlined,
  FileTextOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

interface Article {
  id: string
  title: string
  isRead: boolean
  addedAt: number
}

interface Note {
  id: string
  content: string
  createdAt: number
}

interface FocusRule {
  id: string
  url: string
  timeSpent: number
}

interface Analytics {
  totalWorkTime: number
  completedTasks: number
  totalTasks: number
  blockedSites: number
  totalBlockedTime: number
  readArticles: number
  totalArticles: number
  totalNotes: number
}

const Analytics = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalWorkTime: 0,
    completedTasks: 0,
    totalTasks: 0,
    blockedSites: 0,
    totalBlockedTime: 0,
    readArticles: 0,
    totalArticles: 0,
    totalNotes: 0
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ])

  useEffect(() => {
    updateAnalytics()
  }, [dateRange])

  const updateAnalytics = () => {
    chrome.storage.local.get([
      'totalWorkTime',
      'tasks',
      'focusRules',
      'articles',
      'notes'
    ], (result) => {
      // Tổng thời gian làm việc
      const totalWorkTime = result.totalWorkTime || 0

      // Thống kê công việc
      const tasks = (result.tasks || []) as Task[]
      const filteredTasks = tasks.filter((task: Task) => {
        const taskDate = dayjs(task.createdAt)
        return taskDate.isAfter(dateRange[0]) && taskDate.isBefore(dateRange[1])
      })
      const completedTasks = filteredTasks.filter((task: Task) => task.completed).length
      const totalTasks = filteredTasks.length

      // Thống kê chặn web
      const focusRules = (result.focusRules || []) as FocusRule[]
      const blockedSites = focusRules.length
      const totalBlockedTime = focusRules.reduce((acc: number, rule: FocusRule) => acc + (rule.timeSpent || 0), 0)

      // Thống kê đọc bài viết
      const articles = (result.articles || []) as Article[]
      const filteredArticles = articles.filter((article: Article) => {
        const articleDate = dayjs(article.addedAt)
        return articleDate.isAfter(dateRange[0]) && articleDate.isBefore(dateRange[1])
      })
      const readArticles = filteredArticles.filter((article: Article) => article.isRead).length
      const totalArticles = filteredArticles.length

      // Thống kê ghi chú
      const notes = (result.notes || []) as Note[]
      const filteredNotes = notes.filter((note: Note) => {
        const noteDate = dayjs(note.createdAt)
        return noteDate.isAfter(dateRange[0]) && noteDate.isBefore(dateRange[1])
      })
      const totalNotes = filteredNotes.length

      setAnalytics({
        totalWorkTime,
        completedTasks,
        totalTasks,
        blockedSites,
        totalBlockedTime,
        readArticles,
        totalArticles,
        totalNotes
      })
    })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getTaskProgress = () => {
    if (analytics.totalTasks === 0) return 0
    return Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
  }

  const getReadingProgress = () => {
    if (analytics.totalArticles === 0) return 0
    return Math.round((analytics.readArticles / analytics.totalArticles) * 100)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <Title level={4} className="!mb-0">Thống kê hoạt động</Title>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]])
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-all hover:z-[99999] relative">
          <div className="flex items-start gap-6">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ClockCircleOutlined className="text-2xl text-blue-500" />
            </div>
            <div className="flex-1">
              <Text className="text-gray-600 block mb-2">Thời gian làm việc</Text>
              <Title level={3} className="!mb-1">
                {formatTime(analytics.totalWorkTime)}
              </Title>
              <Text type="secondary">Tổng thời gian</Text>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all hover:z-[99999] relative">
          <div className="flex items-start gap-6">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircleOutlined className="text-2xl text-green-500" />
            </div>
            <div className="flex-1">
              <Text className="text-gray-600 block mb-2">Công việc</Text>
              <Progress
                percent={getTaskProgress()}
                format={() => `${analytics.completedTasks}/${analytics.totalTasks}`}
                strokeColor="#10B981"
                className="!mb-1"
              />
              <Text type="secondary">Hoàn thành</Text>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all hover:z-[99999] relative">
          <div className="flex items-start gap-6">
            <div className="p-3 bg-red-50 rounded-lg">
              <StopOutlined className="text-2xl text-red-500" />
            </div>
            <div className="flex-1">
              <Text className="text-gray-600 block mb-2">Chặn web</Text>
              <Title level={3} className="!mb-1">
                {analytics.blockedSites}
              </Title>
              <Text type="secondary">
                Đã chặn {formatTime(analytics.totalBlockedTime)}
              </Text>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all hover:z-[99999] relative">
          <div className="flex items-start gap-6">
            <div className="p-3 bg-purple-50 rounded-lg">
              <ReadOutlined className="text-2xl text-purple-500" />
            </div>
            <div className="flex-1">
              <Text className="text-gray-600 block mb-2">Đọc bài viết</Text>
              <Progress
                percent={getReadingProgress()}
                format={() => `${analytics.readArticles}/${analytics.totalArticles}`}
                strokeColor="#8B5CF6"
                className="!mb-1"
              />
              <Text type="secondary">Đã đọc</Text>
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-all hover:z-[99999] relative">
        <div className="flex items-start gap-6">
          <div className="p-3 bg-orange-50 rounded-lg">
            <FileTextOutlined className="text-2xl text-orange-500" />
          </div>
          <div className="flex-1">
            <Text className="text-gray-600 block mb-2">Ghi chú</Text>
            <Title level={3} className="!mb-1">
              {analytics.totalNotes}
            </Title>
            <Text type="secondary">Ghi chú đã tạo</Text>
          </div>
        </div>
      </Card>

      <Card 
        title="Thống kê chi tiết" 
        className="shadow-sm hover:shadow-md transition-all hover:z-[99999] relative"
      >
        <List
          size="large"
          dataSource={[
            {
              label: 'Thời gian làm việc trung bình',
              value: formatTime(Math.round(analytics.totalWorkTime / dateRange[1].diff(dateRange[0], 'day')))
            },
            {
              label: 'Tỷ lệ hoàn thành công việc',
              value: `${getTaskProgress()}%`
            },
            {
              label: 'Số trang web đã chặn',
              value: analytics.blockedSites
            },
            {
              label: 'Thời gian đã tiết kiệm',
              value: formatTime(analytics.totalBlockedTime)
            },
            {
              label: 'Tỷ lệ đọc bài viết',
              value: `${getReadingProgress()}%`
            },
            {
              label: 'Số ghi chú trung bình mỗi ngày',
              value: (analytics.totalNotes / dateRange[1].diff(dateRange[0], 'day')).toFixed(1)
            }
          ]}
          renderItem={item => (
            <List.Item className="flex justify-between py-4">
              <Text className="text-gray-600">{item.label}</Text>
              <Text strong className="text-lg">{item.value}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Analytics 