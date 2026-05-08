import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Map,
  MoreVertical,
  Truck,
  Users,
} from 'lucide-react';
import { citiesService } from '../services/citiesService';
import { vehiclesService } from '../services/vehiclesService';
import { routesService } from '../services/routesService';

const summaryCards = [
  {
    key: 'cities',
    title: 'Cities',
    accent: 'up',
    change: '+11.01%',
    icon: Users,
  },
  {
    key: 'vehicles',
    title: 'Vehicles',
    icon: Truck,
    accent: 'down',
    change: '+9.05%',
  },
];

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
  const [counts, setCounts] = useState({ cities: 0, vehicles: 0, routes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCounts() {
      setLoading(true);
      setError('');

      try {
        const [cities, vehicles, routes] = await Promise.all([
          citiesService.list(),
          vehiclesService.list(),
          routesService.list(),
        ]);

        setCounts({
          cities: Array.isArray(cities) ? cities.length : 0,
          vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
          routes: Array.isArray(routes) ? routes.length : 0,
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
    if (!counts.vehicles) {
      return 75.55;
    }

    const value = (counts.routes / counts.vehicles) * 100;
    return Number(Math.min(96, Math.max(24, value)).toFixed(2));
  }, [counts.routes, counts.vehicles]);

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
      label: 'Today',
      value: loading ? '...' : `$${(counts.vehicles * 1000).toLocaleString()}`,
      trend: 'up',
    },
  ];

  const statHeights = [48, 76, 58, 88, 69, 52, 80];
  const circumference = 2 * Math.PI * 84;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="dashboard-stack">
      {error && <div className="form-message error">{error}</div>}

      <section className="dashboard-shell">
        <div className="dashboard-grid">
          <div className="dashboard-primary">
            <div className="dashboard-summary-grid">
              {summaryCards.map((card) => {
                const SummaryIcon = card.icon;

                return (
                <article key={card.key} className="dashboard-card summary-card">
                  <div className="summary-icon">
                    <SummaryIcon size={18} />
                  </div>
                  <p className="summary-label">{card.title}</p>
                  <div className="summary-value">{loading ? '...' : counts[card.key].toLocaleString()}</div>
                  <div className={`summary-trend ${card.accent}`}>
                    {card.accent === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{card.change}</span>
                  </div>
                </article>
                );
              })}
            </div>

            <article className="dashboard-card sales-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Monthly Sales</h2>
                  <p>Overview of monthly activity</p>
                </div>
                <button type="button" className="ghost-icon-btn" aria-label="More options">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="sales-chart">
                {monthlySales.map((item) => (
                  <div key={item.month} className="sales-bar-group">
                    <div
                      className="sales-bar"
                      style={{ height: `${Math.max(36, (item.value / 400) * 100)}%` }}
                    />
                    <span>{item.month}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-card statistics-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Statistics</h2>
                  <p>Target you&apos;ve set for each month</p>
                </div>
                <div className="period-switch">
                  <button type="button" className="active">Monthly</button>
                  <button type="button">Quarterly</button>
                  <button type="button">Annually</button>
                </div>
              </div>

              <div className="statistics-content">
                <div className="statistics-copy">
                  <div className="statistics-big-number">
                    {loading ? '...' : counts.routes.toLocaleString()}
                  </div>
                  <p>Active transport routes are currently tracked in your backend dashboard.</p>
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

          <aside className="dashboard-secondary">
            <article className="dashboard-card target-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Monthly Target</h2>
                  <p>Target you&apos;ve set for each month</p>
                </div>
                <button type="button" className="ghost-icon-btn" aria-label="More options">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="target-gauge">
                <svg viewBox="0 0 220 150" className="target-gauge-svg" aria-hidden="true">
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
                You earn ${Math.max(1500, counts.routes * 328)} today, it&apos;s higher than last month.
                Keep up your good work.
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
                    <Building2 size={16} />
                  </div>
                  <div>
                    <strong>{loading ? '...' : counts.cities.toLocaleString()} connected cities</strong>
                    <p>Coverage across your configured route endpoints.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-badge purple">
                    <Truck size={16} />
                  </div>
                  <div>
                    <strong>{loading ? '...' : counts.vehicles.toLocaleString()} registered vehicles</strong>
                    <p>Fleet records available for assignment and tracking.</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-badge indigo">
                    <Map size={16} />
                  </div>
                  <div>
                    <strong>{loading ? '...' : counts.routes.toLocaleString()} active routes</strong>
                    <p>Configured origin and destination links across the system.</p>
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
