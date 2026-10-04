import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/pos')) return 'POS / Sales';
    if (pathname.startsWith('/inventory')) return 'Inventory Management';
    if (pathname.startsWith('/purchases')) return 'Purchase Orders';
    if (pathname.startsWith('/expenses')) return 'Expense Tracker';
    if (pathname.startsWith('/profit')) return 'Profit & Margin Analysis';
    if (pathname.startsWith('/locations')) return 'Location Management';
    if (pathname.startsWith('/reports')) return 'Reports & Analytics';
    if (pathname.startsWith('/invoices')) return 'Invoices & Billing';
    if (pathname.startsWith('/users')) return 'User & Role Management';
    if (pathname.startsWith('/settings')) return 'System Settings';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        <Navbar
          title={getPageTitle(location.pathname)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
