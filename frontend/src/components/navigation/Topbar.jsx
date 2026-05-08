import { Bell, Menu, MoonStar, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Topbar({ title, description }) {
  const { user } = useAuth()
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OT'

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="header-menu-btn" type="button" aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <div className="topbar-search search-bar">
          <Search size={16} />
          <input type="text" placeholder="Search or type command..." aria-label="Global search" />
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="icon-btn topbar-utility-btn" type="button" aria-label="Appearance">
            <MoonStar size={18} />
          </button>
          <button className="icon-btn topbar-utility-btn" type="button" aria-label="Notifications">
            <Bell size={18} />
            <span className="badge" />
          </button>
          <div className="topbar-user">
            <div className="avatar" title={description}>
              {initials}
            </div>
            <div className="topbar-user-copy">
              <strong>{user?.full_name ?? 'Operations team'}</strong>
              <span>{title}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
