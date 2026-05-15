import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Map,
  MoreVertical,
  Navigation,
  Truck,
  UserCheck,
  Users,
} from 'lucide-react';
import { citiesService } from '../services/citiesService';
import { vehiclesService } from '../services/vehiclesService';
import { routesService } from '../services/routesService';
import { bookingsService } from '../services/bookingsService';
import { tripsService } from '../services/tripsService';
import { driversService } from '../services/driversService';
import { usersService } from '../services/usersService';

const monthlySales = [
  { month: 'Jan', value: 160 },
  { month: 'Feb', value: 360 },
  { month: 'Mar', value: 190 },
  { month: 'Apr', value: 290 },
  { month: 'May', value: 180 },
  { month: 'Jun', value: 190 },
  { month: 'Jul', value: 280 },
  { month: 'Aug', value: 110 },
  { month: 'Sep', value: 200 },
  { month: 'Oct', value: 370 },
  { month: 'Nov', value: 260 },
  { month: 'Dec', value: 110 },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    cities: 0,
    vehicles: 0,
    routes: 0,
    bookings: 0,
    trips: 0,
    drivers: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCounts() {
      setLoading(true);
      setError('');

      try {
        const [cities, vehicles, routes, bookings, trips, drivers, users] =
          await Promise.allSettled([
            citiesService.list(),
            vehiclesService.list(),
            routesService.list(),
            bookingsService.list(),
            tripsService.list(),
            driversService.list(),
            usersService.list(),
          ]);

        const safeCount = (result) =>
          result.status === 'fulfilled' && Array.isArray(result.value)
            ? result.value.length
            : 0;

        setCounts({
          cities: safeCount(cities),
          vehicles: safeCount(vehicles),
          routes: safeCount(routes),
          bookings: safeCount(bookings),
          trips: safeCount(trips),
          drivers: safeCount(drivers),
          users: safeCount(users),
        });
      } catch (dashboardError) {
        setError(dashboardError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCounts();
  }, []);

  const progress = useMemo(() => {
    if (!counts.vehicles) return 75.55;
    const value = (counts.routes / counts.vehicles) * 100;
    return Number(Math.min(96, Math.max(24, value)).toFixed(2));
  }, [counts.routes, counts.vehicles]);

  const summaryCards = [
    {
      key: 'bookings',
      title: 'Bookings',
      accent: 'up',
      change: '+8.20%',
      icon: CalendarCheck,
      color: '#eef4ff',
      iconColor: '#465fff',
    },
    {
      key: 'trips',
      title: 'Trips',
      accent: 'up',
      change: '+5.10%',
      icon: Navigation,
      color: '#f4f3ff',
      iconColor: '#7a5af8',
    },
    {
      key: 'drivers',
      title: 'Drivers',
      accent: 'up',
      change: '+3.40%',
      icon: UserCheck,
      color: '#ecfdf3',
      iconColor: '#12b76a',
    },
    {
      key: 'users',
      title: 'Users',
      accent: 'up',
      change: '+11.01%',
      icon: Users,
      color: '#fff7ed',
      iconColor: '#f79009',
    },
    {
      key: 'vehicles',
      title: 'Vehicles',
      accent: 'down',
      change: '+9.05%',
      icon: Truck,
      color: '#fef3f2',
      iconColor: '#f04438',
    },
    {
      key: 'routes',
      title: 'Routes',
      accent: 'up',
      change: '+6.70%',
      icon: Map,
      color: '#eef2ff',
      iconColor: '#3538cd',
    },
    {
      key: 'cities',
      title: 'Cities',
      accent: 'up',
      change: '+2.90%',
      icon: Building2,
      color: '#f0fdf4',
      iconColor: '#16a34a',
    },
  ];

  const statsTiles = [
    {
      label: 'Routes',
      value: loading ? '...' : counts.routes.toLocaleString(),
      trend: 'down',
    },
    {
      label: 'Coverage',
      value: loading ? '...' : `${Math.max(20, counts.cities * 10)}%`,
      trend: 'up',
    },
    {
      label: 'Revenue',
      value: loading ? '...' : `$${(counts.bookings * 150).toLocaleString()}`,
      trend: 'up',
    },
  ];

  const statHeights = [48, 76, 58, 88, 69, 52, 80];
  const circumference = 2 * Math.PI * 84;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="dashboard-stack">
      {error && <div className="form-message error">{error}</div>}

      {/* ── SUMMARY REPORT CARDS ── */}
      <section style={{ marginBottom: '8px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '0',
          }}
        >
          {summaryCards.map((card) => {
            const SummaryIcon = card.icon;
            return (
              <article
                key={card.key}
                className="dashboard-card summary-card"
                style={{
                  minHeight: '140px',
                  padding: '20px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow =
                    '0 16px 40px rgba(16,24,40,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div
                  className="summary-icon"
                  style={{
                    background: card.color,
                    color: card.iconColor,
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                  }}
                >
                  <SummaryIcon size={18} />
                </div>
                <p className="summary-label" style={{ marginTop: '14px' }}>
                  {card.title}
                </p>
                <div className="summary-value">
                  {loading ? (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '48px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#f2f4f7',
                        animation: 'pulse 1.4s ease infinite',
                      }}
                    />
                  ) : (
                    counts[card.key].toLocaleString()
                  )}
                </div>
                <div className={`summary-trend ${card.accent}`}>
                  {card.accent === 'up' ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  <span>{card.change}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── CHARTS & DETAILS ── */}
      <section className="dashboard-shell">
        <div className="dashboard-grid">
          <div className="dashboard-primary">
            {/* Monthly Sales Chart */}
            <article className="dashboard-card sales-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Monthly Bookings</h2>
                  <p>Overview of monthly booking activity</p>
                </div>
                <button
                  type="button"
                  className="ghost-icon-btn"
                  aria-label="More options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="sales-chart">
                {monthlySales.map((item) => (
                  <div key={item.month} className="sales-bar-group">
                    <div
                      className="sales-bar"
                      style={{
                        height: `${Math.max(36, (item.value / 400) * 100)}%`,
                      }}
                    />
                    <span>{item.month}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Statistics */}
            <article className="dashboard-card statistics-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Statistics</h2>
                  <p>Live system overview</p>
                </div>
                <div className="period-switch">
                  <button type="button" className="active">
                    Monthly
                  </button>
                  <button type="button">Quarterly</button>
                  <button type="button">Annually</button>
                </div>
              </div>

              <div className="statistics-content">
                <div className="statistics-copy">
                  <div className="statistics-big-number">
                    {loading ? '...' : counts.bookings.toLocaleString()}
                  </div>
                  <p>
                    Total bookings recorded across all active trips and routes.
                  </p>
                  <div className="statistics-mini-grid">
                    {statsTiles.map((tile) => (
                      <div key={tile.label} className="statistics-tile">
                        <span>{tile.label}</span>
                        <strong>{tile.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="statistics-visual">
                  {statHeights.map((height, index) => (
                    <div key={height} className="statistics-column-wrap">
                      <div
                        className={`statistics-column ${index === 4 ? 'active' : ''}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <aside className="dashboard-secondary">
            {/* Monthly Target Gauge */}
            <article className="dashboard-card target-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Monthly Target</h2>
                  <p>Target you&apos;ve set for each month</p>
                </div>
                <button
                  type="button"
                  className="ghost-icon-btn"
                  aria-label="More options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="target-gauge">
                <svg
                  viewBox="0 0 220 150"
                  className="target-gauge-svg"
                  aria-hidden="true"
                >
                  <path
                    d="M30 130 A80 80 0 0 1 190 130"
                    fill="none"
                    stroke="#eceef5"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M30 130 A80 80 0 0 1 190 130"
                    fill="none"
                    stroke="#465fff"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference / 2}
                    strokeDashoffset={dashOffset / 2}
                  />
                </svg>
                <div className="target-gauge-center">
                  <strong>{progress}%</strong>
                  <span>+10%</span>
                </div>
              </div>

              <p className="target-description">
                You have {loading ? '...' : counts.bookings.toLocaleString()}{' '}
                bookings and {loading ? '...' : counts.trips.toLocaleString()}{' '}
                active trips this month.
              </p>

              <div className="target-stats">
                {statsTiles.map((tile) => (
                  <div key={tile.label} className="target-stat">
                    <span>{tile.label}</span>
                    <strong>{tile.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            {/* Network Summary */}
            <article className="dashboard-card activity-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Network Summary</h2>
                  <p>Live backend snapshot</p>
                </div>
                <Map size={18} className="summary-header-icon" />
              </div>

              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-badge blue">
                    <CalendarCheck size={16} />
                  </div>
                  <div>
                    <strong>
                      {loading ? '...' : counts.bookings.toLocaleString()}{' '}
                      bookings
                    </strong>
                    <p>Total customer bookings in the system.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div
                    className="activity-badge"
                    style={{ background: '#fff7ed', color: '#f79009' }}
                  >
                    <Navigation size={16} />
                  </div>
                  <div>
                    <strong>
                      {loading ? '...' : counts.trips.toLocaleString()} trips
                    </strong>
                    <p>Active and scheduled trips across all routes.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div
                    className="activity-badge"
                    style={{ background: '#ecfdf3', color: '#12b76a' }}
                  >
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <strong>
                      {loading ? '...' : counts.drivers.toLocaleString()}{' '}
                      drivers
                    </strong>
                    <p>Registered drivers available for assignment.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-badge purple">
                    <Truck size={16} />
                  </div>
                  <div>
                    <strong>
                      {loading ? '...' : counts.vehicles.toLocaleString()}{' '}
                      vehicles
                    </strong>
                    <p>Fleet records available for assignment and tracking.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-badge indigo">
                    <Map size={16} />
                  </div>
                  <div>
                    <strong>
                      {loading ? '...' : counts.routes.toLocaleString()} routes
                    </strong>
                    <p>Configured origin and destination links.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-badge blue">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <strong>
                      {loading ? '...' : counts.cities.toLocaleString()} cities
                    </strong>
                    <p>Coverage across configured route endpoints.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div
                    className="activity-badge"
                    style={{ background: '#fef3f2', color: '#f04438' }}
                  >
                    <Users size={16} />
                  </div>
                  <div>
                    <strong>
                      {loading ? '...' : counts.users.toLocaleString()} users
                    </strong>
                    <p>Registered customer accounts in the system.</p>
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
