import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { productionService, mlService } from '../services/api';
import {
  Factory,
  Zap,
  TrendingUp,
  Cpu,
  Sparkles,
  ArrowRight
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
  Legend
} from 'recharts';

const Production = () => {
  const [summary, setSummary] = useState(null);
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  // ML Prediction interactive state
  const [predProduct, setPredProduct] = useState('FG0001');
  const [predLine, setPredLine] = useState('LINE01');
  const [predShift, setPredShift] = useState('A');
  const [predQty, setPredQty] = useState(1000);
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, linesRes, shiftsRes, trendsRes] = await Promise.all([
          productionService.getSummary(),
          productionService.getLines(),
          productionService.getShifts(),
          productionService.getTrends(),
        ]);
        setSummary(sumRes.data);
        setLines(linesRes.data);
        setShifts(shiftsRes.data);
        setTrends(trendsRes.data);
      } catch (err) {
        console.error('Error fetching production data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setMlLoading(true);
    try {
      const res = await mlService.predictProduction({
        product_id: predProduct,
        production_line: predLine,
        shift: predShift,
        planned_quantity: parseInt(predQty, 10),
      });
      setMlResult(res.data);
    } catch (err) {
      console.error('Prediction failed', err);
    } finally {
      setMlLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Production Intelligence"
        subtitle="Batch capacity analytics, line throughput, shift variances, and ML output forecasting"
      />

      <main className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Planned</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{summary?.total_planned_production?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-1">1,600 Scheduled Batches</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Produced</span>
            <h3 className="text-xl font-bold text-blue-600 mt-1">{summary?.total_produced_units?.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">{summary?.production_achievement_pct}% Achievement</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Yield Rate</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">{summary?.production_yield_pct}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">{summary?.total_rejected_units?.toLocaleString()} Rejected</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Production Gap</span>
            <h3 className="text-xl font-bold text-amber-600 mt-1">{summary?.production_gap?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Daily Avg: {summary?.average_daily_production} units/day</p>
          </div>
        </div>

        {/* Charts: Line Comparison & Shift Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Production Achievement by Line</h4>
            <p className="text-xs text-slate-500 mb-4">Planned vs Produced Units across LINE01 - LINE12</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lines} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="production_line" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="planned" fill="#cbd5e1" name="Planned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="produced" fill="#2563eb" name="Produced" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Shift Variance Performance</h4>
            <p className="text-xs text-slate-500 mb-4">Shifts A (Day), B (Evening), C (Night)</p>
            <div className="space-y-4">
              {shifts.map((s) => (
                <div key={s.shift} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Shift {s.shift}</span>
                    <span className="text-blue-600">{s.achievement_pct}% Achv</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(s.achievement_pct, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                    <span>Produced: {s.produced?.toLocaleString()}</span>
                    <span>Yield: {s.yield_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Machine Learning Production Output Simulator */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h4 className="text-base font-bold text-slate-900">Predictive Production Output Simulator (Random Forest Regressor)</h4>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Trained on 1,600 batches (R² = 0.9348, MAE = 85.27 units). Enter planned run parameters to forecast real-world produced output.
          </p>

          <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product ID</label>
              <input
                type="text"
                value={predProduct}
                onChange={(e) => setPredProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. FG0001"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Production Line</label>
              <select
                value={predLine}
                onChange={(e) => setPredLine(e.target.value)}
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
                value={predShift}
                onChange={(e) => setPredShift(e.target.value)}
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
                min="50"
                max="2000"
                value={predQty}
                onChange={(e) => setPredQty(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={mlLoading}
                className="w-full py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {mlLoading ? 'Simulating...' : 'Predict Output'}
              </button>
            </div>
          </form>

          {mlResult && (
            <div className="mt-5 p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-900">ML Forecast for {mlResult.product_id} on {mlResult.production_line}</p>
                <p className="text-[11px] text-blue-700 mt-0.5">Random Forest regression incorporating line historical cycle time & shift variance</p>
              </div>
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600">Predicted Output</span>
                  <p className="text-xl font-extrabold text-blue-950">{mlResult.predicted_produced_quantity} units</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600">Expected Achievement</span>
                  <p className="text-xl font-extrabold text-emerald-600">{mlResult.predicted_achievement_pct}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Production;
