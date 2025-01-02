import { useState, useEffect } from 'react';
import { Card, Typography, Tabs, DatePicker, Empty, Spin, Statistic, Table, Tag, Tooltip, message } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { ClockCircleOutlined, LinkOutlined } from '@ant-design/icons';

dayjs.extend(duration);

const { Title } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface WebsiteStats {
  domain: string;
  totalTime: number;
  visitCount: number;
  lastVisit: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const formatTime = (seconds: number): string => {
  const d = dayjs.duration(seconds, 'seconds');
  if (d.asHours() >= 1) {
    return `${Math.floor(d.asHours())}h ${d.minutes()}m`;
  }
  return `${d.minutes()}m ${d.seconds()}s`;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [statsData, setStatsData] = useState<WebsiteStats[]>([]);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchStats();
  }, [dateRange, timeframe]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_STATS',
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString()
      });

      if (response.success) {
        setStatsData(response.data);
      } else {
        message.error('Không thể tải dữ liệu thống kê');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Có lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Trang web',
      dataIndex: 'domain',
      key: 'domain',
      render: (domain: string) => (
        <Tooltip title={`Mở ${domain}`}>
          <a 
            href={`https://${domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <LinkOutlined className="mr-2" />
            {domain}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Thời gian sử dụng',
      dataIndex: 'totalTime',
      key: 'totalTime',
      sorter: (a: WebsiteStats, b: WebsiteStats) => b.totalTime - a.totalTime,
      render: (time: number) => (
        <Tag icon={<ClockCircleOutlined />} color="blue">
          {formatTime(time)}
        </Tag>
      ),
    },
    {
      title: 'Số lần truy cập',
      dataIndex: 'visitCount',
      key: 'visitCount',
      sorter: (a: WebsiteStats, b: WebsiteStats) => b.visitCount - a.visitCount,
      render: (count: number) => (
        <Tag color="green">{count} lần</Tag>
      ),
    },
    {
      title: 'Lần cuối truy cập',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      sorter: (a: WebsiteStats, b: WebsiteStats) => b.lastVisit - a.lastVisit,
      render: (timestamp: number) => (
        <span>{dayjs(timestamp).format('DD/MM/YYYY HH:mm')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-md">
        <div className="mb-6">
          <Title level={4}>Thống kê sử dụng trình duyệt</Title>
          <div className="flex items-center gap-4">
            <Tabs 
              activeKey={timeframe} 
              onChange={(key) => setTimeframe(key as typeof timeframe)}
            >
              <TabPane tab="Ngày" key="day" />
              <TabPane tab="Tuần" key="week" />
              <TabPane tab="Tháng" key="month" />
              <TabPane tab="Năm" key="year" />
            </Tabs>
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : statsData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <Statistic
                  title="Tổng thời gian sử dụng"
                  value={formatTime(statsData.reduce((sum, item) => sum + item.totalTime, 0))}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
              <Card>
                <Statistic
                  title="Tổng lượt truy cập"
                  value={statsData.reduce((sum, item) => sum + item.visitCount, 0)}
                  suffix="lượt"
                />
              </Card>
              <Card>
                <Statistic
                  title="Trang web thường xuyên nhất"
                  value={statsData.length ? statsData.sort((a, b) => b.visitCount - a.visitCount)[0].domain : '-'}
                />
              </Card>
            </div>

            <Tabs defaultActiveKey="table">
              <TabPane tab="Bảng thống kê" key="table">
                <Table
                  columns={columns}
                  dataSource={statsData}
                  rowKey="domain"
                  pagination={{ pageSize: 10 }}
                  className="border rounded-lg"
                />
              </TabPane>
              <TabPane tab="Biểu đồ thời gian" key="time">
                <Card title="Thời gian sử dụng theo trang web">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="domain" />
                      <YAxis tickFormatter={(value) => formatTime(value)} />
                      <RechartsTooltip
                        formatter={(value: number) => formatTime(value)}
                      />
                      <Legend />
                      <Bar dataKey="totalTime" name="Thời gian sử dụng" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </TabPane>
              <TabPane tab="Biểu đồ truy cập" key="visits">
                <Card title="Số lượt truy cập theo trang web">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={statsData}
                        dataKey="visitCount"
                        nameKey="domain"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={(entry) => `${entry.domain} (${entry.visitCount})`}
                      >
                        {statsData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </TabPane>
            </Tabs>
          </>
        ) : (
          <Empty
            description={
              <span>
                Không có dữ liệu cho khoảng thời gian này
              </span>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default Dashboard; 