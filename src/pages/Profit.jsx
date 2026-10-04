import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Percent,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';
import { purchasesService } from '../services/purchasesService';
import { locationsService } from '../services/locationsService';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { calculateNetProfit, calculateProfitMargin } from '../utils/calculations';
import { StatsCard } from '../components/StatsCard';
import { DateFilter } from '../components/DateFilter';
import { LocationFilter } from '../components/LocationFilter';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getDateRange, isWithinDateRange } from '../utils/dateUtils';

export const Profit = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filters
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, expData, purData, locData] = await Promise.all([
        salesService.getSales(),
        expensesService.getExpenses(),
        purchasesService.getPurchases(),
        locationsService.getLocations(),
      ]);
      setSales(salesData);
      setExpenses(expData);
      setPurchases(purData);
      setLocations(locData);
    } catch (err) {
      console.error('Failed to load profit analytics:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Aggregate Numbers
  const totalRevenue = useMemo(
    () => filteredSales.reduce((acc, curr) => acc + (parseFloat(curr.total_revenue) || 0), 0),
    [filteredSales]
  );

  const directExpenses = useMemo(
    () => filteredExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
    [filteredExpenses]
  );

  const purchaseSpend = useMemo(
    () => filteredPurchases.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0),
    [filteredPurchases]
  );

  const totalExpenses = directExpenses + purchaseSpend;
  const netProfit = calculateNetProfit(totalRevenue, totalExpenses);
  const profitMargin = calculateProfitMargin(netProfit, totalRevenue);

  // Time Chart
  const chartData = useMemo(() => {
    const datesMap = {};
    filteredSales.forEach((s) => {
      const d = s.date;
      if (!datesMap[d]) datesMap[d] = { date: d, revenue: 0, expenses: 0 };
      datesMap[d].revenue += parseFloat(s.total_revenue) || 0;
    });

    filteredExpenses.forEach((e) => {
      const d = e.date;
      if (!datesMap[d]) datesMap[d] = { date: d, revenue: 0, expenses: 0 };
      datesMap[d].expenses += parseFloat(e.amount) || 0;
    });

    filteredPurchases.forEach((p) => {
      const d = p.date;
      if (!datesMap[d]) datesMap[d] = { date: d, revenue: 0, expenses: 0 };
      datesMap[d].expenses += parseFloat(p.total_amount) || 0;
    });

    const sorted = Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((row) => {
      const p = row.revenue - row.expenses;
      return {
        ...row,
        formattedDate: formatDate(row.date, { month: 'short', day: 'numeric' }),
        profit: p,
      };
    });
  }, [filteredSales, filteredExpenses, filteredPurchases]);

  // Location-wise profit breakdown
  const locationBreakdown = useMemo(() => {
    return locations.map((loc) => {
      const locSales = filteredSales.filter((s) => s.location_id === loc.id);
      const locExp = filteredExpenses.filter((e) => e.location_id === loc.id);
      const locPur = filteredPurchases.filter((p) => p.location_id === loc.id);

      const rev = locSales.reduce((sum, s) => sum + (parseFloat(s.total_revenue) || 0), 0);
      const exp =
        locExp.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) +
        locPur.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
      const profit = rev - exp;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;

      return {
        id: loc.id,
        name: loc.name,
        revenue: rev,
        expenses: exp,
        profit,
        margin,
      };
    });
  }, [locations, filteredSales, filteredExpenses, filteredPurchases]);

  if (loading) {
    return <LoadingSpinner label="Calculating financial margins..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#230E03]">Net Profit & Margin Analysis</h2>
          <p className="text-xs text-[#7C7467]">
            Dynamic computation derived directly from sales revenue and real operating expenditures.
          </p>
        </div>

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

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Gross Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle={`${filteredSales.length} recorded sales`}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Expenditure"
          value={formatCurrency(totalExpenses)}
          subtitle="Supplies & operating costs"
          icon={Receipt}
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(netProfit)}
          subtitle={netProfit >= 0 ? 'Surplus income' : 'Operational deficit'}
          icon={netProfit >= 0 ? TrendingUp : TrendingDown}
        />
        <StatsCard
          title="Net Profit Margin"
          value={`${profitMargin.toFixed(1)}%`}
          subtitle="Net return on revenue"
          icon={Percent}
        />
      </div>

      {/* Business Logic Formula Callout */}
      <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#522A0D]">
          <ShieldCheck className="w-4 h-4 text-chai-700 flex-shrink-0" />
          <span className="font-semibold">Automated Business Formulas:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[#7C7467]">
          <span>
            <strong className="text-[#230E03]">Net Profit:</strong> Revenue ({formatCurrency(totalRevenue)}) - Expenses ({formatCurrency(totalExpenses)}) = <strong className={netProfit >= 0 ? 'text-emerald-800' : 'text-red-600'}>{formatCurrency(netProfit)}</strong>
          </span>
          <span>
            <strong className="text-[#230E03]">Profit Margin:</strong> ({formatCurrency(netProfit)} / {formatCurrency(totalRevenue)}) × 100 = <strong>{profitMargin.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* Profit vs Revenue vs Expenses Chart */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#230E03]">Cashflow & Margin Timeline</h3>
            <p className="text-xs text-[#7C7467]">Comparative comparison across date ranges</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-chai-100 text-chai-900">
            {chartData.length} timeline points
          </span>
        </div>

        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />
                <Bar dataKey="revenue" name="Total Revenue" fill="#7B3F11" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Total Expenses" fill="#C9A887" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#A8A193]">
              No sales or expense transactions recorded in this period
            </div>
          )}
        </div>
      </div>

      {/* Location-wise Profit Table */}
      <div className="card p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#230E03]">Location-wise Profit & Margin Breakdown</h3>
          <p className="text-xs text-[#7C7467]">Detailed profitability per outlet and client point</p>
        </div>

        {locationBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A8A193]">
            No locations configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#EFE8DE] text-xs font-semibold text-[#7C7467] uppercase tracking-wider">
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Expenses</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-right">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {locationBreakdown.map((loc) => (
                  <tr key={loc.id} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-4 font-semibold text-[#230E03]">{loc.name}</td>
                    <td className="py-3 px-4 text-right font-medium text-[#230E03]">
                      {formatCurrency(loc.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatCurrency(loc.expenses)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        loc.profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(loc.profit)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          loc.margin >= 0
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        {loc.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
