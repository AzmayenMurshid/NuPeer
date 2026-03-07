'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, HelpCircle, Users, Trophy } from 'lucide-react'

export function DashboardNavBar() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/upload',
      icon: Upload,
      label: 'Upload Transcript',
    },
    {
      href: '/help',
      icon: HelpCircle,
      label: 'Get Help',
    },
    {
      href: '/mentorship',
      icon: Users,
      label: 'Mentorship',
    },
    {
      href: '/leaderboard',
      icon: Trophy,
      label: 'Leaderboard',
    },
  ]

  return (
    <div className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto py-3 -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-500' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

