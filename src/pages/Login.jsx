import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, User, Sparkles, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { isSupabaseConfigured } from '../lib/supabase';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('admin@echaii.com');
  const [password, setPassword] = useState('echaii2026');
  const [selectedRole, setSelectedRole] = useState('admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password, selectedRole);
      success('Logged in successfully');
      navigate('/');
    } catch (err) {
      console.error(err);
      toastError(err.message || 'Login failed');
    }
  };

  const handleQuickLogin = async (roleType, defaultEmail) => {
    try {
      await login(defaultEmail, 'echaii2026', roleType);
      success(`Signed in as ${roleType}`);
      navigate('/');
    } catch (err) {
      toastError('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-chai-800 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            e
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#230E03]">echaii</h1>
          <p className="text-xs text-[#7C7467]">
            Internal POS & Operations Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-6 shadow-xl space-y-5 bg-white border border-[#EFE8DE]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7467]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@echaii.com"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7467]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-semibold shadow-md"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In to echaii Admin'}
            </button>
          </form>

          {/* Quick Role Fast Access */}
          <div className="pt-4 border-t border-[#F3EFEA] space-y-2">
            <p className="text-[11px] font-bold text-[#7C7467] uppercase tracking-wider text-center">
              Quick Role Switch (Demo Mode)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin@echaii.com')}
                className="p-2 rounded-lg bg-chai-50 border border-chai-200 text-xs font-semibold text-chai-900 hover:bg-chai-100 transition-colors text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager', 'manager@echaii.com')}
                className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors text-center"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff', 'staff@echaii.com')}
                className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 hover:bg-stone-100 transition-colors text-center"
              >
                Staff POS
              </button>
            </div>
          </div>
        </div>

        {/* Backend Note */}
        <div className="text-center text-[11px] text-[#A8A193]">
          {isSupabaseConfigured
            ? 'Connected securely to Supabase Cloud Authentication'
            : 'Supabase credentials can be configured in .env'}
        </div>
      </div>
    </div>
  );
};
