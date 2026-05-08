import React from 'react';
import { AlertTriangle, TrendingUp, Map, Plus } from 'lucide-react';

export default function RightColumn() {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const heights = ['40%', '55%', '45%', '65%', '90%', '60%', '30%'];

  return (
    <div className="right-col" style={{ position: 'relative' }}>
      {/* PRIORITY ALERTS */}
      <div className="card alerts-card">
        <div className="alerts-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Priority Alerts
          </div>
          <div className="alert-count">3</div>
        </div>

        <div className="alert-item critical">
          <div className="alert-top">
            <span className="alert-title">Mechanical Failure</span>
            <span className="alert-time">2m ago</span>
          </div>
          <p className="alert-desc">Unit KP-A004 reported engine overheating. Rerouting emergency service.</p>
          <div className="alert-action">DISPATCH SUPPORT</div>
        </div>

        <div className="alert-item warning">
          <div className="alert-top">
            <span className="alert-title">Weather Alert</span>
            <span className="alert-time">14m ago</span>
          </div>
          <p className="alert-desc">Severe blizzard alert in Northern corridor. Route 12B suspended.</p>
        </div>

        <div className="alert-item amber">
          <div className="alert-top">
            <span className="alert-title">Low Fuel Warning</span>
            <span className="alert-time">48m ago</span>
          </div>
          <p className="alert-desc">Unit KP-2291 estimated fuel range below 50km. Nearest station at 32km.</p>
        </div>
      </div>

      {/* WEEKLY REVENUE TREND */}
      <div className="card chart-card">
        <div className="chart-header">
          <TrendingUp size={18} color="var(--accent)" /> Weekly Revenue Trend
        </div>
        
        <div className="chart-bars">
          {days.map((day, i) => {
            const isActive = day === 'FRI';
            return (
              <div className="bar-wrap" key={day}>
                <div className={`bar ${isActive ? 'active' : ''}`} style={{ height: heights[i], position: 'relative' }}>
                  {isActive && (
                    <div style={{ position: 'absolute', top: '-24px', left: '-10px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                      $108k
                    </div>
                  )}
                </div>
                <div className="bar-label">{day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAP CARD */}
      <div className="card map-card">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(45,212,191,0.2) 0%, transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent 100%)', backgroundSize: '100% 100%, 20px 20px', opacity: 0.3 }} />
        
        <div className="map-overlay">
          <div className="map-label">OPERATIONAL AREA</div>
          <div className="map-title">
            <Map size={16} color="var(--accent)" fill="var(--accent)" /> Pan-European Hub 4
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fab-button">
        <Plus size={24} />
      </button>
    </div>
  );
}
