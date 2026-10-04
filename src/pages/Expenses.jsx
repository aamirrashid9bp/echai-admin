import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  PieChart as PieIcon,
  Tag,
  Edit2,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react';
import { expensesService, EXPENSE_CATEGORIES } from '../services/expensesService';
import { locationsService } from '../services/locationsService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';

const CATEGORY_COLORS = {
  'Chai Cost': 'bg-amber-100 text-amber-900 border-amber-200',
  'Cup Cost': 'bg-blue-100 text-blue-900 border-blue-200',
  'Tissue Cost': 'bg-purple-100 text-purple-900 border-purple-200',
  'Travelling / Transport': 'bg-emerald-100 text-emerald-900 border-emerald-200',
  'Other Expenses': 'bg-stone-100 text-stone-900 border-stone-200',
};

export const Expenses = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filters
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [viewExpense, setViewExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formLocationId, setFormLocationId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, locData] = await Promise.all([
        expensesService.getExpenses(),
        locationsService.getLocations(),
      ]);
      setExpenses(expData);
      setLocations(locData);
      if (locData.length > 0) {
        setFormLocationId(locData[0].id);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formAmount || parseFloat(formAmount) <= 0) {
      toastError('Please enter a valid expense amount');
      return;
    }

    setSubmitting(true);
    try {
      const loc = locations.find((l) => l.id === formLocationId);
      await expensesService.addExpense({
        location_id: formLocationId || null,
        location_name: loc?.name || 'Unassigned',
        date: formDate,
        category: formCategory,
        description: formDescription,
        amount: parseFloat(formAmount),
        created_by: user?.full_name || 'Admin',
      });

      success('Expense added successfully');
      setAddModalOpen(false);
      resetForm();
      const updated = await expensesService.getExpenses();
      setExpenses(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editExpense) return;

    setSubmitting(true);
    try {
      const loc = locations.find((l) => l.id === editExpense.location_id);
      await expensesService.updateExpense(editExpense.id, {
        ...editExpense,
        location_name: loc?.name || editExpense.location_name,
      });
      success('Expense updated successfully');
      setEditExpense(null);
      const updated = await expensesService.getExpenses();
      setExpenses(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to update expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await expensesService.deleteExpense(deleteId);
      success('Expense deleted successfully');
      setDeleteId(null);
      const updated = await expensesService.getExpenses();
      setExpenses(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormDescription('');
    setFormAmount('');
  };

  // Filtered dataset
  const range = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      return matchDate && matchLoc && matchCat;
    });
  }, [expenses, range, locationFilter, categoryFilter]);

  // Category Summaries
  const categoryTotals = useMemo(() => {
    const totals = {
      'Chai Cost': 0,
      'Cup Cost': 0,
      'Tissue Cost': 0,
      'Travelling / Transport': 0,
      'Other Expenses': 0,
      'Total Expenses': 0,
    };

    filteredExpenses.forEach((exp) => {
      const amt = parseFloat(exp.amount) || 0;
      if (totals[exp.category] !== undefined) {
        totals[exp.category] += amt;
      } else {
        totals['Other Expenses'] += amt;
      }
      totals['Total Expenses'] += amt;
    });

    return totals;
  }, [filteredExpenses]);

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="font-medium">{formatDate(row.date)}</span>,
    },
    {
      header: 'Location',
      accessor: 'location_name',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F3EFEA] text-xs font-medium text-[#522A0D]">
          {row.location_name}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            CATEGORY_COLORS[row.category] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.category}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => <span className="text-xs text-[#522A0D]">{row.description || '-'}</span>,
    },
    {
      header: 'Amount',
      accessor: 'amount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-red-600">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      header: 'Created By',
      accessor: 'created_by',
      render: (row) => <span className="text-xs text-[#7C7467]">{row.created_by || 'Admin'}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewExpense(row)}
            title="View Details"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-[#230E03] hover:bg-chai-100"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditExpense(row)}
            title="Edit Expense"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-chai-800 hover:bg-chai-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            title="Delete Expense"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#230E03]">Operational Expense Tracker</h2>
          <p className="text-xs text-[#7C7467]">
            Monitor chai ingredients, cup stock, tissues, transport, and overhead costs.
          </p>
        </div>

        <button onClick={() => setAddModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          + Add Expense
        </button>
      </div>

      {/* Expense Categories Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-3.5 border-t-2 border-t-amber-600">
          <p className="text-[11px] text-[#7C7467] font-semibold uppercase truncate">Chai Cost</p>
          <p className="text-base font-bold text-[#230E03] mt-1">
            {formatCurrency(categoryTotals['Chai Cost'])}
          </p>
        </div>

        <div className="card p-3.5 border-t-2 border-t-blue-600">
          <p className="text-[11px] text-[#7C7467] font-semibold uppercase truncate">Cup Cost</p>
          <p className="text-base font-bold text-[#230E03] mt-1">
            {formatCurrency(categoryTotals['Cup Cost'])}
          </p>
        </div>

        <div className="card p-3.5 border-t-2 border-t-purple-600">
          <p className="text-[11px] text-[#7C7467] font-semibold uppercase truncate">Tissue Cost</p>
          <p className="text-base font-bold text-[#230E03] mt-1">
            {formatCurrency(categoryTotals['Tissue Cost'])}
          </p>
        </div>

        <div className="card p-3.5 border-t-2 border-t-emerald-600">
          <p className="text-[11px] text-[#7C7467] font-semibold uppercase truncate">Transport</p>
          <p className="text-base font-bold text-[#230E03] mt-1">
            {formatCurrency(categoryTotals['Travelling / Transport'])}
          </p>
        </div>

        <div className="card p-3.5 border-t-2 border-t-stone-600">
          <p className="text-[11px] text-[#7C7467] font-semibold uppercase truncate">Other Cost</p>
          <p className="text-base font-bold text-[#230E03] mt-1">
            {formatCurrency(categoryTotals['Other Expenses'])}
          </p>
        </div>

        <div className="card p-3.5 bg-red-50/60 border border-red-200">
          <p className="text-[11px] text-red-800 font-bold uppercase truncate">Total Expenses</p>
          <p className="text-base font-extrabold text-red-700 mt-1">
            {formatCurrency(categoryTotals['Total Expenses'])}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h3 className="text-base font-bold text-[#230E03]">Expense Ledger</h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#E8E2D8] rounded-lg text-sm text-[#230E03] font-medium"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <LocationFilter
            locations={locations}
            value={locationFilter}
            onChange={setLocationFilter}
          />

          <DateFilter
            value={dateFilter}
            onChange={setDateFilter}
            customStart={customStart}
            customEnd={customEnd}
            onCustomChange={(s, e) => {
              setCustomStart(s);
              setCustomEnd(e);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredExpenses}
        searchKeys={['description', 'category', 'location_name', 'created_by']}
        searchPlaceholder="Search expense description or category..."
        emptyTitle="No expenses found"
        emptyDescription="Record operational or supply expenses to calculate net profitability."
        emptyActionLabel="+ Add Expense"
        onEmptyAction={() => setAddModalOpen(true)}
      />

      {/* Add Expense Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Expense Entry"
        subtitle="Log chai ingredients, packaging, travel, or administrative expenditure"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="select-field font-medium"
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Location</label>
              <select
                value={formLocationId}
                onChange={(e) => setFormLocationId(e.target.value)}
                className="select-field"
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 750"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="input-field font-bold text-red-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Description / Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Cardamom, ginger, milk supplies / Cab fare"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="input-field"
            />
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
              {submitting ? 'Saving...' : '+ Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Expense Modal */}
      {viewExpense && (
        <Modal
          isOpen={Boolean(viewExpense)}
          onClose={() => setViewExpense(null)}
          title="Expense Details"
          subtitle={`Ref ID: ${viewExpense.id}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E2D8]">
              <div>
                <p className="text-xs text-[#7C7467]">Category</p>
                <p className="font-bold text-[#230E03]">{viewExpense.category}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Location</p>
                <p className="font-bold text-[#230E03]">{viewExpense.location_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Date</p>
                <p className="font-bold text-[#230E03]">{formatDate(viewExpense.date)}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Logged By</p>
                <p className="font-bold text-[#230E03]">{viewExpense.created_by || 'Admin'}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#E8E2D8]">
                <p className="text-xs text-[#7C7467]">Amount Paid</p>
                <p className="text-2xl font-extrabold text-red-600">{formatCurrency(viewExpense.amount)}</p>
              </div>
            </div>

            {viewExpense.description && (
              <div className="p-3 bg-white border border-[#E8E2D8] rounded-lg text-xs">
                <span className="font-semibold text-[#7C7467]">Description: </span>
                {viewExpense.description}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewExpense(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Expense Modal */}
      {editExpense && (
        <Modal
          isOpen={Boolean(editExpense)}
          onClose={() => setEditExpense(null)}
          title="Edit Expense Entry"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Category</label>
                <select
                  value={editExpense.category}
                  onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
                  className="select-field"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Location</label>
                <select
                  value={editExpense.location_id || ''}
                  onChange={(e) => setEditExpense({ ...editExpense, location_id: e.target.value })}
                  className="select-field"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Date</label>
                <input
                  type="date"
                  value={editExpense.date}
                  onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={editExpense.amount}
                  onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Description</label>
              <input
                type="text"
                value={editExpense.description || ''}
                onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
              <button type="button" onClick={() => setEditExpense(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense? Net profit telemetry will be recalculated."
      />
    </div>
  );
};
