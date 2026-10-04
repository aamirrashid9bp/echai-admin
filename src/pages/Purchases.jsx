import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  DollarSign,
  Boxes,
  Truck,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import { purchasesService } from '../services/purchasesService';
import { locationsService } from '../services/locationsService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { calculateTotalPurchase } from '../utils/calculations';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';

const COMMON_VENDORS = [
  'Premium Paper Products Ltd',
  'EcoCups Packaging Solutions',
  'Heritage Chai Ingredients & Tea Estate',
  'National Logistics & Supplies',
  'Apex Disposables Co.',
];

export const Purchases = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filters
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState(null);
  const [viewPurchase, setViewPurchase] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formLocationId, setFormLocationId] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [cupsPurchased, setCupsPurchased] = useState('');
  const [pricePerCup, setPricePerCup] = useState('2.50');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purData, locData] = await Promise.all([
        purchasesService.getPurchases(),
        locationsService.getLocations(),
      ]);
      setPurchases(purData);
      setLocations(locData);
      if (locData.length > 0) {
        setFormLocationId(locData[0].id);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const calculatedTotal = useMemo(() => {
    return calculateTotalPurchase(cupsPurchased, pricePerCup);
  }, [cupsPurchased, pricePerCup]);

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!formVendor.trim()) {
      toastError('Please enter or select a vendor name');
      return;
    }
    if (!cupsPurchased || parseInt(cupsPurchased, 10) <= 0) {
      toastError('Please enter valid cups purchased quantity');
      return;
    }
    if (!pricePerCup || parseFloat(pricePerCup) <= 0) {
      toastError('Please enter valid purchase price per cup');
      return;
    }

    setSubmitting(true);
    try {
      const loc = locations.find((l) => l.id === formLocationId);
      await purchasesService.addPurchase({
        location_id: formLocationId || null,
        location_name: loc?.name || 'Unassigned',
        vendor_name: formVendor,
        date: formDate,
        cups_purchased: parseInt(cupsPurchased, 10),
        purchase_price_per_cup: parseFloat(pricePerCup),
        notes,
        created_by: user?.full_name || 'Admin',
      });

      success('Purchase added successfully');
      setAddModalOpen(false);
      resetForm();
      const updated = await purchasesService.getPurchases();
      setPurchases(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPurchase) return;

    setSubmitting(true);
    try {
      const loc = locations.find((l) => l.id === editPurchase.location_id);
      await purchasesService.updatePurchase(editPurchase.id, {
        ...editPurchase,
        location_name: loc?.name || editPurchase.location_name,
      });
      success('Purchase updated successfully');
      setEditPurchase(null);
      const updated = await purchasesService.getPurchases();
      setPurchases(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to update purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await purchasesService.deletePurchase(deleteId);
      success('Purchase deleted successfully');
      setDeleteId(null);
      const updated = await purchasesService.getPurchases();
      setPurchases(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to delete purchase');
    }
  };

  const resetForm = () => {
    setCupsPurchased('');
    setNotes('');
  };

  // Filtered dataset
  const range = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [purchases, range, locationFilter]);

  // Totals
  const totalPurchaseSpend = useMemo(
    () => filteredPurchases.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0),
    [filteredPurchases]
  );
  const totalCupsAcquired = useMemo(
    () => filteredPurchases.reduce((acc, curr) => acc + (parseInt(curr.cups_purchased, 10) || 0), 0),
    [filteredPurchases]
  );
  const avgUnitCost = totalCupsAcquired > 0 ? totalPurchaseSpend / totalCupsAcquired : 0;

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="font-medium">{formatDate(row.date)}</span>,
    },
    {
      header: 'Vendor',
      accessor: 'vendor_name',
      render: (row) => (
        <span className="font-semibold text-[#230E03] flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-chai-600" />
          {row.vendor_name}
        </span>
      ),
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
      header: 'Cups Purchased',
      accessor: 'cups_purchased',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-emerald-700">+{formatNumber(row.cups_purchased)}</span>
      ),
    },
    {
      header: 'Price / Cup',
      accessor: 'purchase_price_per_cup',
      align: 'right',
      render: (row) => <span>{formatCurrency(row.purchase_price_per_cup)}</span>,
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-[#230E03]">{formatCurrency(row.total_amount)}</span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewPurchase(row)}
            title="View Details"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-[#230E03] hover:bg-chai-100"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditPurchase(row)}
            title="Edit Purchase"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-chai-800 hover:bg-chai-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            title="Delete Purchase"
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
          <h2 className="text-lg font-bold text-[#230E03]">Purchases & Vendor Procurement</h2>
          <p className="text-xs text-[#7C7467]">
            Log cups/material purchases from vendors. Automatically updates stock & expense telemetry.
          </p>
        </div>

        <button onClick={() => setAddModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          + New Purchase
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Total Procurement Cost</p>
          <h3 className="text-2xl font-bold text-[#230E03] mt-1">{formatCurrency(totalPurchaseSpend)}</h3>
          <p className="text-xs text-[#A8A193] mt-1">{filteredPurchases.length} Purchase Orders</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Total Cups Purchased</p>
          <h3 className="text-2xl font-bold text-emerald-800 mt-1">{formatNumber(totalCupsAcquired)} <span className="text-xs font-normal text-[#7C7467]">cups</span></h3>
          <p className="text-xs text-[#A8A193] mt-1">Inbound stock added</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Average Unit Cost / Cup</p>
          <h3 className="text-2xl font-bold text-chai-800 mt-1">{formatCurrency(avgUnitCost)}</h3>
          <p className="text-xs text-[#A8A193] mt-1">Effective procurement rate</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h3 className="text-base font-bold text-[#230E03]">Purchase Orders History</h3>
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPurchases}
        searchKeys={['vendor_name', 'location_name', 'notes']}
        searchPlaceholder="Search vendor or location..."
        emptyTitle="No purchases found"
        emptyDescription="Create a purchase entry when acquiring cups or supplies."
        emptyActionLabel="+ New Purchase"
        onEmptyAction={() => setAddModalOpen(true)}
      />

      {/* Add Purchase Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create Purchase Order"
        subtitle="Record new cup or raw material procurement from vendor"
      >
        <form onSubmit={handleAddPurchase} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="vendors-list"
              placeholder="e.g. EcoCups Packaging"
              value={formVendor}
              onChange={(e) => setFormVendor(e.target.value)}
              className="input-field font-medium"
              required
            />
            <datalist id="vendors-list">
              {COMMON_VENDORS.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Destination Location
              </label>
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

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Cups Purchased <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={cupsPurchased}
                onChange={(e) => setCupsPurchased(e.target.value)}
                className="input-field font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Purchase Price / Cup (₹)
              </label>
              <input
                type="number"
                step="0.10"
                min="0.1"
                placeholder="e.g. 2.50"
                value={pricePerCup}
                onChange={(e) => setPricePerCup(e.target.value)}
                className="input-field font-medium"
                required
              />
            </div>
          </div>

          {/* Auto calculated total */}
          <div className="p-3 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-[#7C7467]">Total Order Amount</p>
              <p className="text-[11px] text-[#A8A193]">
                {cupsPurchased || 0} cups × ₹{pricePerCup || 0}
              </p>
            </div>
            <p className="text-xl font-bold text-[#230E03]">{formatCurrency(calculatedTotal)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Invoice / Delivery Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #PO-9821, paid via UPI"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {submitting ? 'Creating...' : '+ Create Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Modal */}
      {viewPurchase && (
        <Modal
          isOpen={Boolean(viewPurchase)}
          onClose={() => setViewPurchase(null)}
          title="Purchase Order Details"
          subtitle={`PO Ref: ${viewPurchase.id}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E2D8]">
              <div>
                <p className="text-xs text-[#7C7467]">Vendor</p>
                <p className="font-bold text-[#230E03]">{viewPurchase.vendor_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Location</p>
                <p className="font-bold text-[#230E03]">{viewPurchase.location_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Date</p>
                <p className="font-bold text-[#230E03]">{formatDate(viewPurchase.date)}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Cups Quantity</p>
                <p className="font-bold text-emerald-800">+{formatNumber(viewPurchase.cups_purchased)}</p>
              </div>
              <div>
                <p className="text-xs text-[#7C7467]">Unit Price / Cup</p>
                <p className="font-bold text-[#230E03]">{formatCurrency(viewPurchase.purchase_price_per_cup)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#E8E2D8]">
                <p className="text-xs text-[#7C7467]">Total Spend</p>
                <p className="text-xl font-extrabold text-[#230E03]">{formatCurrency(viewPurchase.total_amount)}</p>
              </div>
            </div>

            {viewPurchase.notes && (
              <div className="p-3 bg-white border border-[#E8E2D8] rounded-lg text-xs">
                <span className="font-semibold text-[#7C7467]">Notes: </span>
                {viewPurchase.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewPurchase(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Purchase Modal */}
      {editPurchase && (
        <Modal
          isOpen={Boolean(editPurchase)}
          onClose={() => setEditPurchase(null)}
          title="Edit Purchase Order"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Vendor Name</label>
              <input
                type="text"
                value={editPurchase.vendor_name}
                onChange={(e) => setEditPurchase({ ...editPurchase, vendor_name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Location</label>
                <select
                  value={editPurchase.location_id || ''}
                  onChange={(e) => setEditPurchase({ ...editPurchase, location_id: e.target.value })}
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
                  value={editPurchase.date}
                  onChange={(e) => setEditPurchase({ ...editPurchase, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Cups Purchased</label>
                <input
                  type="number"
                  value={editPurchase.cups_purchased}
                  onChange={(e) => setEditPurchase({ ...editPurchase, cups_purchased: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Price / Cup</label>
                <input
                  type="number"
                  step="0.1"
                  value={editPurchase.purchase_price_per_cup}
                  onChange={(e) => setEditPurchase({ ...editPurchase, purchase_price_per_cup: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Notes</label>
              <input
                type="text"
                value={editPurchase.notes || ''}
                onChange={(e) => setEditPurchase({ ...editPurchase, notes: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
              <button type="button" onClick={() => setEditPurchase(null)} className="btn-secondary">
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
        title="Delete Purchase Record"
        message="Are you sure you want to delete this purchase order? This will affect stock calculations and total expenses."
      />
    </div>
  );
};
