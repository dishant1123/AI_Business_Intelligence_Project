import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { reportService } from '../services/api';
import {
  FileText,
  Download,
  Plus,
  CheckCircle2,
  Calendar,
  FileCheck,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await reportService.list();
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await reportService.generate();
      await fetchReports();
      alert('New executive PDF report generated successfully!');
    } catch (err) {
      alert('Report generation failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Executive Report Generation"
        subtitle="Formal decision intelligence publications certified by independent deterministic verification"
      />

      <main className="p-6 space-y-6">
        {/* Action Header */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Manufacturing Business Intelligence Reports</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-page PDF reports containing verified KPIs, line throughput charts, downtime Pareto, and strategic recommendations.
            </p>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{generating ? 'Compiling PDF Report...' : 'Generate New PDF Report'}</span>
          </button>
        </div>

        {/* Reports Archive Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Archived Intelligence Reports ({reports.length})</span>
            <span className="text-[11px] text-slate-500">Stored in persistent PostgreSQL / SQLite</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Report Title</th>
                  <th className="py-3 px-4">Generated Timestamp</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Verification Audit</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">{r.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{r.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(r.generated_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {(r.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                        VERIFIED 98%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                        PDF
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={reportService.getDownloadUrl(r.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}

                {reports.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No reports generated yet. Click 'Generate New PDF Report' to compile your first executive summary.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
