import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { salesService } from '../services/salesService';
import { locationsService } from '../services/locationsService';
import { settingsService } from '../services/settingsService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { calculateTotalRevenue } from '../utils/calculations';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';

export const POS = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sales, setSales] = useState([]);
  const [locations, setLocations] = useState([]);
  const [settings, setSettings] = useState(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  // Form state
  const [locationId, setLocationId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [cupsSold, setCupsSold] = useState('');
  const [sellingPrice, setSellingPrice] = useState('20');
  const [notes, setNotes] = useState('');

  // Modals state
  const [viewSale, setViewSale] = useState(null);
  const [editSale, setEditSale] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, locData, settData] = await Promise.all([
        salesService.getSales(),
        locationsService.getLocations(),
        settingsService.getSettings(),
      ]);
      setSales(salesData);
      setLocations(locData);
      setSettings(settData);
      if (locData.length > 0 && !locationId) {
        setLocationId(locData[0].id);
      }
      if (settData?.default_cup_price) {
        setSellingPrice(String(settData.default_cup_price));
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load POS data');
    } finally {
      setLoading(false);
    }
  };

  const currentTotalRevenue = useMemo(() => {
    return calculateTotalRevenue(cupsSold, sellingPrice);
  }, [cupsSold, sellingPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cupsSold || parseInt(cupsSold, 10) <= 0) {
      toastError('Please enter a valid number of cups sold');
      return;
    }
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      toastError('Please enter a valid selling price');
      return;
    }

    const selectedLoc = locations.find((l) => l.id === locationId);

    setSubmitting(true);
    try {
      await salesService.addSale({
        location_id: locationId || null,
        location_name: selectedLoc?.name || 'Unassigned',
        date: saleDate,
        cups_sold: parseInt(cupsSold, 10),
        selling_price_per_cup: parseFloat(sellingPrice),
        notes,
        created_by: user?.full_name || 'Staff',
      });

      success('Sale added successfully');
      // Reset cups but keep location and date for fast consecutive entries
      setCupsSold('');
      setNotes('');
      const updatedSales = await salesService.getSales();
      setSales(updatedSales);
    } catch (err) {
      console.error(err);
      toastError('Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editSale) return;

    setSubmitting(true);
    try {
      const selectedLoc = locations.find((l) => l.id === editSale.location_id);
      await salesService.updateSale(editSale.id, {
        ...editSale,
        location_name: selectedLoc?.name || editSale.location_name,
      });
      success('Sale updated successfully');
      setEditSale(null);
      const updatedSales = await salesService.getSales();
      setSales(updatedSales);
    } catch (err) {
      console.error(err);
      toastError('Failed to update sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await salesService.deleteSale(deleteId);
      success('Sale record deleted');
      setDeleteId(null);
      const updatedSales = await salesService.getSales();
      setSales(updatedSales);
    } catch (err) {
      console.error(err);
      toastError('Failed to delete sale');
    }
  };

  // Quick preset cup helper
  const addQuickCups = (count) => {
    const current = parseInt(cupsSold, 10) || 0;
    setCupsSold(String(current + count));
  };

  // Today's summary statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(() => sales.filter((s) => s.date === todayStr), [sales, todayStr]);

  const todayCupsSold = useMemo(
    () => todaySales.reduce((acc, curr) => acc + (parseInt(curr.cups_sold, 10) || 0), 0),
    [todaySales]
  );
  const todayRevenue = useMemo(
    () => todaySales.reduce((acc, curr) => acc + (parseFloat(curr.total_revenue) || 0), 0),
    [todaySales]
  );
  const todayTransactions = todaySales.length;

  // Filtered sales list
  const range = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [sales, range, locationFilter]);

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F3EFEA] text-xs font-medium text-[#522A0D]">
          {row.location_name}
        </span>
      ),
    },
    {
      header: 'Cups Sold',
      accessor: 'cups_sold',
      align: 'right',
      render: (row) => <span className="font-semibold">{formatNumber(row.cups_sold)}</span>,
    },
    {
      header: 'Price/Cup',
      accessor: 'selling_price_per_cup',
      align: 'right',
      render: (row) => <span>{formatCurrency(row.selling_price_per_cup)}</span>,
    },
    {
      header: 'Total Revenue',
      accessor: 'total_revenue',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-emerald-800">{formatCurrency(row.total_revenue)}</span>
      ),
    },
    {
      header: 'Created By',
      accessor: 'created_by',
      render: (row) => <span className="text-xs text-[#7C7467]">{row.created_by || 'Staff'}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewSale(row)}
            title="View Details"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-[#230E03] hover:bg-chai-100"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditSale(row)}
            title="Edit Sale"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-chai-800 hover:bg-chai-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            title="Delete Sale"
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
      {/* Top Banner / Today's Rapid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 bg-gradient-to-br from-chai-900 to-chai-950 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-chai-300 font-medium uppercase tracking-wider">Today's Cups Sold</p>
            <h3 className="text-2xl font-bold mt-0.5">{formatNumber(todayCupsSold)} <span className="text-xs font-normal text-chai-300">cups</span></h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-chai-200">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="card p-4 bg-white border border-[#EFE8DE] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-2xl font-bold text-emerald-800 mt-0.5">{formatCurrency(todayRevenue)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="card p-4 bg-white border border-[#EFE8DE] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Today's Transactions</p>
            <h3 className="text-2xl font-bold text-[#230E03] mt-0.5">{todayTransactions} <span className="text-xs font-normal text-[#7C7467]">entries</span></h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-chai-50 text-chai-800 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* POS Grid: Left Sale Entry Form, Right Sales Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Sale Entry Form */}
        <div className="lg:col-span-5 card p-6 space-y-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3EFEA]">
            <div>
              <h3 className="text-base font-bold text-[#230E03] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-chai-700" />
                POS Sale Entry
              </h3>
              <p className="text-xs text-[#7C7467]">Instantly log cups sold at any location</p>
            </div>
            <span className="badge bg-chai-100 text-chai-900 border border-chai-200">Fast Entry</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
                className="select-field"
              >
                {locations.length === 0 && <option value="">No locations available</option>}
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#522A0D]">
                  Number of Cups Sold <span className="text-red-500">*</span>
                </label>
                {/* Quick Add Buttons */}
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => addQuickCups(qty)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-chai-100 text-chai-900 hover:bg-chai-200 transition-colors"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={cupsSold}
                onChange={(e) => setCupsSold(e.target.value)}
                required
                className="input-field text-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                  Selling Price / Cup (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  required
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                  Total Revenue
                </label>
                <div className="px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E2D8] rounded-lg text-base font-bold text-emerald-800">
                  {formatCurrency(currentTotalRevenue)}
                </div>
              </div>
            </div>

            {/* Formula badge */}
            <div className="p-2.5 rounded-lg bg-chai-50 border border-chai-100 text-xs text-chai-900 flex items-center justify-between">
              <span className="text-[11px] text-[#7C7467]">Automatic Calculation:</span>
              <span className="font-semibold">
                {cupsSold || 0} cups × ₹{sellingPrice || 0} = {formatCurrency(currentTotalRevenue)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Shift timing, remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 text-base font-semibold shadow-md"
            >
              <Plus className="w-5 h-5" />
              {submitting ? 'Recording Sale...' : '+ Add Sale'}
            </button>
          </form>
        </div>

        {/* RIGHT: Sales History & Filter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#230E03]">Sales History</h3>
            <div className="flex flex-wrap items-center gap-2">
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

          <DataTable
            columns={columns}
            data={filteredSales}
            searchKeys={['location_name', 'created_by', 'notes']}
            searchPlaceholder="Search location or staff..."
            emptyTitle="No sales recorded"
            emptyDescription="Log your first sale with the form on the left."
          />
        </div>
      </div>

      {/* View Sale Modal */}
      {viewSale && (
        <Modal
          isOpen={Boolean(viewSale)}
          onClose={() => setViewSale(null)}
          title="Sale Details"
          subtitle={`Reference ID: ${viewSale.id}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E2D8]">
              <div>
                <p className="text-xs text-[#7C7467]">Location</p>
                <p className="font-bold text-[#230E03]">{viewSale.location_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Date</p>
                <p className="font-bold text-[#230E03]">{formatDate(viewSale.date)}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Cups Sold</p>
                <p className="font-bold text-[#230E03]">{formatNumber(viewSale.cups_sold)}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Selling Price / Cup</p>
                <p className="font-bold text-[#230E03]">{formatCurrency(viewSale.selling_price_per_cup)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#E8E2D8]">
                <p className="text-xs text-[#7C7467]">Total Revenue</p>
                <p className="text-xl font-extrabold text-emerald-800">{formatCurrency(viewSale.total_revenue)}</p>
              </div>
            </div>
            {viewSale.notes && (
              <div>
                <p className="text-xs font-semibold text-[#7C7467] mb-1">Notes</p>
                <p className="p-3 bg-white border border-[#E8E2D8] rounded-lg text-xs">{viewSale.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewSale(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Sale Modal */}
      {editSale && (
        <Modal
          isOpen={Boolean(editSale)}
          onClose={() => setEditSale(null)}
          title="Edit Sale Record"
          subtitle="Update cups or pricing"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Location</label>
              <select
                value={editSale.location_id || ''}
                onChange={(e) => setEditSale({ ...editSale, location_id: e.target.value })}
                className="select-field"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Date</label>
              <input
                type="date"
                value={editSale.date}
                onChange={(e) => setEditSale({ ...editSale, date: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Cups Sold</label>
                <input
                  type="number"
                  value={editSale.cups_sold}
                  onChange={(e) => setEditSale({ ...editSale, cups_sold: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Price / Cup (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={editSale.selling_price_per_cup}
                  onChange={(e) => setEditSale({ ...editSale, selling_price_per_cup: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Notes</label>
              <input
                type="text"
                value={editSale.notes || ''}
                onChange={(e) => setEditSale({ ...editSale, notes: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
              <button type="button" onClick={() => setEditSale(null)} className="btn-secondary">
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
        title="Delete Sale Record"
        message="Are you sure you want to delete this sale entry? This will update telemetry and profit calculations."
      />
    </div>
  );
};
