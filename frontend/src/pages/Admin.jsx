import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { adminService, datasetService } from '../services/api';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Database,
  RefreshCw,
  Activity,
  Upload,
  HardDrive
} from 'lucide-react';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('ANALYST');
  const [submittingUser, setSubmittingUser] = useState(false);

  // Re-seed state
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    try {
      const [uRes, actRes] = await Promise.all([
        adminService.listUsers(),
        adminService.getSystemActivity(),
      ]);
      setUsers(uRes.data);
      setActivity(actRes.data);
    } catch (err) {
      console.error('Admin fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmittingUser(true);
    try {
      await adminService.createUser({
        username: newUsername,
        password: newPassword,
        full_name: newFullName,
        email: newEmail,
        role: newRole,
      });
      alert('User created successfully!');
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewEmail('');
      await fetchData();
    } catch (err) {
      alert('Failed to create user: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleReSeed = async () => {
    if (!window.confirm('Are you sure you want to re-import the master 04_Manufacturing.xlsx dataset?')) return;
    setSyncing(true);
    try {
      await datasetService.importSeed();
      alert('Dataset successfully re-imported and initialized!');
      await fetchData();
    } catch (err) {
      alert('Re-seed failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <Header
        title="System Administration & Security Panel"
        subtitle="User credentials, role permissions, master dataset management, and telemetry logs"
      />

      <main className="p-6 space-y-6">
        {/* System Activity Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Users</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{activity?.total_users}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Role-Based Access Control</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Agent Analyses</span>
            <h3 className="text-xl font-bold text-blue-600 mt-1">{activity?.total_analyses_run} Runs</h3>
            <p className="text-[11px] text-slate-400 mt-1">Multi-Agent Invocations</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Agent Logs</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">{activity?.total_agent_logs} Logs</h3>
            <p className="text-[11px] text-slate-400 mt-1">Evidence Records Persisted</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Dataset Imports</span>
            <h3 className="text-xl font-bold text-purple-600 mt-1">{activity?.total_dataset_imports} Imports</h3>
            <p className="text-[11px] text-slate-400 mt-1">Multi-Sheet Integrity History</p>
          </div>
        </div>

        {/* Master Dataset Controls */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Master Dataset Re-Sync & Ingestion</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Reset or reload the database from the official <code>04_Manufacturing.xlsx</code> workbook.
            </p>
          </div>

          <button
            onClick={handleReSeed}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Re-importing...' : 'Re-Import 04_Manufacturing.xlsx'}</span>
          </button>
        </div>

        {/* User Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Registered Platform Users ({users.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{u.username}</td>
                      <td className="py-2.5 px-3 text-slate-700">{u.full_name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <UserPlus className="w-4 h-4 mr-2 text-blue-600" />
              Create Platform User
            </h4>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Role Permission</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ANALYST">ANALYST (Analytics & ML)</option>
                  <option value="MANAGER">MANAGER (Approvals & Ops)</option>
                  <option value="ADMIN">ADMIN (Full Root Access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingUser}
                className="w-full py-2 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm disabled:opacity-50 mt-2"
              >
                {submittingUser ? 'Adding User...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
