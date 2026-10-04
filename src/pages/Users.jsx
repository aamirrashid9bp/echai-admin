import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Plus,
  ShieldCheck,
  ShieldAlert,
  User,
  Trash2,
  Edit2,
  Check,
  Mail,
  Phone,
} from 'lucide-react';
import { usersService } from '../services/usersService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ROLE_PERMISSIONS = {
  admin: ['Dashboard', 'POS / Sales', 'Inventory', 'Purchases', 'Expenses', 'Profit', 'Locations', 'Reports', 'Invoices', 'User Management', 'Settings'],
  manager: ['Dashboard', 'POS / Sales', 'Inventory', 'Purchases', 'Expenses', 'Profit', 'Locations', 'Reports', 'Invoices'],
  staff: ['POS / Sales', 'Invoices (View/Issue)'],
};

export const Users = () => {
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      toastError('Please specify name and email');
      return;
    }

    setSubmitting(true);
    try {
      await usersService.addUser({
        full_name: fullName,
        email,
        phone,
        role,
      });

      success('User added successfully');
      setAddModalOpen(false);
      resetForm();
      const updated = await usersService.getUsers();
      setUsers(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersService.updateUserRole(userId, newRole);
      success(`Role updated to ${newRole}`);
      const updated = await usersService.getUsers();
      setUsers(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to update role');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await usersService.deleteUser(deleteId);
      success('User removed');
      setDeleteId(null);
      const updated = await usersService.getUsers();
      setUsers(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to delete user');
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('staff');
  };

  const columns = [
    {
      header: 'User',
      accessor: 'full_name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-chai-100 text-chai-800 font-bold text-xs flex items-center justify-center">
            {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="font-semibold text-[#230E03]">{row.full_name}</p>
            <p className="text-xs text-[#7C7467]">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => <span className="text-xs text-[#522A0D]">{row.phone || '-'}</span>,
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (row) => (
        <select
          value={row.role || 'staff'}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border cursor-pointer focus:outline-none ${
            row.role === 'admin'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : row.role === 'manager'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-stone-50 text-stone-900 border-stone-200'
          }`}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
      ),
    },
    {
      header: 'Created On',
      accessor: 'created_at',
      render: (row) => <span className="text-xs text-[#7C7467]">{formatDate(row.created_at)}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.id !== currentUser?.id && (
            <button
              onClick={() => setDeleteId(row.id)}
              title="Delete User"
              className="p-1.5 rounded-lg text-[#7C7467] hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading staff and user accounts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#230E03]">User & Role-Based Access Control</h2>
          <p className="text-xs text-[#7C7467]">
            Manage Admin, Operations Manager, and Counter Staff permissions.
          </p>
        </div>

        <button onClick={() => setAddModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          + Add User
        </button>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(ROLE_PERMISSIONS).map(([rKey, perms]) => (
          <div key={rKey} className="card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3EFEA]">
              <div className="flex items-center gap-2">
                <span className="capitalize font-bold text-sm text-[#230E03]">{rKey}</span>
              </div>
              <span className="badge bg-chai-50 text-chai-900 border border-chai-200 uppercase text-[10px]">
                {perms.length} Modules
              </span>
            </div>
            <ul className="space-y-1 text-xs text-[#522A0D]">
              {perms.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        searchKeys={['full_name', 'email', 'phone', 'role']}
        searchPlaceholder="Search user name, email, or role..."
        emptyTitle="No users found"
      />

      {/* Add User Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Staff or Manager"
        subtitle="Invite team member with role-based permissions"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. rahul@echaii.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Phone</label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Role Permission
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="select-field capitalize font-medium"
              >
                <option value="admin">Admin (Full Access)</option>
                <option value="manager">Manager (Operations & Reports)</option>
                <option value="staff">Staff (POS & Sales)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Adding...' : '+ Add User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove User"
        message="Are you sure you want to remove this user's access to the echaii admin system?"
      />
    </div>
  );
};
