import { useState, useEffect } from 'react';
import { Card, Typography, Tabs, DatePicker, Empty, Spin, Statistic, message } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import StorageLocationModal from './StorageLocationModal';

dayjs.extend(duration);

const { Title } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface WebsiteStats {
  domain: string;
  totalTime: number; // thời gian tính bằng giây
  visitCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [statsData, setStatsData] = useState<WebsiteStats[]>([]);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [showStorageModal, setShowStorageModal] = useState(false);

  useEffect(() => {
    checkStorageLocation();
  }, []);

  const checkStorageLocation = async () => {
    try {
      const { storageLocation } = await chrome.storage.local.get('storageLocation');
      if (!storageLocation) {
        setShowStorageModal(true);
      }
    } catch (error) {
      console.error('Error checking storage location:', error);
    }
  };

  const handleStorageLocationSave = async (values: { location: string }) => {
    try {
      const { storageLocation } = await chrome.storage.local.get('storageLocation');
      if (!storageLocation) {
        message.error('Chưa chọn thư mục lưu dữ liệu!');
        return;
      }

      message.success(`Đã thiết lập thư mục lưu dữ liệu: ${values.location}`);
      setShowStorageModal(false);
      await fetchStats();
    } catch (error) {
      console.error('Error saving storage location:', error);
      message.error('Không thể lưu cài đặt');
    }
  };

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
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const d = dayjs.duration(seconds, 'seconds');
    const hours = Math.floor(d.asHours());
    const minutes = d.minutes();
    return `${hours}h ${minutes}m`;
  };

  const renderTimeChart = () => {
    if (loading) return <div className="flex justify-center py-8"><Spin /></div>;
    if (!statsData.length) return <Empty description="Không có dữ liệu" />;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={statsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="domain" />
          <YAxis tickFormatter={(value) => formatTime(value)} />
          <Tooltip 
            formatter={(value: number) => formatTime(value)}
            labelFormatter={(label) => `Trang web: ${label}`}
          />
          <Legend />
          <Bar 
            name="Thời gian sử dụng" 
            dataKey="totalTime" 
            fill="#0088FE"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderVisitChart = () => {
    if (loading) return <div className="flex justify-center py-8"><Spin /></div>;
    if (!statsData.length) return <Empty description="Không có dữ liệu" />;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={statsData}
            dataKey="visitCount"
            nameKey="domain"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ domain, percent }) => 
              `${domain} (${(percent * 100).toFixed(0)}%)`
            }
          >
            {statsData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <Card title="Thời gian sử dụng theo trang web">
        {renderTimeChart()}
      </Card>

      <Card title="Số lượt truy cập theo trang web">
        {renderVisitChart()}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="Tổng thời gian sử dụng"
            value={formatTime(statsData.reduce((sum, item) => sum + item.totalTime, 0))}
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

      <StorageLocationModal
        visible={showStorageModal}
        onSave={handleStorageLocationSave}
      />
    </div>
  );
};

export default Dashboard; 