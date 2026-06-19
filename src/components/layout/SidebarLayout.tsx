import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Book, Calendar, FileText, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function SidebarLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    cn(
      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
      isActive ? "bg-brand text-white shadow-sm" : "text-gray-400 hover:bg-bg-base hover:text-gray-100"
    );

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-bg-card border-b border-border-subtle z-40 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-brand tracking-tight flex items-center">
          JEE Prep
        </h1>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="text-gray-400 hover:text-gray-100 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-bg-card border-r border-border-subtle flex flex-col transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-brand tracking-tight">
              JEE Prep
            </h1>
            <button 
              className="lg:hidden text-gray-400 hover:text-gray-100 focus:outline-none"
              onClick={closeSidebar}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <NavLink to="/dashboard" onClick={closeSidebar} className={navLinkClass}>
                <LayoutDashboard className="w-5 h-5" /> Dashboard
            </NavLink>
            <NavLink to="/syllabus" onClick={closeSidebar} className={navLinkClass}>
                <Book className="w-5 h-5" /> Syllabus
            </NavLink>
             <NavLink to="/planner" onClick={closeSidebar} className={navLinkClass}>
                <Calendar className="w-5 h-5" /> Planner
            </NavLink>
            <NavLink to="/tests" onClick={closeSidebar} className={navLinkClass}>
                <FileText className="w-5 h-5" /> Tests
            </NavLink>
        </div>
        
        <div className="p-4 border-t border-border-subtle space-y-1">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-400 hover:bg-bg-base hover:text-gray-100 transition-colors">
               <LogOut className="w-5 h-5" /> Log Out
           </button>
        </div>
      </nav>
      
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
         <Outlet />
      </main>
    </div>
  );
}
