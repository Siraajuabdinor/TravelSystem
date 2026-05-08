import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Topbar from '../components/navigation/Topbar';
import { pageCopy } from '../config/navigation';

export default function AppShell() {
  const location = useLocation();
  const currentPage = pageCopy[location.pathname] ?? pageCopy['/dashboard'];

  return (
    <div className="app-container">
      <div className="app-backdrop app-backdrop-one" />
      <div className="app-backdrop app-backdrop-two" />
      <Sidebar />
      <main className="main-content">
        <Topbar
          title={currentPage.title}
          description={currentPage.description}
        />
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
