import React from 'react';  
import { Outlet } from 'react-router-dom';  
import TopBar from './TopBar';  
  
const Layout = () => {  
  return (  
    <div className="app">  
      <TopBar />  
      <main>  
        <Outlet />  
      </main>  
    </div>  
  );  
};  
  
export default Layout;
