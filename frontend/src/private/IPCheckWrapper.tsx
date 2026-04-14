import { Outlet } from 'react-router-dom';

const IPCheckWrapper = () => {
  // TODO: Add IP check logic if needed
  // For now, just allow all traffic
  
  return <Outlet />;
};

export default IPCheckWrapper;
