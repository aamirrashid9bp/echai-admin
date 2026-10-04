import React, { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart2,
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';
import { purchasesService } from '../services/purchasesService';
import { inventoryService } from '../services/inventoryService';
import { locationsService } from '../services/locationsService';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { calculateNetProfit, calculateProfitMargin } from '../utils/calculations';
import { exportToCSV, exportReportPDF } from '../utils/exportUtils';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';

export const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filter
  const [reportType, setReportType] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, expData, purData, invData, locData] = await Promise.all([
        salesService.getSales(),
        expensesService.getExpenses(),
        purchasesService.getPurchases(),
        inventoryService.getInventory(),
        locationsService.getLocations(),
      ]);
      setSales(salesData);
      setExpenses(expData);
      setPurchases(purData);
      setInventory(invData);
      setLocations(locData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const range = useMemo(
    () => getDateRange(reportType, customStart, customEnd),
    [reportType, customStart, customEnd]
  );

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = selectedLocation === 'all' || item.location_id === selectedLocation;
      return matchDate && matchLoc;
    });
  }, [sales, range, selectedLocation]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = selectedLocation === 'all' || item.location_id === selectedLocation;
      return matchDate && matchLoc;
    });
  }, [expenses, range, selectedLocation]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = selectedLocation === 'all' || item.location_id === selectedLocation;
      return matchDate && matchLoc;
    });
  }, [purchases, range, selectedLocation]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = selectedLocation === 'all' || item.location_id === selectedLocation;
      return matchDate && matchLoc;
    });
  }, [inventory, range, selectedLocation]);

  // Aggregate Figures
  const totalCupsSold = useMemo(
    () => filteredSales.reduce((acc, curr) => acc + (parseInt(curr.cups_sold, 10) || 0), 0),
    [filteredSales]
  );
  const totalRevenue = useMemo(
    () => filteredSales.reduce((acc, curr) => acc + (parseFloat(curr.total_revenue) || 0), 0),
    [filteredSales]
  );
  const directExpenses = useMemo(
    () => filteredExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
    [filteredExpenses]
  );
  const totalPurchasesCost = useMemo(
    () => filteredPurchases.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0),
    [filteredPurchases]
  );
  const cupsPurchased = useMemo(
    () => filteredPurchases.reduce((acc, curr) => acc + (parseInt(curr.cups_purchased, 10) || 0), 0),
    [filteredPurchases]
  );
  const totalExpenses = directExpenses + totalPurchasesCost;
  const netProfit = calculateNetProfit(totalRevenue, totalExpenses);
  const profitMargin = calculateProfitMargin(netProfit, totalRevenue);
  const totalWastage = useMemo(
    () => filteredInventory.reduce((acc, curr) => acc + (parseInt(curr.wastage, 10) || 0), 0),
    [filteredInventory]
  );

  // Expense Categories Map
  const expenseBreakdown = useMemo(() => {
    const map = {
      'Chai Cost': 0,
      'Cup Cost': totalPurchasesCost,
      'Tissue Cost': 0,
      'Travelling / Transport': 0,
      'Other Expenses': 0,
    };
    filteredExpenses.forEach((e) => {
      if (map[e.category] !== undefined) {
        map[e.category] += parseFloat(e.amount) || 0;
      } else {
        map['Other Expenses'] += parseFloat(e.amount) || 0;
      }
    });
    return map;
  }, [filteredExpenses, totalPurchasesCost]);

  // Location-wise Table
  const locationReports = useMemo(() => {
    return locations.map((loc) => {
      const locSales = filteredSales.filter((s) => s.location_id === loc.id);
      const locExp = filteredExpenses.filter((e) => e.location_id === loc.id);
      const locPur = filteredPurchases.filter((p) => p.location_id === loc.id);

      const cups = locSales.reduce((sum, s) => sum + (parseInt(s.cups_sold, 10) || 0), 0);
      const rev = locSales.reduce((sum, s) => sum + (parseFloat(s.total_revenue) || 0), 0);
      const exp =
        locExp.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) +
        locPur.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
      const profit = rev - exp;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;

      return {
        id: loc.id,
        name: loc.name,
        cups,
        revenue: rev,
        expenses: exp,
        profit,
        margin,
      };
    });
  }, [locations, filteredSales, filteredExpenses, filteredPurchases]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export
  const handleExportPDF = () => {
    const title = `echaii Operations & Performance Report (${reportType.toUpperCase()})`;
    const summaryData = [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
      { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
      { label: 'Net Profit', value: formatCurrency(netProfit) },
      { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%` },
      { label: 'Cups Sold', value: `${formatNumber(totalCupsSold)} cups` },
      { label: 'Cups Purchased', value: `${formatNumber(cupsPurchased)} cups` },
    ];

    const tableHeaders = ['Location', 'Cups Sold', 'Revenue', 'Expenses', 'Net Profit', 'Margin'];
    const tableRows = locationReports.map((loc) => [
      loc.name,
      formatNumber(loc.cups),
      formatCurrency(loc.revenue),
      formatCurrency(loc.expenses),
      formatCurrency(loc.profit),
      `${loc.margin.toFixed(1)}%`,
    ]);

    exportReportPDF(title, summaryData, tableHeaders, tableRows);
  };

  // CSV Export
  const handleExportCSV = () => {
    const rows = filteredSales.map((s) => ({
      date: s.date,
      location: s.location_name,
      cups_sold: s.cups_sold,
      price_per_cup: s.selling_price_per_cup,
      total_revenue: s.total_revenue,
      created_by: s.created_by,
    }));
    const headers = {
      date: 'Date',
      location: 'Location',
      cups_sold: 'Cups Sold',
      price_per_cup: 'Price/Cup (INR)',
      total_revenue: 'Total Revenue (INR)',
      created_by: 'Created By',
    };
    exportToCSV(`echaii_sales_report_${reportType}`, rows, headers);
  };

  if (loading) {
    return <LoadingSpinner label="Generating business report..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-[#230E03]">Comprehensive Business Reports</h2>
          <p className="text-xs text-[#7C7467]">
            Generate official audits, profitability statements, and location breakdowns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleExportPDF} className="btn-secondary">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button onClick={handleExportCSV} className="btn-primary">
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#522A0D]">Period:</span>
          <DateFilter
            value={reportType}
            onChange={setReportType}
            customStart={customStart}
            customEnd={customEnd}
            onCustomChange={(s, e) => {
              setCustomStart(s);
              setCustomEnd(e);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#522A0D]">Location:</span>
          <LocationFilter
            locations={locations}
            value={selectedLocation}
            onChange={setSelectedLocation}
          />
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="card p-8 bg-white border border-[#EFE8DE] space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Header Branding */}
        <div className="flex items-start justify-between border-b border-[#E8E2D8] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl text-chai-900 tracking-tight">echaii</span>
              <span className="badge bg-chai-100 text-chai-900 border border-chai-200 uppercase text-[10px]">
                Business Report
              </span>
            </div>
            <p className="text-xs text-[#7C7467]">
              Internal POS, Inventory & Financial Reconciliation Statement
            </p>
          </div>

          <div className="text-right text-xs text-[#7C7467] space-y-0.5">
            <p className="font-semibold text-[#230E03]">
              Period:{' '}
              <span className="text-chai-800 capitalize">
                {range.start ? `${formatDate(range.start)} - ${formatDate(range.end)}` : 'All Time'}
              </span>
            </p>
            <p>Generated: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C7467] mb-3">
            Executive Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-[#7C7467]">Cups Sold</p>
              <p className="text-lg font-bold text-[#230E03] mt-0.5">{formatNumber(totalCupsSold)}</p>
            </div>
            <div className="p-3.5 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-[#7C7467]">Cups Purchased</p>
              <p className="text-lg font-bold text-emerald-800 mt-0.5">+{formatNumber(cupsPurchased)}</p>
            </div>
            <div className="p-3.5 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-[#7C7467]">Gross Revenue</p>
              <p className="text-lg font-bold text-emerald-800 mt-0.5">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-3.5 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-[#7C7467]">Total Expenses</p>
              <p className="text-lg font-bold text-red-600 mt-0.5">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3.5 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-[#7C7467]">Net Profit</p>
              <p
                className={`text-lg font-extrabold mt-0.5 ${
                  netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-[#7C7467]">Profit Margin</p>
              <p className="text-lg font-extrabold text-[#230E03] mt-0.5">{profitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Location-wise Performance Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C7467]">
            Location-wise Performance Breakdown
          </h3>
          <div className="overflow-x-auto border border-[#E8E2D8] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E8E2D8] text-[11px] font-semibold text-[#7C7467] uppercase">
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Cups Dispensed</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Total Expenses</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {locationReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#7C7467]">
                      No locations found.
                    </td>
                  </tr>
                ) : (
                  locationReports.map((loc) => (
                    <tr key={loc.id} className="hover:bg-[#FDFBF7]">
                      <td className="py-2.5 px-3 font-semibold text-[#230E03]">{loc.name}</td>
                      <td className="py-2.5 px-3 text-right">{formatNumber(loc.cups)} cups</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-800">
                        {formatCurrency(loc.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-red-600">
                        {formatCurrency(loc.expenses)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          loc.profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(loc.profit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        {loc.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C7467]">
            Expense Category Allocation
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {Object.keys(expenseBreakdown).map((cat) => (
              <div key={cat} className="p-3 bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-[#7C7467]">{cat}</span>
                <p className="font-bold text-[#230E03] mt-1">
                  {formatCurrency(expenseBreakdown[cat])}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Audit Note */}
        <div className="p-4 bg-chai-50/60 border border-chai-200 rounded-xl text-xs space-y-1">
          <div className="font-bold text-chai-950 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-chai-700" />
            Inventory & Wastage Audit
          </div>
          <p className="text-[#595246]">
            Total cups purchased: <strong className="text-[#230E03]">{formatNumber(cupsPurchased)}</strong> | Total cups sold: <strong className="text-[#230E03]">{formatNumber(totalCupsSold)}</strong> | Recorded wastage: <strong className="text-[#230E03]">{formatNumber(totalWastage)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
