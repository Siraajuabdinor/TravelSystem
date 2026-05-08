import React from 'react';
import { TrendingUp, Truck, Map } from 'lucide-react';

export default function MetricsRow() {
  return (
    <div className="metrics-row">
      <div className="card revenue-card">
        <div className="revenue-title">LIVE REVENUE</div>
        <div className="revenue-amount">$4,281,092.40</div>
        <div className="revenue-increase">
          <TrendingUp size={16} />
          +12.4% from last period
        </div>
        {/* SVG Graph Placeholder */}
        <svg className="revenue-graph" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path d="M0,80 Q40,40 100,60 T200,20 L200,100 L0,100 Z" fill="rgba(45, 212, 191, 0.1)" />
          <path d="M0,80 Q40,40 100,60 T200,20" fill="none" stroke="var(--accent)" strokeWidth="3" />
        </svg>
      </div>

      <div className="card">
        <div className="metric-header">
          <div className="metric-icon icon-accent">
            <Truck size={20} />
          </div>
          <div className="metric-label">98% Efficient</div>
        </div>
        <div className="metric-value-title">Active Fleet</div>
        <div className="metric-value">1,204</div>
        <div className="metric-progress">
          <div className="metric-progress-bar"></div>
        </div>
      </div>

      <div className="card">
        <div className="metric-header">
          <div className="metric-icon icon-navy">
            <Map size={20} />
          </div>
          <div className="metric-label">Global Reach</div>
        </div>
        <div className="metric-value-title">Active Routes</div>
        <div className="metric-value">482</div>
        <div className="avatars-group">
          <div className="av"></div>
          <div className="av" style={{ backgroundColor: '#94a3b8' }}></div>
          <div className="av" style={{ backgroundColor: '#cbd5e1' }}></div>
          <div className="av av-more">+24</div>
        </div>
      </div>
    </div>
  );
}
