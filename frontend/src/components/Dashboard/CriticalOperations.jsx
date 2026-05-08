import React from 'react';
import { Navigation, Compass, Truck, ChevronRight, ChevronLeft } from 'lucide-react';

export default function CriticalOperations() {
  return (
    <div className="table-container">
      <div className="section-header">
        <div className="section-title">
          Critical Operations <span className="tag-live">LIVE</span>
        </div>
        <div className="header-buttons">
          <button className="btn-secondary">Export CSV</button>
          <button className="btn-secondary">Filters</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ASSET ID</th>
            <th>ROUTE</th>
            <th>LOAD</th>
            <th>ETA</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="asset-cell">
                <div className="asset-icon"><Navigation size={18} /></div>
                <b>KP-9021</b>
              </div>
            </td>
            <td>
              <div className="route-cell">
                <b>Chicago</b> <ChevronRight size={14} className="font-light" /> <span className="font-light">Miami</span>
              </div>
            </td>
            <td>
              18,400<br /><span className="font-light">kg</span>
            </td>
            <td>
              14:20<br /><span className="font-light">GMT</span>
            </td>
            <td>
              <span className="status-tag status-success">ON TRACK</span>
            </td>
          </tr>

          <tr>
            <td>
              <div className="asset-cell">
                <div className="asset-icon" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}><Truck size={18} /></div>
                <b>KP-1144</b>
              </div>
            </td>
            <td>
              <div className="route-cell">
                <b>Berlin</b> <ChevronRight size={14} className="font-light" /> <span className="font-light">Warsaw</span>
              </div>
            </td>
            <td>
              12,100<br /><span className="font-light">kg</span>
            </td>
            <td>
              16:45<br /><span className="font-light">GMT</span>
            </td>
            <td>
              <span className="status-tag status-primary">LOADING</span>
            </td>
          </tr>

          <tr>
            <td>
              <div className="asset-cell">
                <div className="asset-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}><Compass size={18} /></div>
                <b>KP-A004</b>
              </div>
            </td>
            <td>
              <div className="route-cell">
                <b>Tokyo</b> <ChevronRight size={14} className="font-light" /> <span className="font-light">LAX</span>
              </div>
            </td>
            <td>
              4,500<br /><span className="font-light">kg</span>
            </td>
            <td>
              08:00<br /><span className="font-light">GMT</span>
            </td>
            <td>
              <span className="status-tag status-danger">DELAYED</span>
            </td>
          </tr>

          <tr>
            <td>
              <div className="asset-cell">
                <div className="asset-icon" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}><Truck size={18} /></div>
                <b>KP-2291</b>
              </div>
            </td>
            <td>
              <div className="route-cell">
                <b>Austin</b> <ChevronRight size={14} className="font-light" /> <span className="font-light">Seattle</span>
              </div>
            </td>
            <td>
              22,000<br /><span className="font-light">kg</span>
            </td>
            <td>
              21:15<br /><span className="font-light">GMT</span>
            </td>
            <td>
              <span className="status-tag status-success">IN TRANSIT</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="table-footer">
        <span>Showing 4 of 482 active routes</span>
        <div className="pagination">
          <button className="icon-btn"><ChevronLeft size={16} /></button>
          <button className="icon-btn"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
