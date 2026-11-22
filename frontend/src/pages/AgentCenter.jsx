import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { agentService } from '../services/api';
import {
  Bot,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSearch,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Cpu,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';

const AGENT_DEFINITIONS = [
  {
    name: 'Data Analyst Agent',
    role: 'Senior Manufacturing Data Analyst',
    icon: TrendingUp,
    description: 'Calculates factory KPIs, analyzes batch throughput, and detects line & shift performance variances.',
  },
  {
    name: 'Marketing Agent',
    role: 'Manufacturing Product & Commercial Intelligence Analyst',
    icon: Package,
    description: 'Analyzes finished goods standard costs vs selling prices, isolates loss-leaders, and respects data boundaries.',
  },
  {
    name: 'Finance Agent',
    role: 'Senior Manufacturing Financial Analyst',
    icon: DollarSign,
    description: 'Analyzes operating expenses across 6 cost centers, maintenance financial burden, and direct material spending.',
  },
  {
    name: 'Operations Agent',
    role: 'Production & Maintenance Operations Specialist',
    icon: Cpu,
    description: 'Evaluates machine breakdown frequency, root causes, scrap wastage rates, and critical inventory reorders.',
  },
  {
    name: 'Strategy Agent',
    role: 'Senior Manufacturing Strategy Consultant',
    icon: Layers,
    description: 'Consolidates evidence from all agents into a prioritized 9-attribute business improvement roadmap.',
  },
  {
    name: 'Verification Agent',
    role: 'Independent Manufacturing Intelligence Auditor',
    icon: ShieldCheck,
    description: 'Cross-checks all numerical claims against database ground truth using deterministic Python verification.',
  },
];

const AgentCenter = () => {
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [triggering, setTriggering] = useState(false);
  const [selectedAgentLog, setSelectedAgentLog] = useState(null);

  // Poll analysis status if running
  useEffect(() => {
    let interval = null;
    if (activeAnalysisId) {
      interval = setInterval(async () => {
        try {
          const res = await agentService.getStatus(activeAnalysisId);
          setAnalysisStatus(res.data);
          if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
            clearInterval(interval);
            loadHistory();
          }
        } catch (err) {
          console.error('Status poll error', err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeAnalysisId]);

  const loadHistory = async () => {
    try {
      const res = await agentService.getHistory();
      setHistory(res.data);
      if (res.data.length > 0 && !activeAnalysisId) {
        const latest = res.data[0];
        setActiveAnalysisId(latest.id);
        const stRes = await agentService.getStatus(latest.id);
        setAnalysisStatus(stRes.data);
      }
    } catch (err) {
      console.error('Error loading history', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRunAnalysis = async () => {
    setTriggering(true);
    try {
      const res = await agentService.run();
      setActiveAnalysisId(res.data.analysis_id);
      setAnalysisStatus(null);
      setSelectedAgentLog(null);
    } catch (err) {
      alert('Failed to trigger analysis: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTriggering(false);
    }
  };

  const getAgentStatus = (agentName) => {
    if (!analysisStatus || !analysisStatus.agent_logs) return 'PENDING';
    const log = analysisStatus.agent_logs.find((l) => l.agent_name.includes(agentName) || agentName.includes(l.agent_name));
    return log ? log.status : analysisStatus.status === 'RUNNING' ? 'RUNNING' : 'PENDING';
  };

  const getAgentLog = (agentName) => {
    if (!analysisStatus || !analysisStatus.agent_logs) return null;
    return analysisStatus.agent_logs.find((l) => l.agent_name.includes(agentName) || agentName.includes(l.agent_name));
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="AI Agent Control Center"
        subtitle="Autonomous Multi-Agent collaborative intelligence pipeline with independent deterministic verification"
      />

      <main className="p-6 space-y-6">
        {/* Orchestration Control Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                analysisStatus?.status === 'RUNNING'
                  ? 'bg-amber-500 animate-ping'
                  : analysisStatus?.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}></span>
              <h3 className="text-base font-bold text-slate-900">
                Workflow Status: {analysisStatus?.status || 'IDLE'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeAnalysisId ? `Analysis ID: ${activeAnalysisId}` : 'No active run. Ready to execute multi-agent workflow.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {analysisStatus?.verified && (
              <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AUDIT VERIFIED ({((analysisStatus?.confidence_score || 0.98) * 100).toFixed(0)}%)</span>
              </span>
            )}

            <button
              onClick={handleRunAnalysis}
              disabled={triggering || analysisStatus?.status === 'RUNNING'}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{triggering || analysisStatus?.status === 'RUNNING' ? 'Agents Collaborating...' : 'Run Full Analysis'}</span>
            </button>
          </div>
        </div>

        {/* 6 Specialized Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {AGENT_DEFINITIONS.map((def, idx) => {
            const Icon = def.icon;
            const status = getAgentStatus(def.name);
            const log = getAgentLog(def.name);

            return (
              <div
                key={def.name}
                onClick={() => log && setSelectedAgentLog(log)}
                className={`p-5 rounded-xl border bg-white shadow-sm transition-all cursor-pointer hover:border-blue-400 ${
                  selectedAgentLog?.agent_name === log?.agent_name ? 'ring-2 ring-blue-500' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{def.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Agent #{idx + 1}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : status === 'RUNNING'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700 mt-3">{def.role}</p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{def.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {log?.completed_at ? `Done ${new Date(log.completed_at).toLocaleTimeString()}` : 'Awaiting trigger'}
                  </span>
                  <span className="text-blue-600 font-semibold flex items-center">
                    {log ? 'View Findings' : 'Ready'}
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Output Inspector Modal / Panel */}
        {selectedAgentLog && (
          <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {selectedAgentLog.agent_name} Findings & Output
                </h4>
                <p className="text-xs text-slate-500">
                  Role: {selectedAgentLog.agent_role} | Status: {selectedAgentLog.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedAgentLog(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded border border-slate-200"
              >
                Close Output
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Input Context:</h5>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                  {selectedAgentLog.input_context}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Generated Analytical Output:</h5>
                <pre className="text-xs text-slate-800 bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedAgentLog.output_text}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Previous Analysis Runs History */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Historical Multi-Agent Analysis Runs</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Trigger</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Auditor Verification</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-900">{h.id.slice(0, 16)}...</td>
                    <td className="py-2.5 px-3 text-slate-600">{new Date(h.started_at).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-600">{h.trigger_type}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        h.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {h.verified ? (
                        <span className="text-emerald-600 font-semibold flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified ({(h.confidence_score * 100).toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">Unverified</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => {
                          setActiveAnalysisId(h.id);
                          agentService.getStatus(h.id).then(r => setAnalysisStatus(r.data));
                        }}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
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

export default AgentCenter;
