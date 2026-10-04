import React, { useState } from 'react';
import { Menu, Bell, User, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';

export const Navbar = ({ title = 'Dashboard', onToggleSidebar }) => {
  const { user, role, switchRole, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EFE8DE] px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-[#522A0D] hover:bg-chai-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#230E03]">{title}</h1>
        </div>
      </div>

      {/* Right side: Date, Status, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden sm:flex items-center text-xs font-medium text-[#7C7467] bg-white border border-[#E8E2D8] px-3 py-1.5 rounded-lg shadow-2xs">
          <span>{todayFormatted}</span>
        </div>

        {/* Supabase Status Indicator */}
        <div
          title={isSupabaseConfigured ? 'Connected to Supabase' : 'Running in Local Store Mode'}
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{isSupabaseConfigured ? 'Supabase Live' : 'Local Mode'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 rounded-lg bg-white border border-[#E8E2D8] text-[#522A0D] hover:bg-chai-50 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-chai-600 rounded-full" />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#EFE8DE] rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#F3EFEA] mb-2">
                <span className="text-xs font-bold text-[#230E03] uppercase tracking-wider">
                  Notifications
                </span>
                <span className="text-[11px] text-[#A8A193]">System ready</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-[#FAF9F6] border border-[#E8E2D8] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-chai-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#230E03]">Welcome to echaii Admin</p>
                    <p className="text-[11px] text-[#7C7467] mt-0.5">
                      {isSupabaseConfigured
                        ? 'Supabase connection established.'
                        : 'Database running in high-speed local mode. Ready for live transactions.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown & Role Selector */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-white border border-[#E8E2D8] hover:border-chai-300 transition-colors shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-chai-800 text-white flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <div className="text-xs font-semibold text-[#230E03] leading-none">
                {user?.full_name || 'Admin'}
              </div>
              <div className="text-[10px] font-medium text-chai-700 capitalize mt-0.5 leading-none">
                {role}
              </div>
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#EFE8DE] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-[#F3EFEA] mb-1">
                <p className="text-xs font-semibold text-[#230E03]">{user?.full_name}</p>
                <p className="text-[11px] text-[#7C7467] truncate">{user?.email}</p>
              </div>

              {/* Role switch for quick testing/switching */}
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A8A193]">
                Switch Role View
              </div>
              {['admin', 'manager', 'staff'].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs capitalize text-[#230E03] hover:bg-chai-50"
                >
                  <span>{r}</span>
                  {role === r && <Check className="w-3.5 h-3.5 text-chai-800" />}
                </button>
              ))}

              <div className="border-t border-[#F3EFEA] mt-2 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
