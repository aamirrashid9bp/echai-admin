import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Phone,
  User,
  ArrowRight,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Boxes,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { locationsService } from '../services/locationsService';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';
import { purchasesService } from '../services/purchasesService';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Locations = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locData, salesData, expData, purData, invData] = await Promise.all([
        locationsService.getLocations(),
        salesService.getSales(),
        expensesService.getExpenses(),
        purchasesService.getPurchases(),
        inventoryService.getInventory(),
      ]);
      setLocations(locData);
      setSales(salesData);
      setExpenses(expData);
      setPurchases(purData);
      setInventory(invData);
    } catch (err) {
      console.error(err);
      toastError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Please enter a location name');
      return;
    }

    setSubmitting(true);
    try {
      await locationsService.addLocation({
        name,
        address,
        contactPerson,
        phone,
        status,
      });
      success('Location added successfully');
      setAddModalOpen(false);
      resetForm();
      const updated = await locationsService.getLocations();
      setLocations(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLocation) return;

    setSubmitting(true);
    try {
      await locationsService.updateLocation(editLocation.id, editLocation);
      success('Location updated successfully');
      setEditLocation(null);
      const updated = await locationsService.getLocations();
      setLocations(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to update location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await locationsService.deleteLocation(deleteId);
      success('Location deleted');
      setDeleteId(null);
      const updated = await locationsService.getLocations();
      setLocations(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to delete location');
    }
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setContactPerson('');
    setPhone('');
    setStatus('active');
  };

  // Location telemetry map
  const locationStats = useMemo(() => {
    const map = {};
    locations.forEach((loc) => {
      const locSales = sales.filter((s) => s.location_id === loc.id);
      const locExp = expenses.filter((e) => e.location_id === loc.id);
      const locPur = purchases.filter((p) => p.location_id === loc.id);
      const locInv = inventory.filter((i) => i.location_id === loc.id);

      const cups = locSales.reduce((sum, s) => sum + (parseInt(s.cups_sold, 10) || 0), 0);
      const rev = locSales.reduce((sum, s) => sum + (parseFloat(s.total_revenue) || 0), 0);
      const exp =
        locExp.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) +
        locPur.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
      const profit = rev - exp;
      const latestClosing = locInv.length > 0 ? locInv[0].closing_stock : 0;

      map[loc.id] = {
        cups,
        revenue: rev,
        expenses: exp,
        profit,
        stock: latestClosing,
      };
    });
    return map;
  }, [locations, sales, expenses, purchases, inventory]);

  if (loading) {
    return <LoadingSpinner label="Loading locations & office points..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#230E03]">Location & Office Management</h2>
          <p className="text-xs text-[#7C7467]">
            Add and manage echaii client office locations, corporate hubs, and outlets.
          </p>
        </div>

        <button onClick={() => setAddModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          + Add Location
        </button>
      </div>

      {/* Locations Cards Grid */}
      {locations.length === 0 ? (
        <div className="card p-12 text-center bg-[#FAF9F6] border-dashed border-2 border-[#E8E2D8] space-y-3">
          <div className="w-12 h-12 rounded-xl bg-chai-100 text-chai-800 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#230E03]">No locations created yet</h3>
          <p className="text-xs text-[#7C7467] max-w-sm mx-auto">
            Add client offices or outlets to start logging location-based POS sales and inventory.
          </p>
          <button onClick={() => setAddModalOpen(true)} className="btn-primary mt-2">
            <Plus className="w-4 h-4" />
            + Add First Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => {
            const stats = locationStats[loc.id] || {
              cups: 0,
              revenue: 0,
              expenses: 0,
              profit: 0,
              stock: 0,
            };

            return (
              <div
                key={loc.id}
                className="card p-5 flex flex-col justify-between hover:border-chai-400 transition-all duration-200 group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#230E03] group-hover:text-chai-800 transition-colors">
                          {loc.name}
                        </h3>
                        <span
                          className={`badge ${
                            loc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {loc.status}
                        </span>
                      </div>
                      {loc.address && (
                        <p className="text-xs text-[#7C7467] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-chai-600 flex-shrink-0" />
                          <span className="truncate">{loc.address}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditLocation(loc)}
                        title="Edit Location"
                        className="p-1 rounded-lg text-[#7C7467] hover:text-chai-800 hover:bg-chai-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(loc.id)}
                        title="Delete Location"
                        className="p-1 rounded-lg text-[#7C7467] hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-3 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl text-xs space-y-1 mb-4">
                    {loc.contact_person && (
                      <div className="flex items-center gap-1.5 text-[#522A0D]">
                        <User className="w-3.5 h-3.5 text-chai-700" />
                        <span>{loc.contact_person}</span>
                      </div>
                    )}
                    {loc.phone && (
                      <div className="flex items-center gap-1.5 text-[#7C7467]">
                        <Phone className="w-3.5 h-3.5 text-chai-700" />
                        <span>{loc.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Operational Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE8DE]">
                      <span className="text-[10px] uppercase font-semibold text-[#7C7467]">
                        Cups Dispensed
                      </span>
                      <p className="font-bold text-[#230E03] text-sm mt-0.5">
                        {formatNumber(stats.cups)} cups
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE8DE]">
                      <span className="text-[10px] uppercase font-semibold text-[#7C7467]">
                        Current Stock
                      </span>
                      <p className="font-bold text-[#230E03] text-sm mt-0.5">
                        {formatNumber(stats.stock)} cups
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE8DE]">
                      <span className="text-[10px] uppercase font-semibold text-[#7C7467]">
                        Revenue
                      </span>
                      <p className="font-bold text-emerald-800 text-sm mt-0.5">
                        {formatCurrency(stats.revenue)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE8DE]">
                      <span className="text-[10px] uppercase font-semibold text-[#7C7467]">
                        Net Profit
                      </span>
                      <p
                        className={`font-bold text-sm mt-0.5 ${
                          stats.profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(stats.profit)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Button */}
                <Link
                  to={`/locations/${loc.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-chai-50 border border-chai-200 text-xs font-semibold text-chai-900 hover:bg-chai-800 hover:text-white transition-colors"
                >
                  <span>View Location Analytics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Location Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Location"
        subtitle="Create an office, corporate site, or kiosk point"
      >
        <form onSubmit={handleAddLocation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Tower 3 - Ground Floor Cafe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">Address</label>
            <input
              type="text"
              placeholder="e.g. Cyber Hub, DLF Phase 2, Gurugram"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Rajesh Sharma"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select-field font-medium"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {submitting ? 'Saving...' : '+ Create Location'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Location Modal */}
      {editLocation && (
        <Modal
          isOpen={Boolean(editLocation)}
          onClose={() => setEditLocation(null)}
          title="Edit Location"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Location Name
              </label>
              <input
                type="text"
                value={editLocation.name}
                onChange={(e) => setEditLocation({ ...editLocation, name: e.target.value })}
                className="input-field font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Address</label>
              <input
                type="text"
                value={editLocation.address || ''}
                onChange={(e) => setEditLocation({ ...editLocation, address: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editLocation.contact_person || ''}
                  onChange={(e) =>
                    setEditLocation({ ...editLocation, contact_person: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editLocation.phone || ''}
                  onChange={(e) => setEditLocation({ ...editLocation, phone: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Status</label>
              <select
                value={editLocation.status}
                onChange={(e) => setEditLocation({ ...editLocation, status: e.target.value })}
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
              <button
                type="button"
                onClick={() => setEditLocation(null)}
                className="btn-secondary"
              >
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
        title="Delete Location"
        message="Are you sure you want to delete this location? Connected sales, purchases and stock history will become unassigned."
      />
    </div>
  );
};
