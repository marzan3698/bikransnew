import { useState, useEffect } from 'react'
import './AdminLayout.css'

function AdminLayout({ children, user, onLogout, activeTab, onTabChange }) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null) // 'theme-design' | 'video-editor' | null

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isDesktop) {
    return (
      <div className="admin-mobile-block">
        <div className="admin-mobile-content">
          <h1>Desktop Only</h1>
          <p>Admin panel is designed for desktop devices. Please use a screen width of at least 1024px.</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'users', label: 'User Management', icon: 'users' },
    { id: 'tasks', label: 'Task Management', icon: 'tasks' },
    { id: 'projects', label: 'প্রজেক্ট ম্যানেজমেন্ট', icon: 'projects' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    {
      id: 'theme-design',
      label: 'Theme Design',
      icon: 'theme',
      children: [
        { id: 'theme-sliders', label: 'Slider Management', icon: 'sliders' },
        { id: 'theme-header', label: 'Header Management', icon: 'header' },
        { id: 'theme-footer', label: 'Footer Management', icon: 'footer' },
        { id: 'theme-landing', label: 'ল্যান্ডিং পেজ ডিজাইন', icon: 'landing' },
      ],
    },
    {
      id: 'video-editor',
      label: 'ভিডিও এডিটর',
      icon: 'video-editor',
      children: [
        { id: 'video-editor-section-music', label: 'মিউজিক ম্যানেজমেন্ট', isSectionHeader: true },
        { id: 'music-add', label: 'নতুন মিউজিক অ্যাড করুন', icon: 'music' },
        { id: 'music-list', label: 'সকল মিউজিকের তালিকা', icon: 'list' },
        { id: 'video-editor-section-frame', label: 'ফ্রেম ম্যানেজমেন্ট', isSectionHeader: true },
        { id: 'frame-add', label: 'নতুন ফ্রেম অ্যাড করুন', icon: 'frame' },
        { id: 'frame-list', label: 'ফ্রেম তালিকা', icon: 'list' },
        { id: 'video-editor-section-monitor', label: 'ইউজার মনিটরিং', isSectionHeader: true },
        { id: 'user-monitor-used', label: 'যারা ব্যবহার করেছে', icon: 'users' },
        { id: 'user-monitor-partial', label: 'যারা আংশিক ব্যবহার করেছে', icon: 'users' },
      ],
    },
    { id: 'plex-deployment', label: 'Plex Auto Deployment', icon: 'deploy' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]

  const renderIcon = (iconType) => {
    const icons = {
      dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      users: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      tasks: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      analytics: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      theme: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
      sliders: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      header: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      ),
      footer: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      ),
      landing: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      projects: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      'video-editor': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      music: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ),
      frame: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="7" y="7" width="10" height="10" />
        </svg>
      ),
      list: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      deploy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      settings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      logout: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
    }
    return icons[iconType] || null
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            {!sidebarCollapsed && <span className="brand-name">Bikrans</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Admin menu">
          <ul className="sidebar-nav-list">
            {navItems.map((item) => {
              if (item.children) {
                const hasActive = item.children.some((c) => !c.isSectionHeader && c.id === activeTab)
                const isOpen = (openDropdownId === item.id || hasActive) && !sidebarCollapsed
                return (
                  <li key={item.id} className="nav-dropdown">
                    <button
                      type="button"
                      className={`nav-item nav-item-parent ${hasActive ? 'active' : ''}`}
                      onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                    >
                      <span className="nav-icon">{renderIcon(item.icon)}</span>
                      {!sidebarCollapsed && (
                        <>
                          <span className="nav-label">{item.label}</span>
                          <span className={`nav-chevron ${isOpen ? 'open' : ''}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </>
                      )}
                    </button>
                    <ul className={`nav-dropdown-list ${isOpen ? 'open' : ''}`}>
                      {item.children.map((child) =>
                        child.isSectionHeader ? (
                          <li key={child.id} className="nav-section-header">
                            {!sidebarCollapsed && <span className="nav-section-label">{child.label}</span>}
                          </li>
                        ) : (
                          <li key={child.id}>
                            <button
                              type="button"
                              className={`nav-item nav-item-child ${activeTab === child.id ? 'active' : ''}`}
                              onClick={() => onTabChange(child.id)}
                            >
                              <span className="nav-icon">{renderIcon(child.icon)}</span>
                              {!sidebarCollapsed && <span className="nav-label">{child.label}</span>}
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  </li>
                )
              }
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => onTabChange(item.id)}
                  >
                    <span className="nav-icon">{renderIcon(item.icon)}</span>
                    {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <span className="logout-icon">{renderIcon('logout')}</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <div className="header-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" placeholder="Type text..." />
            </div>
          </div>
          <div className="header-right">
            <button className="header-icon-btn" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="header-icon-btn" title="Messages">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <div className="header-user-profile">
              <div className="header-user-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="header-user-info">
                <span className="header-user-role">{user?.role || 'Admin'}</span>
                <span className="header-user-name">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-content-bg">
            <div className="admin-content-video-wrap">
              <iframe
                src="https://www.youtube.com/embed/mfoRx20c7Us?autoplay=1&mute=1&loop=1&playlist=mfoRx20c7Us&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
                title="Background video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="admin-content-video"
              />
            </div>
            <div className="admin-content-gradient" />
            <div className="admin-content-orbs" />
          </div>
          <div className="admin-content-inner">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
