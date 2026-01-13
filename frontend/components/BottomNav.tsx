'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Upload, HelpCircle, User, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  // Don't show bottom nav on auth pages or landing page
  const hideNav = ['/login', '/register', '/'].includes(pathname) || !isAuthenticated

  if (hideNav) {
    return null
  }

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Home',
    },
    {
      href: '/calendar',
      icon: Calendar,
      label: 'Calendar',
    },
    {
      href: '/upload',
      icon: Upload,
      label: 'Upload',
    },
    {
      href: '/help',
      icon: HelpCircle,
      label: 'Help',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href === '/dashboard' && pathname === '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive
                  ? 'text-primary-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-500' : ''}`} />
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-primary-500' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95 dark:bg-black/95" />
    </nav>
  )
}

