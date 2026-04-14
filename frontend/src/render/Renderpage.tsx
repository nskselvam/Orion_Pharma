import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import GenNavbar from '../components/gen/GenNavbar';
import LogNavBar from '../components/gen/LogNavBar';
import SideNavBar from '../components/SideNavBar/SideNavBar';
import { useAppSelector } from '../store/hooks';

const Renderpage: React.FC = () => {
  const location = useLocation();
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const locationPath = location.pathname;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const showSidebar = userInfo && 
    locationPath !== '/common/dashboard' && 
    locationPath !== '/reset-password' && 
    locationPath !== '/login';

  const ValuationScreen = 
    locationPath === '/valuation' || 
    locationPath === '/examiner/reviewe/valuationreview' || 
    locationPath === '/valuation/chief-valuation' || 
    locationPath === '/valuation/chief-valuation-review-main';

  const showNavbar = !ValuationScreen;

  console.log('Renderpage UserInfo:', userInfo);

  return (
    <>
      {showNavbar && (
        userInfo && userInfo.selected_course ? (
          <LogNavBar data={[userInfo.selected_course]} />
        ) : (
          <GenNavbar />
        )
      )}

      {ValuationScreen ? (
        <Outlet />
      ) : (
        <div style={{
          display: 'flex',
          minHeight: showNavbar ? 'calc(100vh - 60px)' : '100vh',
        }}>
          {showSidebar && (
            <SideNavBar 
              isCollapsed={isSidebarCollapsed} 
              setIsCollapsed={setIsSidebarCollapsed} 
            />
          )}

          <div style={{
            flex: 1,
            marginLeft: showSidebar ? (isSidebarCollapsed ? '60px' : '250px') : '0',
            transition: 'margin-left 0.3s ease',
            padding: '2rem',
          }}>
            <Outlet />
          </div>
        </div>
      )}
    </>
  );
};

export default Renderpage;
