import React from 'react';
import { Plus } from 'lucide-react';

export default function BottomCards() {
  return (
    <div className="bottom-cards-row">
      {/* TOP PERFORMING DRIVERS */}
      <div>
        <h3 className="section-title" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Top Performing Drivers</h3>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="driver-item">
            <div className="driver-info">
              <img src="https://i.pravatar.cc/150?img=5" alt="Driver" className="driver-avatar" />
              <div>
                <div className="driver-name">Elena Rodriguez</div>
                <div className="driver-id">#DRV-0922</div>
              </div>
            </div>
            <div className="driver-score">
              <div className="score-val">4.9/5</div>
              <div className="score-label">SAFETY SCORE</div>
            </div>
          </div>
          <div className="driver-item">
            <div className="driver-info">
              <img src="https://i.pravatar.cc/150?img=12" alt="Driver" className="driver-avatar" />
              <div>
                <div className="driver-name">Marcus Chen</div>
                <div className="driver-id">#DRV-4410</div>
              </div>
            </div>
            <div className="driver-score">
              <div className="score-val">4.8/5</div>
              <div className="score-label">SAFETY SCORE</div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK FLEET ADD */}
      <div className="card quick-add-card">
        <div className="add-icon-circle">
          <Plus size={32} />
        </div>
        <h3>Quick Fleet Add</h3>
        <p>Register a new vehicle or driver to the global network</p>
        <button className="btn-primary" style={{ backgroundColor: 'black', color: 'white', width: 'auto', padding: '12px 24px' }}>
          Launch Registration
        </button>
      </div>
    </div>
  );
}
