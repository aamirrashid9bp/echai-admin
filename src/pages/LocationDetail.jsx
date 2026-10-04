import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  User,
  ArrowLeft,
  ShoppingCart,
  DollarSign,
  Receipt,
  Boxes,
  TrendingUp,
} from 'lucide-react';
import { locationsService } from '../services/locationsService';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';
import { purchasesService } from '../services/purchasesService';
import { inventoryService } from '../services/inventoryService';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { StatsCard } from '../components/StatsCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DataTable } from '../components/DataTable';

export const LocationDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    loadLocationData();
  }, [id]);

  const loadLocationData = async () => {
    setLoading(true);
    try {
      const [locs, salesData, expData, purData, invData] = await Promise.all([
        locationsService.getLocations(),
        salesService.getSales(),
        expensesService.getExpenses(),
        purchasesService.getPurchases(),
        inventoryService.getInventory(),
      ]);

      const found = locs.find((l) => l.id === id);
      setLocation(found || null);
      setSales(salesData.filter((s) => s.location_id === id));
      setExpenses(expData.filter((e) => e.location_id === id));
      setPurchases(purData.filter((p) => p.location_id === id));
      setInventory(invData.filter((i) => i.location_id === id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalCupsSold = useMemo(
    () => sales.reduce((acc, curr) => acc + (parseInt(curr.cups_sold, 10) || 0), 0),
    [sales]
  );
  const totalRevenue = useMemo(
    () => sales.reduce((acc, curr) => acc + (parseFloat(curr.total_revenue) || 0), 0),
    [sales]
  );
  const totalExpenses = useMemo(() => {
    const exp = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const pur = purchases.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
    return exp + pur;
  }, [expenses, purchases]);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const currentStock = inventory.length > 0 ? inventory[0].closing_stock : 0;

  if (loading) {
    return <LoadingSpinner label="Loading location analytics..." />;
  }

  if (!location) {
    return (
      <div className="card p-12 text-center space-y-3">
        <h3 className="text-base font-bold text-[#230E03]">Location Not Found</h3>
        <p className="text-xs text-[#7C7467]">The specified location could not be loaded.</p>
        <Link to="/locations" className="btn-primary inline-flex mt-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Locations
        </Link>
      </div>
    );
  }

  const salesColumns = [
    { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
    { header: 'Cups Sold', accessor: 'cups_sold', align: 'right', render: (row) => formatNumber(row.cups_sold) },
    { header: 'Price / Cup', accessor: 'selling_price_per_cup', align: 'right', render: (row) => formatCurrency(row.selling_price_per_cup) },
    { header: 'Revenue', accessor: 'total_revenue', align: 'right', render: (row) => <span className="font-bold text-emerald-800">{formatCurrency(row.total_revenue)}</span> },
    { header: 'Staff', accessor: 'created_by' },
  ];

  const purchasesColumns = [
    { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
    { header: 'Vendor', accessor: 'vendor_name' },
    { header: 'Cups Purchased', accessor: 'cups_purchased', align: 'right', render: (row) => `+${formatNumber(row.cups_purchased)}` },
    { header: 'Price / Cup', accessor: 'purchase_price_per_cup', align: 'right', render: (row) => formatCurrency(row.purchase_price_per_cup) },
    { header: 'Total Spend', accessor: 'total_amount', align: 'right', render: (row) => <span className="font-bold">{formatCurrency(row.total_amount)}</span> },
  ];

  const expensesColumns = [
    { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
    { header: 'Category', accessor: 'category', render: (row) => <span className="badge bg-chai-50 text-chai-900 border border-chai-200">{row.category}</span> },
    { header: 'Description', accessor: 'description' },
    { header: 'Amount', accessor: 'amount', align: 'right', render: (row) => <span className="font-bold text-red-600">{formatCurrency(row.amount)}</span> },
    { header: 'Logged By', accessor: 'created_by' },
  ];

  const inventoryColumns = [
    { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
    { header: 'Opening Stock', accessor: 'opening_stock', align: 'right', render: (row) => formatNumber(row.opening_stock) },
    { header: 'Purchased', accessor: 'purchased_cups', align: 'right', render: (row) => `+${formatNumber(row.purchased_cups)}` },
    { header: 'Sold', accessor: 'sold_cups', align: 'right', render: (row) => `-${formatNumber(row.sold_cups)}` },
    { header: 'Wastage', accessor: 'wastage', align: 'right', render: (row) => `-${formatNumber(row.wastage)}` },
    { header: 'Closing Stock', accessor: 'closing_stock', align: 'right', render: (row) => <span className="font-bold">{formatNumber(row.closing_stock)}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/locations"
            className="inline-flex items-center gap-1 text-xs font-semibold text-chai-800 hover:text-chai-950 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Locations
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#230E03]">{location.name}</h2>
            <span
              className={`badge ${
                location.status === 'active'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              {location.status}
            </span>
          </div>
          {location.address && (
            <p className="text-xs text-[#7C7467] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-chai-600" />
              {location.address}
            </p>
          )}
        </div>

        {/* Contact Badge */}
        <div className="p-3 bg-white border border-[#EFE8DE] rounded-xl text-xs space-y-1">
          {location.contact_person && (
            <div className="flex items-center gap-1.5 text-[#230E03] font-medium">
              <User className="w-3.5 h-3.5 text-chai-700" />
              <span>{location.contact_person}</span>
            </div>
          )}
          {location.phone && (
            <div className="flex items-center gap-1.5 text-[#7C7467]">
              <Phone className="w-3.5 h-3.5 text-chai-700" />
              <span>{location.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-4">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Cups Sold</p>
          <p className="text-xl font-bold text-[#230E03] mt-1">{formatNumber(totalCupsSold)}</p>
          <span className="text-[11px] text-[#A8A193]">{sales.length} transactions</span>
        </div>

        <div className="card p-4">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(totalRevenue)}</p>
          <span className="text-[11px] text-[#A8A193]">Gross intake</span>
        </div>

        <div className="card p-4">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Total Cost</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
          <span className="text-[11px] text-[#A8A193]">Supplies & expenses</span>
        </div>

        <div className="card p-4">
          <p className="text-xs text-[#7C7467] font-medium uppercase tracking-wider">Net Profit</p>
          <p
            className={`text-xl font-bold mt-1 ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatCurrency(netProfit)}
          </p>
          <span className="text-[11px] font-semibold text-[#522A0D]">
            {profitMargin.toFixed(1)}% margin
          </span>
        </div>

        <div className="card p-4 bg-chai-900 text-white col-span-2 sm:col-span-1 shadow-md">
          <p className="text-xs text-chai-300 font-medium uppercase tracking-wider">Current Stock</p>
          <p className="text-xl font-extrabold mt-1">{formatNumber(currentStock)}</p>
          <span className="text-[11px] text-chai-300">Cups in hand</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-1">
          {[
            { id: 'sales', label: `Daily Sales (${sales.length})` },
            { id: 'purchases', label: `Purchases (${purchases.length})` },
            { id: 'expenses', label: `Expenses (${expenses.length})` },
            { id: 'inventory', label: `Inventory (${inventory.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-chai-900 border-t-2 border-t-chai-800 border-x border-[#EFE8DE]'
                  : 'text-[#7C7467] hover:text-[#230E03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'sales' && (
          <DataTable
            columns={salesColumns}
            data={sales}
            searchKeys={['created_by', 'notes']}
            searchPlaceholder="Search sales by staff..."
            emptyTitle="No sales recorded for this location"
          />
        )}

        {activeTab === 'purchases' && (
          <DataTable
            columns={purchasesColumns}
            data={purchases}
            searchKeys={['vendor_name', 'notes']}
            searchPlaceholder="Search by vendor..."
            emptyTitle="No purchases logged for this location"
          />
        )}

        {activeTab === 'expenses' && (
          <DataTable
            columns={expensesColumns}
            data={expenses}
            searchKeys={['description', 'category']}
            searchPlaceholder="Search expenses..."
            emptyTitle="No expenses logged for this location"
          />
        )}

        {activeTab === 'inventory' && (
          <DataTable
            columns={inventoryColumns}
            data={inventory}
            searchKeys={['notes']}
            searchPlaceholder="Search inventory notes..."
            emptyTitle="No inventory logs for this location"
          />
        )}
      </div>
    </div>
  );
};
