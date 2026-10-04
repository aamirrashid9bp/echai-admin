import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  User,
  Sliders,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import { EXPENSE_CATEGORIES } from '../services/expensesService';

export const Settings = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('business');

  // Settings state
  const [businessName, setBusinessName] = useState('echaii');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('admin@echaii.com');
  const [address, setAddress] = useState('Commercial Tower, Cyber City, Gurugram, India');
  const [gstNumber, setGstNumber] = useState('07AAAAA0000A1Z5');
  const [defaultCupPrice, setDefaultCupPrice] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('100');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      if (data) {
        setBusinessName(data.business_name || 'echaii');
        setPhone(data.phone || '+91 98765 43210');
        setEmail(data.email || 'admin@echaii.com');
        setAddress(data.address || 'Commercial Tower, Cyber City, Gurugram, India');
        setGstNumber(data.gst_number || '07AAAAA0000A1Z5');
        setDefaultCupPrice(String(data.default_cup_price || 20));
        setLowStockThreshold(String(data.low_stock_threshold || 100));
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await settingsService.updateSettings({
        business_name: businessName,
        phone,
        email,
        address,
        gst_number: gstNumber,
        default_cup_price: parseFloat(defaultCupPrice) || 20,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 100,
      });
      success('Settings updated successfully');
    } catch (err) {
      console.error(err);
      toastError('Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#230E03]">Business & System Settings</h2>
        <p className="text-xs text-[#7C7467]">
          Configure business metadata, POS parameters, default cup pricing, and database connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 card p-2 space-y-1">
          {[
            { id: 'business', label: 'Business Profile', icon: Building },
            { id: 'pos', label: 'POS & Operations', icon: Sliders },
            { id: 'categories', label: 'Expense Categories', icon: SettingsIcon },
            { id: 'database', label: 'Database & Security', icon: Database },
          ].map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSection === sec.id
                    ? 'bg-chai-800 text-white shadow-xs'
                    : 'text-[#522A0D] hover:bg-chai-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-9 card p-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Business Profile */}
            {activeSection === 'business' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#F3EFEA]">
                  <h3 className="text-base font-bold text-[#230E03]">Business Profile</h3>
                  <p className="text-xs text-[#7C7467]">
                    This information appears on issued tax invoices and reports.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                      Brand / Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="input-field font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="input-field font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                      Official Contact Phone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                      Registered Address
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. POS & Operations */}
            {activeSection === 'pos' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#F3EFEA]">
                  <h3 className="text-base font-bold text-[#230E03]">POS & Inventory Defaults</h3>
                  <p className="text-xs text-[#7C7467]">
                    Standard rates and replenishment thresholds.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                      Default Selling Price / Cup (₹ INR)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={defaultCupPrice}
                      onChange={(e) => setDefaultCupPrice(e.target.value)}
                      className="input-field font-bold text-lg"
                      required
                    />
                    <p className="text-[11px] text-[#7C7467] mt-1">
                      Pre-filled in the POS sale entry screen.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                      Low Stock Alert Threshold (Cups)
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="input-field font-bold text-lg"
                      required
                    />
                    <p className="text-[11px] text-[#7C7467] mt-1">
                      Displays a warning banner when closing stock falls at or below this value.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Expense Categories */}
            {activeSection === 'categories' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#F3EFEA]">
                  <h3 className="text-base font-bold text-[#230E03]">Configured Expense Categories</h3>
                  <p className="text-xs text-[#7C7467]">
                    Standardized expense ledgers for echaii business operations.
                  </p>
                </div>

                <div className="space-y-2">
                  {EXPENSE_CATEGORIES.map((cat, idx) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F6] border border-[#E8E2D8] text-xs font-semibold text-[#230E03]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-chai-100 text-chai-900 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{cat}</span>
                      </div>
                      <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active Bucket
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Database & Security */}
            {activeSection === 'database' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#F3EFEA]">
                  <h3 className="text-base font-bold text-[#230E03]">Supabase Database & Security</h3>
                  <p className="text-xs text-[#7C7467]">
                    Backend connection state and Row Level Security (RLS) status.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    isSupabaseConfigured
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  {isSupabaseConfigured ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <p className="font-bold">
                      {isSupabaseConfigured
                        ? 'Supabase Backend Connected'
                        : 'Running in Local Storage Mode'}
                    </p>
                    <p className="text-[#595246]">
                      {isSupabaseConfigured
                        ? 'Your Supabase URL & Anon Key are active. All sales, inventory, expenses, and invoices synchronize directly to the cloud.'
                        : 'To sync to your cloud Supabase database, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your echaii-admin/.env file, and execute the provided supabase_schema.sql script in the Supabase SQL editor.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl text-xs space-y-2">
                  <span className="font-bold text-[#230E03]">Database Schema File:</span>
                  <p className="text-[#7C7467]">
                    The complete SQL script for tables, constraints, trigger functions and RLS policies is ready at <code className="px-1.5 py-0.5 bg-white border border-[#E8E2D8] rounded font-mono text-chai-900">src/lib/supabase_schema.sql</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-[#F3EFEA] flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
