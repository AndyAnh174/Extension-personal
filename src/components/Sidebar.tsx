import { NavLink } from 'react-router-dom'
import { 
  HomeOutlined,
  AppstoreOutlined,
  StopOutlined,
  BellOutlined,
  SettingOutlined,
  BulbOutlined,
  FileTextOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { useTheme } from '../contexts/ThemeContext'

const Sidebar = () => {
  const { toggleTheme } = useTheme()
  
  const navItems = [
    { path: '/', icon: HomeOutlined, label: 'Trang chủ' },
    { path: '/tabs', icon: AppstoreOutlined, label: 'Quản lý Tab' },
    { path: '/blocker', icon: StopOutlined, label: 'Chặn Web' },
    { path: '/reminders', icon: BellOutlined, label: 'Nhắc nhở' },
    { path: '/notes', icon: FileTextOutlined, label: 'Ghi chú' },
    { path: '/reading-list', icon: BookOutlined, label: 'Đọc sau' },
    { path: '/focus', icon: ClockCircleOutlined, label: 'Tập trung' },
    { path: '/tasks', icon: CheckSquareOutlined, label: 'Công việc' },
    { path: '/quick-actions', icon: ThunderboltOutlined, label: 'Thao tác nhanh' },
    { path: '/meeting', icon: TeamOutlined, label: 'Họp' },
    { path: '/analytics', icon: BarChartOutlined, label: 'Thống kê' },
    { path: '/settings', icon: SettingOutlined, label: 'Cài đặt' }
  ]

  return (
    <div className="min-h-[600px] bg-white dark:bg-gray-800 flex flex-col items-center py-6 border-r border-gray-100 dark:border-gray-700">
      {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `w-16 h-16 mb-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              isActive 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`
          }
          data-tip={label}
        >
          <Icon className="text-xl" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
      
      <div className="flex-1" />
      
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-square w-16 h-16 tooltip tooltip-right flex flex-col items-center justify-center gap-1 hover:bg-base-300 transition-all"
        data-tip="Chuyển chế độ tối/sáng"
      >
        <BulbOutlined className="text-xl" />
        <span className="text-[10px] font-medium">Giao diện</span>
      </button>
    </div>
  )
}

export default Sidebar 