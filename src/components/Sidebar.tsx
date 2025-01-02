import { NavLink } from 'react-router-dom'
import { 
  HomeIcon, 
  WindowIcon, 
  ShieldCheckIcon,
  BellIcon,
  CogIcon 
} from '@heroicons/react/24/outline'

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Dashboard' },
    { path: '/tabs', icon: WindowIcon, label: 'Quản lý Tab' },
    { path: '/blocker', icon: ShieldCheckIcon, label: 'Chặn Web' },
    { path: '/reminders', icon: BellIcon, label: 'Nhắc nhở' },
    { path: '/settings', icon: CogIcon, label: 'Cài đặt' },
  ]

  return (
    <nav className="w-16 bg-gray-800 flex flex-col items-center py-4">
      {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `p-3 mb-2 rounded-lg hover:bg-gray-700 transition-colors ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
          title={label}
        >
          <Icon className="w-6 h-6 text-white" />
        </NavLink>
      ))}
    </nav>
  )
}

export default Sidebar 