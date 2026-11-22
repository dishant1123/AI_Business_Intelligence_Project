import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { dashboardService } from '../services/api';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Trash2,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle,
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#2563eb', '#0284c7', '#0d9488', '#e11d48', '#d97706', '#64748b'];

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState({ production_trends: [], quality_trends: [] });
  const [productionData, setProductionData] = useState({ lines: [], shifts: [] });
  const [qualityData, setQualityData] = useState({ defect_distribution: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [lineFilter, setLineFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (lineFilter) params.production_line = lineFilter;
      if (shiftFilter) params.shift = shiftFilter;

      const [kpiRes, trendRes, prodRes, qualRes] = await Promise.all([
        dashboardService.getKPIs(params),
        dashboardService.getTrends(params),
        dashboardService.getProduction(),
        dashboardService.getQuality(),
      ]);

      setKpis(kpiRes.data);
      setTrends(trendRes.data);
      setProductionData(prodRes.data);
      setQualityData(qualRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lineFilter, shiftFilter]);

  if (loading && !kpis) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading Manufacturing Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Executive Performance Dashboard"
        subtitle="Real-time multi-dimensional manufacturing operations and quality intelligence"
      />

      <main className="p-6 space-y-6">
        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Operational Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div>
              <select
                value={lineFilter}
                onChange={(e) => setLineFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Production Lines (12)</option>
                {Array.from({ length: 12 }, (_, i) => `LINE${String(i + 1).padStart(2, '0')}`).map((line) => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Shifts (A, B, C)</option>
                <option value="A">Shift A (Morning)</option>
                <option value="B">Shift B (Evening)</option>
                <option value="C">Shift C (Night)</option>
              </select>
            </div>

            {(lineFilter || shiftFilter) && (
              <button
                onClick={() => { setLineFilter(''); setShiftFilter(''); }}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 underline text-xs"
              >
                Reset Filters
              </button>
            )}

            <button
              onClick={fetchData}
              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 8 Primary Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Production */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Output</span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{kpis?.total_produced_units.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Planned: <span className="font-medium text-slate-700">{kpis?.total_planned_production.toLocaleString()}</span> units
              </p>
            </div>
          </div>

          {/* Card 2: Production Achievement */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Achievement Rate</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{kpis?.production_achievement_pct}%</h3>
              <p className="text-xs text-slate-500 mt-1">
                Yield: <span className="font-semibold text-emerald-600">{kpis?.production_yield_pct}%</span>
              </p>
            </div>
          </div>

          {/* Card 3: Quality Defect Rate */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Defect Rate</span>
              <span className="p-2 rounded-lg bg-rose-50 text-rose-600"><AlertTriangle className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{kpis?.defect_rate_pct}%</h3>
              <p className="text-xs text-slate-500 mt-1">
                Defective: <span className="font-medium text-slate-700">{kpis?.total_defective_units.toLocaleString()}</span> / {kpis?.total_inspected_units.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Card 4: Machine Downtime */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipment Downtime</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600"><Clock className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{kpis?.total_downtime_hours.toLocaleString()} hrs</h3>
              <p className="text-xs text-slate-500 mt-1">
                Availability: <span className="font-medium text-slate-700">{kpis?.machine_availability_pct}%</span> ({kpis?.downtime_frequency} incidents)
              </p>
            </div>
          </div>

          {/* Card 5: Material Wastage */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Wastage</span>
              <span className="p-2 rounded-lg bg-orange-50 text-orange-600"><Trash2 className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{kpis?.material_wastage_pct}%</h3>
              <p className="text-xs text-slate-500 mt-1">
                Scrap: <span className="font-medium text-slate-700">{kpis?.total_wastage_quantity.toLocaleString()}</span> kg/units
              </p>
            </div>
          </div>

          {/* Card 6: Low Stock Alerts */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Alerts</span>
              <span className="p-2 rounded-lg bg-red-50 text-red-600"><AlertTriangle className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{kpis?.low_stock_materials_count} items</h3>
              <p className="text-xs text-slate-500 mt-1">
                Stock: <span className="font-medium text-slate-700">{kpis?.total_stock_quantity.toLocaleString()}</span> units
              </p>
            </div>
          </div>

          {/* Card 7: Manufacturing OPEX */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
              <span className="p-2 rounded-lg bg-purple-50 text-purple-600"><DollarSign className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">₹{(kpis?.total_manufacturing_expenses / 1000000).toFixed(2)}M</h3>
              <p className="text-xs text-slate-500 mt-1">
                Direct Materials: <span className="font-medium text-slate-700">₹{(kpis?.total_material_cost / 10000000).toFixed(1)}Cr</span>
              </p>
            </div>
          </div>

          {/* Card 8: Portfolio Margin */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portfolio Gross Margin</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><PieIcon className="w-4 h-4" /></span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{kpis?.avg_gross_margin_pct}%</h3>
              <p className="text-xs text-slate-500 mt-1">
                Standard vs Selling Catalog
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Monthly Production Trend & Defect Types */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Output & Achievement */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Monthly Planned vs Actual Output</h4>
                <p className="text-xs text-slate-500">6-Month Production Achievement Trend (May - Oct 2026)</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends.production_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[80, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="planned" fill="#cbd5e1" name="Planned (Units)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="produced" fill="#2563eb" name="Produced (Units)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="achievement_pct" stroke="#10b981" strokeWidth={2.5} name="Achievement %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defect Categories Pareto */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900">Defect Type Breakdown</h4>
              <p className="text-xs text-slate-500">Distribution across 5 defect classifications</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityData.defect_distribution}
                    dataKey="defective_units"
                    nameKey="defect_type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {qualityData.defect_distribution.map((entry, index) => (
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

        {/* Charts Row 2: Production Lines Throughput */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900">Production Throughput by Line (LINE01 - LINE12)</h4>
            <p className="text-xs text-slate-500">Comparative batch volume output vs units rejected</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData.lines} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="production_line" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="produced" fill="#2563eb" name="Produced Units" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected Units" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
