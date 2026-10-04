import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Dashboard } from '../pages/Dashboard';
import { POS } from '../pages/POS';
import { Inventory } from '../pages/Inventory';
import { Purchases } from '../pages/Purchases';
import { Expenses } from '../pages/Expenses';
import { Profit } from '../pages/Profit';
import { Locations } from '../pages/Locations';
import { LocationDetail } from '../pages/LocationDetail';
import { Reports } from '../pages/Reports';
import { Invoices } from '../pages/Invoices';
import { Users } from '../pages/Users';
import { Settings } from '../pages/Settings';
import { Login } from '../pages/Login';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {/* General access for admin & manager */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/profit" element={<Profit />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:id" element={<LocationDetail />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* POS & Invoices accessible by all roles (Admin, Manager, Staff) */}
          <Route path="/pos" element={<POS />} />
          <Route path="/invoices" element={<Invoices />} />

          {/* Admin only routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
