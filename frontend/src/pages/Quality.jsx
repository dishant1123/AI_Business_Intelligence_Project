import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { qualityService, mlService } from '../services/api';
import {
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

const COLORS = ['#2563eb', '#0284c7', '#0d9488', '#e11d48', '#d97706'];

const Quality = () => {
  const [summary, setSummary] = useState(null);
  const [defects, setDefects] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  // ML Quality Risk state
  const [qProduct, setQProduct] = useState('FG0001');
  const [qLine, setQLine] = useState('LINE01');
  const [qShift, setQShift] = useState('A');
  const [qQty, setQQty] = useState(1000);
  const [qResult, setQResult] = useState(null);
  const [qLoading, setQLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, defRes, trendRes] = await Promise.all([
          qualityService.getSummary(),
          qualityService.getDefects(),
          qualityService.getTrends(),
        ]);
        setSummary(sumRes.data);
        setDefects(defRes.data);
        setTrends(trendRes.data);
      } catch (err) {
        console.error('Error fetching quality data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePredictQuality = async (e) => {
    e.preventDefault();
    setQLoading(true);
    try {
      const res = await mlService.predictQuality({
        product_id: qProduct,
        production_line: qLine,
        shift: qShift,
        planned_quantity: parseInt(qQty, 10),
      });
      setQResult(res.data);
    } catch (err) {
      console.error('Quality risk prediction failed', err);
    } finally {
      setQLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Quality Intelligence"
        subtitle="Inspection diagnostics, defect Pareto analysis, rework metrics, and ML defect risk classification"
      />

      <main className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Inspected Units</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{summary?.total_inspected_units?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-1">2,000 Inspection Evaluations</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Defect Rate</span>
            <h3 className="text-xl font-bold text-rose-600 mt-1">{summary?.defect_rate_pct}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">{summary?.total_defective_units?.toLocaleString()} Units Rejected</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">First-Pass Rate</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">{summary?.quality_pass_rate_pct}%</h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Acceptable Direct Quality</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rework Rate</span>
            <h3 className="text-xl font-bold text-amber-600 mt-1">{summary?.rework_rate_pct}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">Secondary Rework Required</p>
          </div>
        </div>

        {/* Charts: Defect Pareto & Monthly Quality Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Defect Category Pareto Distribution</h4>
            <p className="text-xs text-slate-500 mb-4">Volume of defective units isolated by category</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defects} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="defect_type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="defective_units" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    {defects.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Monthly Quality Pass vs Defect Rate</h4>
            <p className="text-xs text-slate-500 mb-4">6-Month Trend across 315,848 inspected units</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[85, 95]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pass_rate_pct" stroke="#10b981" strokeWidth={2} name="Pass Rate %" />
                  <Line type="monotone" dataKey="defect_rate_pct" stroke="#ef4444" strokeWidth={2} name="Defect Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Machine Learning Defect Risk Classifier */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h4 className="text-base font-bold text-slate-900">Pre-Inspection Quality Risk Classifier (Random Forest)</h4>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Strictly excludes post-inspection results to prevent target leakage. Evaluates batch parameters to predict defect risk tier before production begins.
          </p>

          <form onSubmit={handlePredictQuality} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product ID</label>
              <input
                type="text"
                value={qProduct}
                onChange={(e) => setQProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Production Line</label>
              <select
                value={qLine}
                onChange={(e) => setQLine(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => `LINE${String(i + 1).padStart(2, '0')}`).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift</label>
              <select
                value={qShift}
                onChange={(e) => setQShift(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Shift A (Morning)</option>
                <option value="B">Shift B (Evening)</option>
                <option value="C">Shift C (Night)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Quantity</label>
              <input
                type="number"
                value={qQty}
                onChange={(e) => setQQty(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={qLoading}
                className="w-full py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {qLoading ? 'Evaluating...' : 'Assess Quality Risk'}
              </button>
            </div>
          </form>

          {qResult && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${
                    qResult.predicted_defect_risk === 'High'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : qResult.predicted_defect_risk === 'Medium'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {qResult.predicted_defect_risk} Risk Profile
                  </span>
                  <span className="text-xs text-slate-500">Defect Probability: {(qResult.defect_probability * 100).toFixed(1)}%</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Expected Defective Volume: <b>{qResult.predicted_defective_units} units</b>
                </p>
              </div>

              {qResult.risk_factors && qResult.risk_factors.length > 0 && (
                <div className="text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-800">Identified Risk Factors:</span>
                  {qResult.risk_factors.map((rf, idx) => (
                    <p key={idx} className="text-rose-600 text-[11px]">• {rf}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quality;
