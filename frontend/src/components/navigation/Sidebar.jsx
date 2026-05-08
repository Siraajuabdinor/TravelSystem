import { createElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronRight, Compass, LogOut, Plus, Settings } from 'lucide-react';
import { navigationItems } from '../../config/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  )

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="brand">
          <div className="brand-icon">
            <Compass size={20} />
          </div>
          <div>
            <div className="brand-title-row">Hayaan Wacan</div>
            <div className="brand-subtitle">TRANSPORT CONTROL PANEL</div>
          </div>
        </div>

        <div className="sidebar-section-label">Menu</div>
        <nav className="nav-menu">
          {visibleNavigationItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`.trim()
              }
            >
              <div className="nav-icon-wrap">
                {createElement(Icon, { size: 18 })}
              </div>
              <div className="nav-copy">
                <div>{label}</div>
              </div>
              <ChevronRight size={16} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-divider" />

        {user && (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user.full_name?.slice(0, 1)?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <div className="sidebar-user-name">{user.full_name}</div>
              <div className="sidebar-user-meta">
                {user.role} · {user.email}
              </div>
            </div>
          </div>
        )}

        <button className="btn-primary sidebar-cta" type="button">
          <Plus size={16} />
          Add New
        </button>

        <div className="sidebar-section-label sidebar-section-label-bottom">Others</div>
        <div className="sidebar-footer-nav">
          <button className="nav-item nav-item-muted" type="button">
            <div className="nav-icon-wrap">
              <Settings size={18} />
            </div>
            <div className="nav-copy">
              <div>Settings</div>
            </div>
            <ChevronRight size={16} className="nav-arrow" />
          </button>
          <button
            className="nav-item nav-item-muted nav-item-logout"
            type="button"
            onClick={handleLogout}
          >
            <div className="nav-icon-wrap">
              <LogOut size={18} />
            </div>
            <div className="nav-copy">
              <div>Logout</div>
            </div>
            <ChevronRight size={16} className="nav-arrow" />
          </button>
        </div>
      </div>
    </aside>
  );
}
