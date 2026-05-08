import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">Kinetic Logistics</h1>
        <nav className="header-links">
          <a href="#">Fleet</a>
          <a href="#">Routes</a>
          <a href="#">Capacity</a>
        </nav>
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input type="text" placeholder="Global search..." />
        </div>
        
        <div className="header-actions">
          <button className="icon-btn">
            <Bell size={20} />
            <span className="badge"></span>
          </button>
          <button className="icon-btn">
            <Settings size={20} />
          </button>
          <div className="avatar">
            <img src="https://i.pravatar.cc/150?img=11" alt="User Avatar" />
          </div>
        </div>
      </div>
    </header>
  );
}
