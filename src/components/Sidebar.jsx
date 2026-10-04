import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ShoppingBag,
  Receipt,
  TrendingUp,
  MapPin,
  FileBarChart2,
  FileText,
  Users as UsersIcon,
  Settings as SettingsIcon,
  LogOut,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isManager } = useAuth();

  const primaryNav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS / Sales', icon: ShoppingCart },
    ...(isManager
      ? [
          { to: '/inventory', label: 'Inventory', icon: Boxes },
          { to: '/purchases', label: 'Purchases', icon: ShoppingBag },
          { to: '/expenses', label: 'Expenses', icon: Receipt },
          { to: '/profit', label: 'Profit', icon: TrendingUp },
          { to: '/locations', label: 'Locations', icon: MapPin },
          { to: '/reports', label: 'Reports', icon: FileBarChart2 },
        ]
      : []),
    { to: '/invoices', label: 'Invoices', icon: FileText },
  ];

  const managementNav = isAdmin
    ? [
        { to: '/users', label: 'Users', icon: UsersIcon },
        { to: '/settings', label: 'Settings', icon: SettingsIcon },
      ]
    : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-chai-950/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-chai-950 text-chai-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-chai-900 shadow-xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-chai-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-chai-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              e
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white leading-tight">
                echaii
              </span>
              <span className="text-[10px] font-medium tracking-wider text-chai-300 uppercase">
                POS & Operations
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-chai-300 hover:text-white hover:bg-chai-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main operations */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-chai-400">
              Operations
            </div>
            <nav className="space-y-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-chai-800 text-white shadow-inner font-semibold'
                          : 'text-chai-200 hover:bg-chai-900/60 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-chai-300" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Management */}
          {managementNav.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-chai-400">
                Management
              </div>
              <nav className="space-y-1">
                {managementNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose && onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-chai-800 text-white shadow-inner font-semibold'
                            : 'text-chai-200 hover:bg-chai-900/60 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-chai-300" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-chai-900/80 bg-chai-950/80">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-chai-900/60 border border-chai-800/40">
            <div className="w-9 h-9 rounded-full bg-chai-700/80 text-white flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                {user?.full_name || 'Admin'}
                {user?.role === 'admin' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className="text-[10px] text-chai-300 capitalize">
                {user?.role || 'Staff'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-chai-400 hover:text-white hover:bg-chai-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
