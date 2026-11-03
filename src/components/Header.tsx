import { useState } from 'react'
import type { Customer, Segment } from '../api/types'
import { Icon } from './Icon'

export function Header({ customer }: { customer?: Pick<Customer, 'firstName' | 'lastName'> }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light')
  const [segment, setSegment] = useState(() => document.documentElement.dataset.segment ?? 'retail')
  const names = [customer?.firstName ?? '', customer?.lastName ?? ''].map((name) => name.trim()).filter(Boolean)
  const fullName = names.join(' ')
  const initials = names
    .map((name) => Array.from(name)[0])
    .join('')
    .toUpperCase()

  function changePreference(key: 'theme' | 'segment', value: string) {
    document.documentElement.setAttribute(`data-${key}`, value)
    try {
      localStorage.setItem(`meridian-${key}`, value)
    } catch {
      // Keep the preference active when browser storage is unavailable.
    }
    if (key === 'theme') {
      setTheme(value)
    } else {
      setSegment(value)
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="wordmark" href="#main" aria-label="Meridian overview">
          <span className="logo-mark">M</span>Meridian
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#main" aria-current="page">
            Overview
          </a>
          {['Cards', 'Payments', 'Insights'].map((item) => (
            <button key={item} disabled>
              {item}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <div className="segment-switch" role="group" aria-label="Customer segment">
            {(['retail', 'premium'] as Segment[]).map((value) => (
              <button key={value} aria-pressed={segment === value} onClick={() => changePreference('segment', value)}>
                {value === 'retail' ? 'Retail' : 'Premium'}
              </button>
            ))}
          </div>
          <button
            className="icon-button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
            onClick={() => changePreference('theme', theme === 'dark' ? 'light' : 'dark')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <span className="avatar" role="img" aria-label={fullName || 'Account'}>
            {initials}
          </span>
        </div>
      </div>
    </header>
  )
}
