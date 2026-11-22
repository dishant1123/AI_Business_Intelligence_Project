import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { inventoryService } from '../services/api';
import {
  Package,
  AlertTriangle,
  Trash2,
  DollarSign,
  Truck,
  Layers,
  ShieldCheck
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

const COLORS = ['#2563eb', '#0284c7', '#0d9488', '#e11d48', '#d97706'];

const Inventory = () => {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState({ by_category: [], reorder_alerts: [], top_wastage_materials: [], supplier_summary: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, anaRes] = await Promise.all([
          inventoryService.getSummary(),
          inventoryService.getAnalytics(),
        ]);
        setSummary(sumRes.data);
        setAnalytics(anaRes.data);
      } catch (err) {
        console.error('Error fetching inventory data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Inventory & Material Intelligence"
        subtitle="Raw material warehouse tracking, critical stockout alerts, scrap analytics, and supplier dependencies"
      />

      <main className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Units</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{summary?.total_stock_quantity?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-1">250 Material Master SKUs</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Inventory Valuation</span>
            <h3 className="text-xl font-bold text-blue-600 mt-1">₹{(summary?.total_inventory_value / 10000000)?.toFixed(2)} Cr</h3>
            <p className="text-[11px] text-slate-500 mt-1">Total Warehouse Value</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Reorder Alerts</span>
            <h3 className="text-xl font-bold text-rose-600 mt-1">{summary?.low_stock_materials_count} Materials</h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Stock ≤ Safety Reorder Level</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Material Wastage</span>
            <h3 className="text-xl font-bold text-amber-600 mt-1">{summary?.material_wastage_pct}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">{summary?.total_wastage_quantity?.toLocaleString()} kg/units scrap</p>
          </div>
        </div>

        {/* Reorder Alerts Table */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h4 className="text-sm font-bold text-slate-900">Critical Stockout Alerts (Requires Immediate Purchase Requisition)</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Materials with stock quantities falling below defined reorder safety thresholds. Linked to 237 line stoppage events.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50 text-rose-900 border-y border-rose-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Material Code</th>
                  <th className="py-2.5 px-3 font-semibold">Material Name</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Current Stock</th>
                  <th className="py-2.5 px-3 font-semibold">Reorder Threshold</th>
                  <th className="py-2.5 px-3 font-semibold">Unit Cost (INR)</th>
                  <th className="py-2.5 px-3 font-semibold">Supplier Code</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {analytics.reorder_alerts.map((item) => (
                  <tr key={item.material_id} className="hover:bg-rose-50/40">
                    <td className="py-2 px-3 font-bold text-slate-900">{item.material_id}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{item.material_name}</td>
                    <td className="py-2 px-3 text-slate-600">{item.material_category}</td>
                    <td className="py-2 px-3 font-bold text-rose-600">{item.stock_quantity.toLocaleString()}</td>
                    <td className="py-2 px-3 font-semibold text-slate-700">{item.reorder_level.toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-700">₹{item.unit_cost.toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-blue-600">{item.supplier_id}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 border border-rose-200">
                        CRITICAL REORDER
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts: Valuation by Category & Top Scrap Materials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Inventory Valuation by Material Category</h4>
            <p className="text-xs text-slate-500 mb-4">Metal, Packaging, Plastic, Electronic, Chemical</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.by_category} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="material_category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total_value" fill="#2563eb" name="Valuation (INR)" radius={[4, 4, 0, 0]}>
                    {analytics.by_category.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Top Materials by Wastage Cost</h4>
            <p className="text-xs text-slate-500 mb-4">Scrap quantity multiplied by material unit cost</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.top_wastage_materials.slice(0, 7)} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="material_id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="wastage_cost" fill="#d97706" name="Wastage Cost (INR)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inventory;
