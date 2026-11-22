import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { approvalService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building,
  Target,
  Calendar,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

const Approvals = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal state
  const [selectedRec, setSelectedRec] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRecommendations = async () => {
    try {
      const res = await approvalService.list();
      setRecommendations(res.data);
    } catch (err) {
      console.error('Error fetching recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const openDecisionModal = (rec, type) => {
    setSelectedRec(rec);
    setDecisionType(type);
    setComments(type === 'APPROVED' ? 'Approved for immediate execution by Operations.' : 'Requires budget restructuring.');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRec) return;
    setSubmitting(true);

    try {
      await approvalService.recordDecision(selectedRec.id, decisionType, comments);
      alert(`Recommendation successfully ${decisionType.toLowerCase()}!`);
      setSelectedRec(null);
      await fetchRecommendations();
    } catch (err) {
      alert('Decision recording failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const canApprove = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="Human-in-the-Loop Approval Governance"
        subtitle="Managerial review and decision tracking for consequential strategic and operational AI recommendations"
      />

      <main className="p-6 space-y-6">
        {/* Governance Policy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900">
          <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-blue-950">Strict Human Governance Mandate:</p>
            <p className="mt-0.5 leading-relaxed text-blue-800">
              In accordance with enterprise safety standards, AI agents formulate data-grounded recommendations, but no consequential factory operations (purchases, line changeovers, tooling adjustments) are executed without explicit managerial authorization.
            </p>
          </div>
        </div>

        {/* Recommendations Cards */}
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const isApproved = rec.status === 'APPROVED';
            const isRejected = rec.status === 'REJECTED';
            const isPending = rec.status === 'PENDING_REVIEW';

            return (
              <div
                key={rec.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                      rec.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : rec.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{rec.problem}</h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isRejected
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {rec.status.replace('_', ' ')}
                  </span>
                </div>

                {/* 9-Attribute Structured Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Supporting Evidence:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{rec.supporting_evidence}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Business Impact:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{rec.business_impact}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Recommended Action:</span>
                      <p className="text-blue-900 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200 font-medium leading-relaxed">
                        {rec.recommended_action}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 md:pl-4 md:border-l border-slate-100">
                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Expected Benefit:</span>
                      <p className="text-emerald-700 font-semibold mt-0.5">{rec.expected_benefit}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Timeline:</span>
                        <p className="text-slate-800 font-medium flex items-center mt-0.5">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {rec.implementation_timeline}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Department:</span>
                        <p className="text-slate-800 font-medium flex items-center mt-0.5">
                          <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {rec.responsible_department}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">KPI to Monitor:</span>
                      <p className="text-slate-800 font-medium flex items-center mt-0.5">
                        <Target className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        {rec.kpi_to_monitor}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Governance Actions Bar */}
                {isPending && canApprove && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                    <button
                      onClick={() => openDecisionModal(rec, 'REJECTED')}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      Reject Recommendation
                    </button>
                    <button
                      onClick={() => openDecisionModal(rec, 'APPROVED')}
                      className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      Approve & Authorize Action
                    </button>
                  </div>
                )}

                {isPending && !canApprove && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
                    Logged in as Analyst. Plant Manager or Admin authorization required to approve consequential actions.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Dialog for Decision Recording */}
        {selectedRec && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {decisionType === 'APPROVED' ? 'Authorize Recommendation' : 'Reject Recommendation'}
              </h3>
              <p className="text-xs text-slate-500 mb-4 truncate">{selectedRec.problem}</p>

              <form onSubmit={handleDecisionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Managerial Comments & Directives (Recorded in Audit Trail):
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRec(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                      decisionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {submitting ? 'Recording...' : `Confirm ${decisionType}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Approvals;
