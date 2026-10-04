import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Edit2,
  Flame,
  Info,
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { locationsService } from '../services/locationsService';
import { settingsService } from '../services/settingsService';
import { useToast } from '../hooks/useToast';
import { formatNumber, formatDate } from '../utils/formatters';
import { calculateClosingStock } from '../utils/calculations';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';

export const Inventory = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [settings, setSettings] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [wastageModalOpen, setWastageModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Stock Form State
  const [formLocationId, setFormLocationId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [openingStock, setOpeningStock] = useState('0');
  const [purchasedCups, setPurchasedCups] = useState('0');
  const [soldCups, setSoldCups] = useState('0');
  const [wastage, setWastage] = useState('0');
  const [notes, setNotes] = useState('');

  // Wastage Form State
  const [wasteLocationId, setWasteLocationId] = useState('');
  const [wasteDate, setWasteDate] = useState(new Date().toISOString().split('T')[0]);
  const [wasteCups, setWasteCups] = useState('');
  const [wasteReason, setWasteReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, locData, settData] = await Promise.all([
        inventoryService.getInventory(),
        locationsService.getLocations(),
        settingsService.getSettings(),
      ]);
      setInventory(invData);
      setLocations(locData);
      setSettings(settData);
      if (locData.length > 0) {
        setFormLocationId(locData[0].id);
        setWasteLocationId(locData[0].id);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const calculatedClosing = useMemo(() => {
    return calculateClosingStock(openingStock, purchasedCups, soldCups, wastage);
  }, [openingStock, purchasedCups, soldCups, wastage]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loc = locations.find((l) => l.id === formLocationId);
      await inventoryService.addInventoryLog({
        location_id: formLocationId || null,
        location_name: loc?.name || 'Unassigned',
        date: formDate,
        opening_stock: parseInt(openingStock, 10) || 0,
        purchased_cups: parseInt(purchasedCups, 10) || 0,
        sold_cups: parseInt(soldCups, 10) || 0,
        wastage: parseInt(wastage, 10) || 0,
        notes,
      });

      success('Inventory updated successfully');
      setAddModalOpen(false);
      resetForm();
      const updated = await inventoryService.getInventory();
      setInventory(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to add inventory entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordWastage = async (e) => {
    e.preventDefault();
    if (!wasteCups || parseInt(wasteCups, 10) <= 0) {
      toastError('Please enter valid wastage cups count');
      return;
    }

    setSubmitting(true);
    try {
      const loc = locations.find((l) => l.id === wasteLocationId);
      // Find latest record for this location if any
      const existingLocEntry = inventory.find(
        (i) => i.location_id === wasteLocationId && i.date === wasteDate
      );

      if (existingLocEntry) {
        // update existing entry with additional wastage
        const newWaste = (existingLocEntry.wastage || 0) + parseInt(wasteCups, 10);
        await inventoryService.updateInventoryLog(existingLocEntry.id, {
          ...existingLocEntry,
          wastage: newWaste,
          notes: existingLocEntry.notes ? `${existingLocEntry.notes} | Wastage: ${wasteReason}` : `Wastage: ${wasteReason}`,
        });
      } else {
        await inventoryService.addInventoryLog({
          location_id: wasteLocationId || null,
          location_name: loc?.name || 'Unassigned',
          date: wasteDate,
          opening_stock: 0,
          purchased_cups: 0,
          sold_cups: 0,
          wastage: parseInt(wasteCups, 10),
          notes: `Wastage: ${wasteReason}`,
        });
      }

      success('Wastage recorded successfully');
      setWastageModalOpen(false);
      setWasteCups('');
      setWasteReason('');
      const updated = await inventoryService.getInventory();
      setInventory(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to record wastage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setSubmitting(true);
    try {
      const loc = locations.find((l) => l.id === editItem.location_id);
      await inventoryService.updateInventoryLog(editItem.id, {
        ...editItem,
        location_name: loc?.name || editItem.location_name,
      });
      success('Inventory log updated');
      setEditItem(null);
      const updated = await inventoryService.getInventory();
      setInventory(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to update inventory log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await inventoryService.deleteInventoryLog(deleteId);
      success('Inventory log deleted');
      setDeleteId(null);
      const updated = await inventoryService.getInventory();
      setInventory(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to delete inventory log');
    }
  };

  const resetForm = () => {
    setOpeningStock('0');
    setPurchasedCups('0');
    setSoldCups('0');
    setWastage('0');
    setNotes('');
  };

  // Filtered dataset
  const range = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [inventory, range, locationFilter]);

  // Total aggregated numbers
  const totalOpening = useMemo(
    () => filteredInventory.reduce((acc, curr) => acc + (parseInt(curr.opening_stock, 10) || 0), 0),
    [filteredInventory]
  );
  const totalPurchased = useMemo(
    () => filteredInventory.reduce((acc, curr) => acc + (parseInt(curr.purchased_cups, 10) || 0), 0),
    [filteredInventory]
  );
  const totalSold = useMemo(
    () => filteredInventory.reduce((acc, curr) => acc + (parseInt(curr.sold_cups, 10) || 0), 0),
    [filteredInventory]
  );
  const totalWastage = useMemo(
    () => filteredInventory.reduce((acc, curr) => acc + (parseInt(curr.wastage, 10) || 0), 0),
    [filteredInventory]
  );
  const totalClosing = useMemo(
    () => filteredInventory.reduce((acc, curr) => acc + (parseInt(curr.closing_stock, 10) || 0), 0),
    [filteredInventory]
  );

  const lowStockThreshold = settings?.low_stock_threshold || 100;
  const isLowStock = totalClosing <= lowStockThreshold && inventory.length > 0;

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
      header: 'Opening Stock',
      accessor: 'opening_stock',
      align: 'right',
      render: (row) => <span>{formatNumber(row.opening_stock)}</span>,
    },
    {
      header: 'Purchased',
      accessor: 'purchased_cups',
      align: 'right',
      render: (row) => (
        <span className="text-emerald-700 font-medium">+{formatNumber(row.purchased_cups)}</span>
      ),
    },
    {
      header: 'Sold Cups',
      accessor: 'sold_cups',
      align: 'right',
      render: (row) => (
        <span className="text-amber-700 font-medium">-{formatNumber(row.sold_cups)}</span>
      ),
    },
    {
      header: 'Wastage',
      accessor: 'wastage',
      align: 'right',
      render: (row) => (
        <span className="text-red-600 font-medium">-{formatNumber(row.wastage)}</span>
      ),
    },
    {
      header: 'Closing Stock',
      accessor: 'closing_stock',
      align: 'right',
      render: (row) => (
        <span
          className={`font-bold ${
            row.closing_stock <= lowStockThreshold ? 'text-red-600' : 'text-[#230E03]'
          }`}
        >
          {formatNumber(row.closing_stock)}
        </span>
      ),
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (row) => <span className="text-xs text-[#7C7467]">{row.notes || '-'}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditItem(row)}
            title="Edit Log"
            className="p-1.5 rounded-lg text-[#7C7467] hover:text-chai-800 hover:bg-chai-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            title="Delete Log"
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
          <h2 className="text-lg font-bold text-[#230E03]">Inventory Management</h2>
          <p className="text-xs text-[#7C7467]">
            Track daily cups replenishment, consumption, and stock levels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setWastageModalOpen(true)} className="btn-secondary">
            <Flame className="w-4 h-4 text-red-600" />
            Record Wastage
          </button>
          <button onClick={() => setAddModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            + Add Stock
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {isLowStock && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-950 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Low Stock Alert</p>
            <p className="text-amber-800 mt-0.5">
              Current closing stock ({formatNumber(totalClosing)} cups) is below the recommended threshold of {lowStockThreshold} cups. Please create a purchase order to replenish cups inventory.
            </p>
          </div>
        </div>
      )}

      {/* Display Cards: Opening, Purchased, Sold, Wastage, Closing Stock */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-4">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Opening Stock</p>
          <p className="text-xl font-bold text-[#230E03] mt-1">{formatNumber(totalOpening)}</p>
          <span className="text-[11px] text-[#A8A193]">Initial balance</span>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs text-emerald-800 font-medium uppercase tracking-wider">Purchased</p>
          <p className="text-xl font-bold text-emerald-900 mt-1">+{formatNumber(totalPurchased)}</p>
          <span className="text-[11px] text-[#A8A193]">Stock intake</span>
        </div>

        <div className="card p-4 border-l-4 border-l-amber-600">
          <p className="text-xs text-amber-800 font-medium uppercase tracking-wider">Sold</p>
          <p className="text-xl font-bold text-amber-900 mt-1">-{formatNumber(totalSold)}</p>
          <span className="text-[11px] text-[#A8A193]">Customer sales</span>
        </div>

        <div className="card p-4 border-l-4 border-l-red-600">
          <p className="text-xs text-red-800 font-medium uppercase tracking-wider">Wastage</p>
          <p className="text-xl font-bold text-red-900 mt-1">-{formatNumber(totalWastage)}</p>
          <span className="text-[11px] text-[#A8A193]">Damaged/Spoiled</span>
        </div>

        <div className="card p-4 bg-chai-900 text-white col-span-2 sm:col-span-1 shadow-md">
          <p className="text-xs text-chai-300 font-medium uppercase tracking-wider">Closing Stock</p>
          <p className="text-2xl font-extrabold mt-1">{formatNumber(totalClosing)}</p>
          <span className="text-[11px] text-chai-300">Remaining cups</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h3 className="text-base font-bold text-[#230E03]">Stock Logs & Reconciliation</h3>
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

      {/* Stock History Table */}
      <DataTable
        columns={columns}
        data={filteredInventory}
        searchKeys={['location_name', 'notes']}
        searchPlaceholder="Search by location or notes..."
        emptyTitle="No inventory logs recorded"
        emptyDescription="Add opening stock or record daily consumption."
        emptyActionLabel="+ Add Stock"
        onEmptyAction={() => setAddModalOpen(true)}
      />

      {/* Add Stock Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Inventory Stock"
        subtitle="Log opening cups, stock additions, or reconcile counts"
      >
        <form onSubmit={handleAddStock} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Opening Stock</label>
              <input
                type="number"
                min="0"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Purchased Cups</label>
              <input
                type="number"
                min="0"
                value={purchasedCups}
                onChange={(e) => setPurchasedCups(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Sold Cups</label>
              <input
                type="number"
                min="0"
                value={soldCups}
                onChange={(e) => setSoldCups(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Wastage Cups</label>
              <input
                type="number"
                min="0"
                value={wastage}
                onChange={(e) => setWastage(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-chai-50 border border-chai-100 rounded-lg flex items-center justify-between text-xs">
            <span className="text-[#7C7467]">Calculated Closing Stock:</span>
            <span className="text-base font-bold text-chai-900">{formatNumber(calculatedClosing)} cups</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Morning batch intake"
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
              {submitting ? 'Saving...' : 'Save Stock Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Wastage Modal */}
      <Modal
        isOpen={wastageModalOpen}
        onClose={() => setWastageModalOpen(false)}
        title="Record Wastage"
        subtitle="Log broken cups, spills, or material wastage"
      >
        <form onSubmit={handleRecordWastage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">Location</label>
            <select
              value={wasteLocationId}
              onChange={(e) => setWasteLocationId(e.target.value)}
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
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">Date</label>
            <input
              type="date"
              value={wasteDate}
              onChange={(e) => setWasteDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Cups Wasted / Damaged <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={wasteCups}
              onChange={(e) => setWasteCups(e.target.value)}
              className="input-field font-semibold text-red-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Reason / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Crushed during delivery / Transit leak"
              value={wasteReason}
              onChange={(e) => setWasteReason(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
            <button
              type="button"
              onClick={() => setWastageModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-danger">
              {submitting ? 'Recording...' : 'Record Wastage'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Log Modal */}
      {editItem && (
        <Modal
          isOpen={Boolean(editItem)}
          onClose={() => setEditItem(null)}
          title="Edit Inventory Log"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Location</label>
              <select
                value={editItem.location_id || ''}
                onChange={(e) => setEditItem({ ...editItem, location_id: e.target.value })}
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
                value={editItem.date}
                onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Opening Stock</label>
                <input
                  type="number"
                  value={editItem.opening_stock}
                  onChange={(e) => setEditItem({ ...editItem, opening_stock: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Purchased</label>
                <input
                  type="number"
                  value={editItem.purchased_cups}
                  onChange={(e) => setEditItem({ ...editItem, purchased_cups: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Sold</label>
                <input
                  type="number"
                  value={editItem.sold_cups}
                  onChange={(e) => setEditItem({ ...editItem, sold_cups: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">Wastage</label>
                <input
                  type="number"
                  value={editItem.wastage}
                  onChange={(e) => setEditItem({ ...editItem, wastage: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Notes</label>
              <input
                type="text"
                value={editItem.notes || ''}
                onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
              <button type="button" onClick={() => setEditItem(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Log"
        message="Are you sure you want to remove this stock record? This may affect closing balance calculations."
      />
    </div>
  );
};
