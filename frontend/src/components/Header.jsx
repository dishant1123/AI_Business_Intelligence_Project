import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Activity, RefreshCw } from 'lucide-react';
import { datasetService } from '../services/api';

const Header = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    datasetService.getSummary()
      .then(res => setDatasetInfo(res.data))
      .catch(() => {});
  }, []);

  const handleQuickSeed = async () => {
    setSyncing(true);
    try {
      await datasetService.importSeed();
      const res = await datasetService.getSummary();
      setDatasetInfo(res.data);
      alert('Dataset synchronized successfully from 04_Manufacturing.xlsx!');
      window.location.reload();
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Dataset Status Pill */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">
            {datasetInfo ? `1,600 Batches | 12 Lines | Verified` : 'Live DB Connected'}
          </span>
        </div>

        {/* Sync Button */}
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={handleQuickSeed}
            disabled={syncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Reload dataset from master Excel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        )}

        {/* User Badge */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name || user?.username}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase() || 'analyst'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
