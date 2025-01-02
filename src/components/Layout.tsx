import React from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="w-[800px] h-[600px] flex bg-gray-50 dark:bg-gray-900">
      <div className="w-24 flex-shrink-0 overflow-hidden hover:overflow-y-auto transition-all">
        <Sidebar />
      </div>
      <main className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout 