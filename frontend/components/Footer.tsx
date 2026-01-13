'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react'

export function Footer() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  // Don't show footer on auth pages
  const hideFooter = ['/login', '/register'].includes(pathname)

  if (hideFooter) {
    return null
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 mt-auto pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              NuPeer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Sigma Nu Zeta Chi
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect with brothers who can help with your classes
            </p>
          </div>

          {/* Quick Links */}
          {isAuthenticated && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calendar"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    Calendar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    Help Requests
                  </Link>
                </li>
                <li>
                  <Link
                    href="/upload"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    Upload Transcript
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    Profile
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* About Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              About
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              {!isAuthenticated && (
                <>
                  <li>
                    <Link
                      href="/register"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                    >
                      Get Started
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} NuPeer. All rights reserved.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/uhsigmanu/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Built for Sigma Nu Zeta Chi
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

