import { useState, useEffect } from 'react'
import { Card, Typography, DatePicker, Select, Empty, Spin } from 'antd'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface AnalyticsData {
  timestamp: string
  type: string
  value: number
  metadata?: any
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const Analytics = () => {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ])
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [processedData, setProcessedData] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:3001/api/analytics/range?startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data)
      processData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processData = (data: AnalyticsData[]) => {
    // Nhóm dữ liệu theo ngày và loại
    const groupedData = data.reduce((acc: any, item) => {
      const date = dayjs(item.timestamp).format('DD/MM')
      if (!acc[date]) {
        acc[date] = {}
      }
      if (!acc[date][item.type]) {
        acc[date][item.type] = 0
      }
      acc[date][item.type] += item.value
      return acc
    }, {})

    // Chuyển đổi dữ liệu cho biểu đồ
    const chartData = Object.entries(groupedData).map(([date, values]: [string, any]) => ({
      date,
      ...values
    }))

    setProcessedData(chartData)
  }

  const renderChart = () => {
    if (loading) {
      return <div className="flex justify-center py-8"><Spin /></div>
    }

    if (!processedData.length) {
      return <Empty description="Không có dữ liệu" />
    }

    const dataKeys = Object.keys(processedData[0]).filter(key => key !== 'date')

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        // Tính tổng cho biểu đồ tròn
        const pieData = dataKeys.map(key => ({
          name: key,
          value: processedData.reduce((sum, item) => sum + (item[key] || 0), 0)
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4}>Thống kê</Title>
        <div className="flex items-center gap-4">
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 120 }}
          >
            <Option value="line">Đường</Option>
            <Option value="bar">Cột</Option>
            <Option value="pie">Tròn</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
        </div>
      </div>

      <Card>
        {renderChart()}
      </Card>

      <Card title="Chi tiết dữ liệu">
        <div className="space-y-4">
          {analyticsData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div>
                <div className="font-medium">{item.type}</div>
                <div className="text-sm text-gray-500">
                  {dayjs(item.timestamp).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
              <div className="font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default Analytics 