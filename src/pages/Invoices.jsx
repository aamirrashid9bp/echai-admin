import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Eye,
  Trash2,
  DollarSign,
  Building,
  Calendar,
  X,
} from 'lucide-react';
import { invoicesService, generateInvoiceNumber } from '../services/invoicesService';
import { locationsService } from '../services/locationsService';
import { settingsService } from '../services/settingsService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';

export const Invoices = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [settings, setSettings] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Invoice Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { description: 'Freshly Brewed Hot Chai Supply (Bulk)', quantity: 50, price: 20 },
  ]);
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, locData, settData] = await Promise.all([
        invoicesService.getInvoices(),
        locationsService.getLocations(),
        settingsService.getSettings(),
      ]);
      setInvoices(invData);
      setLocations(locData);
      setSettings(settData);
      if (locData.length > 0) {
        setLocationId(locData[0].id);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setInvoiceNumber(generateInvoiceNumber());
    setItems([{ description: 'Freshly Brewed Hot Chai Supply (Bulk)', quantity: 50, price: 20 }]);
    setCustomerName('');
    setTax('0');
    setDiscount('0');
    setNotes('');
    setCreateModalOpen(true);
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, price: 20 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index, field, val) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const calculatedSubtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = parseInt(it.quantity, 10) || 0;
      const p = parseFloat(it.price) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  const calculatedTotal = useMemo(() => {
    const t = parseFloat(tax) || 0;
    const d = parseFloat(discount) || 0;
    return Math.max(0, calculatedSubtotal + t - d);
  }, [calculatedSubtotal, tax, discount]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toastError('Please specify customer/client business name');
      return;
    }

    setSubmitting(true);
    try {
      const selectedLoc = locations.find((l) => l.id === locationId);
      await invoicesService.createInvoice(
        {
          invoice_number: invoiceNumber,
          location_id: locationId || null,
          location_name: selectedLoc?.name || 'Unassigned',
          date,
          customer_name: customerName,
          tax: parseFloat(tax) || 0,
          discount: parseFloat(discount) || 0,
          notes,
          created_by: user?.full_name || 'Admin',
        },
        items
      );

      success('Invoice created successfully');
      setCreateModalOpen(false);
      const updated = await invoicesService.getInvoices();
      setInvoices(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await invoicesService.deleteInvoice(deleteId);
      success('Invoice deleted');
      setDeleteId(null);
      const updated = await invoicesService.getInvoices();
      setInvoices(updated);
    } catch (err) {
      console.error(err);
      toastError('Failed to delete invoice');
    }
  };

  const printInvoice = () => {
    window.print();
  };

  // Filtered dataset
  const range = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [invoices, range, locationFilter]);

  const totalInvoiced = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0),
    [filteredInvoices]
  );

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
      render: (row) => (
        <span className="font-bold text-chai-900 font-mono">{row.invoice_number}</span>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="font-medium">{formatDate(row.date)}</span>,
    },
    {
      header: 'Customer / Client',
      accessor: 'customer_name',
      render: (row) => (
        <span className="font-semibold text-[#230E03] flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-chai-600" />
          {row.customer_name}
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
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200">
          {row.status || 'Paid'}
        </span>
      ),
    },
    {
      header: 'Total (INR)',
      accessor: 'total',
      align: 'right',
      render: (row) => (
        <span className="font-extrabold text-[#230E03]">{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewInvoice(row)}
            title="View Printable Invoice"
            className="p-1.5 rounded-lg text-chai-800 hover:bg-chai-100 font-medium text-xs flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            title="Delete Invoice"
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
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-[#230E03]">Invoices & Corporate Billing</h2>
          <p className="text-xs text-[#7C7467]">
            Generate official printable tax invoices for office client corporate accounts.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          + Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="card p-5">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Total Invoiced Amount</p>
          <h3 className="text-2xl font-bold text-emerald-800 mt-1">{formatCurrency(totalInvoiced)}</h3>
          <p className="text-xs text-[#A8A193] mt-1">{filteredInvoices.length} Invoices issued</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Total Invoices</p>
          <h3 className="text-2xl font-bold text-[#230E03] mt-1">{filteredInvoices.length}</h3>
          <p className="text-xs text-[#A8A193] mt-1">Generated and settled</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Default Currency</p>
          <h3 className="text-2xl font-bold text-chai-800 mt-1">INR (₹)</h3>
          <p className="text-xs text-[#A8A193] mt-1">Indian Rupee standard</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 no-print">
        <h3 className="text-base font-bold text-[#230E03]">Invoices Ledger</h3>
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
      <div className="no-print">
        <DataTable
          columns={columns}
          data={filteredInvoices}
          searchKeys={['invoice_number', 'customer_name', 'location_name']}
          searchPlaceholder="Search invoice #, client, location..."
          emptyTitle="No invoices created"
          emptyDescription="Issue corporate bills and export professional invoices for client offices."
          emptyActionLabel="+ Create Invoice"
          onEmptyAction={handleOpenCreate}
        />
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Invoice"
        subtitle="Generate printable bill for office or event supply"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="input-field font-mono font-bold bg-[#FAF9F6]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">Invoice Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Customer / Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Tech Corp Pvt Ltd"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Serviced Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
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

          {/* Line Items */}
          <div className="space-y-2 pt-2 border-t border-[#F3EFEA]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#522A0D] uppercase tracking-wider">
                Invoice Items
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-chai-800 font-semibold hover:underline"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F6] border border-[#E8E2D8]">
                  <input
                    type="text"
                    placeholder="Description of item"
                    value={it.description}
                    onChange={(e) => updateItemRow(idx, 'description', e.target.value)}
                    className="flex-1 input-field py-1.5 text-xs"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                    className="w-20 input-field py-1.5 text-xs text-center"
                    required
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Rate"
                    value={it.price}
                    onChange={(e) => updateItemRow(idx, 'price', e.target.value)}
                    className="w-24 input-field py-1.5 text-xs text-right"
                    required
                  />
                  <span className="w-24 text-right text-xs font-bold text-[#230E03]">
                    {formatCurrency((it.quantity || 0) * (it.price || 0))}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-[#A8A193] hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Discount */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Taxes / GST (₹)
              </label>
              <input
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#522A0D] mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="p-3 bg-chai-50 border border-chai-100 rounded-xl flex items-center justify-between">
            <div className="text-xs text-[#7C7467]">
              Subtotal: <span className="font-semibold text-[#230E03]">{formatCurrency(calculatedSubtotal)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#7C7467]">Total Payable: </span>
              <span className="text-xl font-extrabold text-[#230E03] ml-1">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#522A0D] mb-1">
              Remarks / Payment Terms
            </label>
            <input
              type="text"
              placeholder="e.g. Net 15 days, paid via NEFT"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Save & Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Printable Invoice Modal */}
      {viewInvoice && (
        <Modal
          isOpen={Boolean(viewInvoice)}
          onClose={() => setViewInvoice(null)}
          title="Tax Invoice"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-end gap-2 no-print border-b border-[#F3EFEA] pb-3">
              <button onClick={printInvoice} className="btn-primary text-xs">
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>

            {/* Printable Document Area */}
            <div className="p-6 bg-white border border-[#E8E2D8] rounded-2xl space-y-6 text-sm">
              {/* Top Banner */}
              <div className="flex items-start justify-between border-b border-[#E8E2D8] pb-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-chai-900">echaii</h1>
                  <p className="text-xs text-[#7C7467] mt-0.5">
                    {settings?.address || 'Commercial Hub, Gurugram, India'}
                  </p>
                  <p className="text-xs text-[#7C7467]">
                    Phone: {settings?.phone || '+91 9876543210'} • Email: {settings?.email || 'admin@echaii.com'}
                  </p>
                  {settings?.gst_number && (
                    <p className="text-xs font-mono text-[#522A0D] mt-1">
                      GSTIN: {settings.gst_number}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="badge bg-chai-100 text-chai-900 border border-chai-200 text-xs font-bold uppercase mb-1">
                    TAX INVOICE
                  </span>
                  <p className="font-mono font-bold text-base text-[#230E03] mt-1">
                    {viewInvoice.invoice_number}
                  </p>
                  <p className="text-xs text-[#7C7467]">Date: {formatDate(viewInvoice.date)}</p>
                </div>
              </div>

              {/* Bill To & Location */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E2D8] text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#7C7467] uppercase tracking-wider">
                    BILLED TO:
                  </span>
                  <p className="text-sm font-bold text-[#230E03] mt-0.5">
                    {viewInvoice.customer_name}
                  </p>
                  <p className="text-[#595246] mt-0.5">Corporate Client</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#7C7467] uppercase tracking-wider">
                    DELIVERY LOCATION:
                  </span>
                  <p className="text-sm font-bold text-[#230E03] mt-0.5">
                    {viewInvoice.location_name}
                  </p>
                  <p className="text-[#595246] mt-0.5">echaii Service Point</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-[#E8E2D8] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-[#E8E2D8] font-semibold text-[#7C7467] uppercase">
                      <th className="py-3 px-4">Item Description</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Price / Unit</th>
                      <th className="py-3 px-4 text-right">Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA]">
                    {(viewInvoice.items || []).length > 0 ? (
                      viewInvoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-4 font-medium text-[#230E03]">
                            {it.description}
                          </td>
                          <td className="py-3 px-4 text-center">{it.quantity}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(it.price)}</td>
                          <td className="py-3 px-4 text-right font-bold text-[#230E03]">
                            {formatCurrency(it.total || it.quantity * it.price)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-medium text-[#230E03]">
                          Fresh Hot Chai Supply
                        </td>
                        <td className="py-3 px-4 text-center">1</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(viewInvoice.total)}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#230E03]">
                          {formatCurrency(viewInvoice.total)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-[#7C7467]">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-[#230E03]">
                      {formatCurrency(viewInvoice.subtotal || viewInvoice.total)}
                    </span>
                  </div>
                  {viewInvoice.tax > 0 && (
                    <div className="flex justify-between text-[#7C7467]">
                      <span>Tax / GST:</span>
                      <span className="font-semibold text-[#230E03]">{formatCurrency(viewInvoice.tax)}</span>
                    </div>
                  )}
                  {viewInvoice.discount > 0 && (
                    <div className="flex justify-between text-[#7C7467]">
                      <span>Discount:</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(viewInvoice.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-[#230E03] pt-2 border-t border-[#E8E2D8]">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(viewInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Footer */}
              <div className="pt-6 border-t border-[#E8E2D8] text-[11px] text-[#7C7467] flex justify-between items-end">
                <div>
                  <p className="font-semibold text-[#230E03]">Terms & Notes:</p>
                  <p>{viewInvoice.notes || 'Payment due on receipt. Thank you for choosing echaii.'}</p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-b border-[#230E03] mb-1"></div>
                  <p className="font-semibold text-[#230E03]">Authorized Signatory</p>
                  <p>echaii Management</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="Are you sure you want to permanently delete this invoice record?"
      />
    </div>
  );
};
