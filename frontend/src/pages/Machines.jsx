import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { machineService, mlService } from '../services/api';
import {
  Cpu,
  Clock,
  AlertOctagon,
  Wrench,
  DollarSign,
  Activity,
  ShieldAlert
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

const Machines = () => {
  const [summary, setSummary] = useState(null);
  const [downtime, setDowntime] = useState({ by_reason: [], by_severity: [], by_machine: [], monthly_trend: [] });
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, dtRes, anomRes] = await Promise.all([
          machineService.getSummary(),
          machineService.getDowntime(),
          mlService.getAnomalies(),
        ]);
        setSummary(sumRes.data);
        setDowntime(dtRes.data);
        setAnomalies(anomRes.data);
      } catch (err) {
        console.error('Error fetching machine data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Machine & Maintenance Intelligence"
        subtitle="Asset uptime diagnostics, root cause Pareto, maintenance expenditures, and Isolation Forest anomaly radar"
      />

      <main className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Downtime</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{summary?.total_downtime_hours?.toLocaleString()} hrs</h3>
            <p className="text-[11px] text-slate-500 mt-1">{summary?.total_downtime_minutes?.toLocaleString()} Total Minutes</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Availability Rate</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">{summary?.machine_availability_pct}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">Operating Standard Met</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Stoppage Incidents</span>
            <h3 className="text-xl font-bold text-blue-600 mt-1">{summary?.downtime_frequency} events</h3>
            <p className="text-[11px] text-slate-500 mt-1">Across 45 Machine Assets</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Maintenance Cost</span>
            <h3 className="text-xl font-bold text-purple-600 mt-1">₹{(summary?.total_maintenance_cost / 1000000)?.toFixed(2)}M</h3>
            <p className="text-[11px] text-slate-500 mt-1">Direct Emergency Repair</p>
          </div>
        </div>

        {/* Charts: Downtime by Root Cause & Top Failing Machines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Downtime Minutes by Root Cause</h4>
            <p className="text-xs text-slate-500 mb-4">Mechanical, Electrical, Changeover, Material Shortage, PM</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={downtime.by_reason} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="reason" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="downtime_minutes" fill="#2563eb" name="Minutes Lost" radius={[4, 4, 0, 0]}>
                    {downtime.by_reason.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Top 10 Machines with Highest Downtime</h4>
            <p className="text-xs text-slate-500 mb-4">Target assets for condition-based monitoring</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={downtime.by_machine} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="machine_id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="downtime_minutes" fill="#e11d48" name="Downtime (Min)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Isolation Forest Anomaly Radar Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-bold text-slate-900">Machine Downtime Anomaly Radar (Isolation Forest)</h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Isolated {anomalies?.total_anomalies_detected} abnormal stoppage events exceeding duration and expenditure confidence intervals
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded bg-red-100 text-red-700 border border-red-200">
              5% Contamination Factor
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Incident ID</th>
                  <th className="py-2.5 px-3 font-semibold">Machine</th>
                  <th className="py-2.5 px-3 font-semibold">Line</th>
                  <th className="py-2.5 px-3 font-semibold">Root Cause</th>
                  <th className="py-2.5 px-3 font-semibold">Duration (Min)</th>
                  <th className="py-2.5 px-3 font-semibold">Repair Cost (INR)</th>
                  <th className="py-2.5 px-3 font-semibold">Severity</th>
                  <th className="py-2.5 px-3 font-semibold">Anomaly Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalies?.top_anomalies?.slice(0, 7).map((anom) => (
                  <tr key={anom.downtime_id} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-900">{anom.downtime_id}</td>
                    <td className="py-2 px-3 text-blue-600 font-medium">{anom.machine_id}</td>
                    <td className="py-2 px-3 text-slate-700">{anom.production_line}</td>
                    <td className="py-2 px-3 text-slate-700">{anom.reason}</td>
                    <td className="py-2 px-3 font-bold text-rose-600">{anom.downtime_minutes} min</td>
                    <td className="py-2 px-3 font-bold text-purple-700">₹{anom.maintenance_cost?.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700">
                        {anom.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{anom.anomaly_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Machines;
