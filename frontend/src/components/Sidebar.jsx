import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Package,
  Compass,
  History,
  Map,
  Calendar,
  Users,
  Plus,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Compass size={24} />
        </div>
        <div>
          <div>Kinetic Precision</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.5px' }}>
            HIGH-VELOCITY LOGISTICS
          </div>
        </div>
      </div>

      <ul className="nav-menu">
        <li className="nav-item active">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </li>
        <li className="nav-item">
          <Truck size={20} />
          <span>Transport Management</span>
        </li>
        <li className="nav-item">
          <Package size={20} />
          <span>Cargo Management</span>
        </li>
        <li className="nav-item">
          <Map size={20} />
          <span>Routes and Locations</span>
        </li>
        <li className="nav-item">
          <Calendar size={20} />
          <span>Booking Management</span>
        </li>
        <li className="nav-item">
          <History size={20} />
          <span>History</span>
        </li>
        <li className="nav-item">
          <Users size={20} />
          <span>Users Management</span>
        </li>
      </ul>

      <div className="nav-bottom">
        <button className="btn-primary">
          <Plus size={18} />
          New Shipment
        </button>

        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <li className="nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </li>
          <li className="nav-item" style={{ color: 'var(--danger)' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
