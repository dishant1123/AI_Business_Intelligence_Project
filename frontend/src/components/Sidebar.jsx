import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Factory,
  CheckCircle2,
  Cpu,
  Package,
  IndianRupee,
  Bot,
  MessageSquare,
  FileText,
  UserCheck,
  ShieldCheck,
  LogOut,
  Database
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Executive Overview', path: '/', icon: LayoutDashboard },
    { name: 'Production Intelligence', path: '/production', icon: Factory },
    { name: 'Quality Intelligence', path: '/quality', icon: CheckCircle2 },
    { name: 'Machine Intelligence', path: '/machines', icon: Cpu },
    { name: 'Inventory & Materials', path: '/inventory', icon: Package },
    { name: 'Financial Intelligence', path: '/finance', icon: IndianRupee },
    { name: 'AI Agent Center', path: '/agents', icon: Bot },
    { name: 'Manufacturing Chat', path: '/chat', icon: MessageSquare },
    { name: 'Executive Reports', path: '/reports', icon: FileText },
    { name: 'Approval Governance', path: '/approvals', icon: UserCheck },
    { name: 'Admin Management', path: '/admin', icon: ShieldCheck, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Factory className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-wide">SMART MFG AI</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Industrial Decision Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'ADMIN') return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username || 'User'}</p>
            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              {user?.role || 'ANALYST'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500">Dataset: May – Oct 2026 (INR)</p>
      </div>
    </aside>
  );
};

export default Sidebar;
