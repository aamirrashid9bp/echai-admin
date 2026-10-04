import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { StatsCard } from '../components/StatsCard';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';
import { purchasesService } from '../services/purchasesService';
import { inventoryService } from '../services/inventoryService';
import { locationsService } from '../services/locationsService';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';
import { calculateNetProfit } from '../utils/calculations';

const PIE_COLORS = ['#7B3F11', '#B87333', '#C9A887', '#522A0D', '#9B5824'];

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);

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
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const range = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  // Filtered dataset
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [sales, range, locationFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [expenses, range, locationFilter]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [purchases, range, locationFilter]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchDate = isWithinDateRange(item.date, range);
      const matchLoc = locationFilter === 'all' || item.location_id === locationFilter;
      return matchDate && matchLoc;
    });
  }, [inventory, range, locationFilter]);

  // Aggregate KPIs
  const totalRevenue = useMemo(
    () => filteredSales.reduce((acc, curr) => acc + (parseFloat(curr.total_revenue) || 0), 0),
    [filteredSales]
  );

  const totalCupsSold = useMemo(
    () => filteredSales.reduce((acc, curr) => acc + (parseInt(curr.cups_sold, 10) || 0), 0),
    [filteredSales]
  );

  const directExpenses = useMemo(
    () => filteredExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
    [filteredExpenses]
  );

  const purchaseCost = useMemo(
    () => filteredPurchases.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0),
    [filteredPurchases]
  );

  const totalExpenses = directExpenses + purchaseCost;
  const netProfit = calculateNetProfit(totalRevenue, totalExpenses);

  const cupsPurchased = useMemo(
    () => filteredPurchases.reduce((acc, curr) => acc + (parseInt(curr.cups_purchased, 10) || 0), 0),
    [filteredPurchases]
  );

  const totalWastage = useMemo(
    () => filteredInventory.reduce((acc, curr) => acc + (parseInt(curr.wastage, 10) || 0), 0),
    [filteredInventory]
  );

  const latestStock = useMemo(() => {
    if (inventory.length === 0) return 0;
    // Get latest closing stock
    return inventory[0]?.closing_stock || 0;
  }, [inventory]);

  // Expense categories pie data
  const expensePieData = useMemo(() => {
    const map = {
      'Chai Cost': 0,
      'Cup Cost': 0,
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
    if (purchaseCost > 0) {
      map['Cup Cost'] += purchaseCost;
    }

    return Object.keys(map)
      .map((cat) => ({ name: cat, value: map[cat] }))
      .filter((item) => item.value > 0);
  }, [filteredExpenses, purchaseCost]);

  // Daily Chart Trends
  const trendChartData = useMemo(() => {
    const datesMap = {};
    filteredSales.forEach((s) => {
      const d = s.date;
      if (!datesMap[d]) datesMap[d] = { date: d, revenue: 0, cups: 0, expenses: 0, profit: 0 };
      datesMap[d].revenue += parseFloat(s.total_revenue) || 0;
      datesMap[d].cups += parseInt(s.cups_sold, 10) || 0;
    });

    filteredExpenses.forEach((e) => {
      const d = e.date;
      if (!datesMap[d]) datesMap[d] = { date: d, revenue: 0, cups: 0, expenses: 0, profit: 0 };
      datesMap[d].expenses += parseFloat(e.amount) || 0;
    });

    filteredPurchases.forEach((p) => {
      const d = p.date;
      if (!datesMap[d]) datesMap[d] = { date: d, revenue: 0, cups: 0, expenses: 0, profit: 0 };
      datesMap[d].expenses += parseFloat(p.total_amount) || 0;
    });

    const sorted = Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((row) => ({
      ...row,
      formattedDate: formatDate(row.date, { month: 'short', day: 'numeric' }),
      profit: row.revenue - row.expenses,
    }));
  }, [filteredSales, filteredExpenses, filteredPurchases]);

  // Location performance metrics
  const locationPerformance = useMemo(() => {
    return locations.map((loc) => {
      const locSales = filteredSales.filter((s) => s.location_id === loc.id);
      const locExp = filteredExpenses.filter((e) => e.location_id === loc.id);
      const locPur = filteredPurchases.filter((p) => p.location_id === loc.id);

      const rev = locSales.reduce((sum, s) => sum + (parseFloat(s.total_revenue) || 0), 0);
      const cups = locSales.reduce((sum, s) => sum + (parseInt(s.cups_sold, 10) || 0), 0);
      const exp =
        locExp.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) +
        locPur.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
      const profit = rev - exp;

      return {
        id: loc.id,
        name: loc.name,
        cups,
        revenue: rev,
        expenses: exp,
        profit,
      };
    });
  }, [locations, filteredSales, filteredExpenses, filteredPurchases]);

  if (loading) {
    return <LoadingSpinner label="Loading business dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#230E03]">Business Performance Overview</h2>
          <p className="text-xs text-[#7C7467]">
            Live financial and operational telemetry across echaii locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Sales"
          value={`${formatNumber(filteredSales.length)} txns`}
          subtitle={`${formatNumber(totalCupsSold)} cups sold`}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Gross chai sales"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle="Supplies & operational"
          icon={Receipt}
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(netProfit)}
          subtitle={totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}% margin` : '0.0% margin'}
          icon={TrendingUp}
        />
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-chai-700">
          <div className="text-xs text-[#7C7467] font-medium">Total Stock</div>
          <div className="text-xl font-bold text-[#230E03] mt-1">
            {formatNumber(latestStock)} <span className="text-xs font-normal text-[#7C7467]">cups</span>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-600">
          <div className="text-xs text-[#7C7467] font-medium">Purchased Cups</div>
          <div className="text-xl font-bold text-[#230E03] mt-1">
            {formatNumber(cupsPurchased)} <span className="text-xs font-normal text-[#7C7467]">cups</span>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs text-[#7C7467] font-medium">Cups Sold</div>
          <div className="text-xl font-bold text-[#230E03] mt-1">
            {formatNumber(totalCupsSold)} <span className="text-xs font-normal text-[#7C7467]">cups</span>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-[#7C7467] font-medium">Wastage</div>
          <div className="text-xl font-bold text-[#230E03] mt-1">
            {formatNumber(totalWastage)} <span className="text-xs font-normal text-[#7C7467]">cups</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue Trend Chart */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#230E03]">Revenue Overview</h3>
              <p className="text-xs text-[#7C7467]">Revenue trend over the selected period</p>
            </div>
            <span className="text-xs font-semibold text-chai-800 bg-chai-50 px-2.5 py-1 rounded-lg">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <div className="h-64 w-full">
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7B3F11" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7B3F11" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE8DE" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#7C7467' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#7C7467' }} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E8E2D8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7B3F11"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#A8A193]">
                No sales data recorded for this timeframe
              </div>
            )}
          </div>
        </div>

        {/* 2. Sales Overview (Cups Sold) */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#230E03]">Sales Volume</h3>
              <p className="text-xs text-[#7C7467]">Total cups dispensed over time</p>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
              {formatNumber(totalCupsSold)} Cups
            </span>
          </div>
          <div className="h-64 w-full">
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE8DE" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#7C7467' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#7C7467' }} />
                  <Tooltip
                    formatter={(val) => [`${formatNumber(val)} cups`, 'Volume']}
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E8E2D8' }}
                  />
                  <Bar dataKey="cups" fill="#B87333" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#A8A193]">
                No volume recorded for this timeframe
              </div>
            )}
          </div>
        </div>

        {/* 3. Expense Breakdown */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#230E03]">Expense Breakdown</h3>
              <p className="text-xs text-[#7C7467]">Operational & supply cost allocation</p>
            </div>
            <span className="text-xs font-semibold text-red-800 bg-red-50 px-2.5 py-1 rounded-lg">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expensePieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Cost']}
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E8E2D8' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-xs text-[#522A0D]">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#A8A193]">No expenses recorded for this timeframe</div>
            )}
          </div>
        </div>

        {/* 4. Profit Overview */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#230E03]">Profit vs Revenue vs Expenses</h3>
              <p className="text-xs text-[#7C7467]">Cashflow distribution</p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                netProfit >= 0 ? 'text-emerald-800 bg-emerald-50' : 'text-red-800 bg-red-50'
              }`}
            >
              {formatCurrency(netProfit)}
            </span>
          </div>
          <div className="h-64 w-full">
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE8DE" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#7C7467' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#7C7467' }} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val)]}
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E8E2D8' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#7B3F11" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#B87333" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#A8A193]">
                No transactions recorded for this timeframe
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Location Performance Table */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#230E03]">Location Performance</h3>
            <p className="text-xs text-[#7C7467]">Cups sold and net margins across all outlets/offices</p>
          </div>
          <Link
            to="/locations"
            className="text-xs font-semibold text-chai-800 hover:text-chai-900 flex items-center gap-1"
          >
            Manage Locations <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {locationPerformance.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#7C7467]">
            No locations created yet.{' '}
            <Link to="/locations" className="text-chai-800 font-semibold underline">
              Add your first location
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#EFE8DE] text-xs font-semibold text-[#7C7467] uppercase tracking-wider">
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Cups Sold</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Expenses</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {locationPerformance.map((loc) => (
                  <tr key={loc.id} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-4 font-medium text-[#230E03]">{loc.name}</td>
                    <td className="py-3 px-4 text-right">{formatNumber(loc.cups)}</td>
                    <td className="py-3 px-4 text-right font-medium text-[#230E03]">
                      {formatCurrency(loc.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-700">
                      {formatCurrency(loc.expenses)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        loc.profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(loc.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity: Sales, Purchases, Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F3EFEA]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C7467]">Recent Sales</h3>
            <Link to="/pos" className="text-xs text-chai-800 hover:underline font-medium">
              View POS
            </Link>
          </div>
          <div className="space-y-2">
            {sales.slice(0, 4).length > 0 ? (
              sales.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E8E2D8] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#230E03]">{s.location_name}</div>
                    <div className="text-[11px] text-[#7C7467]">
                      {formatDate(s.date)} • {s.cups_sold} cups
                    </div>
                  </div>
                  <div className="font-bold text-emerald-700">{formatCurrency(s.total_revenue)}</div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#A8A193]">No recent sales recorded</div>
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F3EFEA]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C7467]">Recent Purchases</h3>
            <Link to="/purchases" className="text-xs text-chai-800 hover:underline font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {purchases.slice(0, 4).length > 0 ? (
              purchases.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E8E2D8] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#230E03]">{p.vendor_name}</div>
                    <div className="text-[11px] text-[#7C7467]">
                      {formatDate(p.date)} • {p.cups_purchased} cups
                    </div>
                  </div>
                  <div className="font-bold text-[#522A0D]">{formatCurrency(p.total_amount)}</div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#A8A193]">No recent purchases</div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F3EFEA]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C7467]">Recent Expenses</h3>
            <Link to="/expenses" className="text-xs text-chai-800 hover:underline font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 4).length > 0 ? (
              expenses.slice(0, 4).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E8E2D8] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#230E03]">{e.category}</div>
                    <div className="text-[11px] text-[#7C7467] truncate max-w-[140px]">
                      {e.description || formatDate(e.date)}
                    </div>
                  </div>
                  <div className="font-bold text-red-600">{formatCurrency(e.amount)}</div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#A8A193]">No recent expenses</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
