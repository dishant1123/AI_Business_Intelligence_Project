import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { financeService } from '../services/api';
import {
  IndianRupee,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['#2563eb', '#0284c7', '#0d9488', '#e11d48', '#d97706', '#64748b'];

const Finance = () => {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState({
    by_cost_center: [],
    by_category: [],
    monthly_trend: [],
    top_margin_products: [],
    low_margin_products: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, anaRes] = await Promise.all([
          financeService.getSummary(),
          financeService.getAnalytics(),
        ]);
        setSummary(sumRes.data);
        setAnalytics(anaRes.data);
      } catch (err) {
        console.error('Error fetching financial data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Financial Intelligence"
        subtitle="Manufacturing operating expenditure, cost center allocations, standard costs, and finished goods profitability"
      />

      <main className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Manufacturing OPEX</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">₹{(summary?.total_manufacturing_expenses / 1000000)?.toFixed(2)}M</h3>
            <p className="text-[11px] text-slate-500 mt-1">600 Verified Invoices</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Direct Material Cost</span>
            <h3 className="text-xl font-bold text-blue-600 mt-1">₹{(summary?.total_material_cost / 10000000)?.toFixed(2)} Cr</h3>
            <p className="text-[11px] text-slate-500 mt-1">Consumed in 1,600 Batches</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Portfolio Margin</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">{summary?.avg_gross_margin_pct}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">Weighted Catalog Average</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Negative Margin SKUs</span>
            <h3 className="text-xl font-bold text-rose-600 mt-1">89 Products</h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Selling Price &lt; Standard Cost</p>
          </div>
        </div>

        {/* Charts: Cost Center & Expense Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Expenses by Cost Center</h4>
            <p className="text-xs text-slate-500 mb-4">Quality, Utilities, Logistics, Maintenance, Admin, Production</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.by_cost_center} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="cost_center" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total_amount" fill="#2563eb" name="Total Expenditure (INR)" radius={[4, 4, 0, 0]}>
                    {analytics.by_cost_center.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Expense Categories Distribution</h4>
            <p className="text-xs text-slate-500 mb-4">Overhead, Energy, Repair, Freight, Consumables, Labor</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.by_category}
                    dataKey="total_amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {analytics.by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Finished Goods Profitability Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Margin Products */}
          <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Top High-Margin Finished Goods SKUs</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50 text-emerald-900 border-y border-emerald-200">
                  <tr>
                    <th className="py-2 px-3">Product ID</th>
                    <th className="py-2 px-3">Standard Cost</th>
                    <th className="py-2 px-3">Selling Price</th>
                    <th className="py-2 px-3 font-semibold">Gross Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {analytics.top_margin_products.slice(0, 5).map((p) => (
                    <tr key={p.product_id}>
                      <td className="py-2 px-3 font-bold text-slate-900">{p.product_id}</td>
                      <td className="py-2 px-3 text-slate-600">₹{p.standard_unit_cost.toLocaleString()}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">₹{p.selling_price.toLocaleString()}</td>
                      <td className="py-2 px-3 font-extrabold text-emerald-600">+{p.gross_margin_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Loss-Making Products */}
          <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h4 className="text-sm font-bold text-slate-900">Negative Margin SKUs (Requires Pricing/BOM Review)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-50 text-rose-900 border-y border-rose-200">
                  <tr>
                    <th className="py-2 px-3">Product ID</th>
                    <th className="py-2 px-3">Standard Cost</th>
                    <th className="py-2 px-3">Selling Price</th>
                    <th className="py-2 px-3 font-semibold">Gross Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {analytics.low_margin_products.slice(0, 5).map((p) => (
                    <tr key={p.product_id}>
                      <td className="py-2 px-3 font-bold text-slate-900">{p.product_id}</td>
                      <td className="py-2 px-3 text-slate-600">₹{p.standard_unit_cost.toLocaleString()}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">₹{p.selling_price.toLocaleString()}</td>
                      <td className="py-2 px-3 font-extrabold text-rose-600">{p.gross_margin_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Finance;
