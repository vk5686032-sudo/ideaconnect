import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Lightbulb, FolderKanban, TrendingUp, AlertCircle, LayoutDashboard, FileText, ClipboardList, Activity } from 'lucide-react';
import adminApi from '../../api/admin.api';
import AdminUsers from './AdminUsers';
import AdminIdeas from './AdminIdeas';
import AdminProjects from './AdminProjects';
import AdminReports from './AdminReports';
import AdminApprovals from './AdminApprovals';
import AdminAuditLogs from './AdminAuditLogs';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'approvals', label: 'Approvals', icon: ClipboardList },
  { id: 'audit', label: 'Audit Logs', icon: Activity },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.getAnalytics(),
  });

  const stats = statsData?.data?.data || {};
  const analytics = analyticsData?.data?.data || {};

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Ideas', value: stats.totalIdeas || 0, icon: Lightbulb, color: 'bg-yellow-500' },
    { label: 'Total Projects', value: stats.totalProjects || 0, icon: FolderKanban, color: 'bg-green-500' },
    { label: 'Active Users', value: stats.activeUsers || 0, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending mentor requests */}
          {stats.pendingMentorRequests > 0 && (
            <div className="card bg-yellow-50 border-yellow-200 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Pending Mentor Requests</h3>
                  <p className="text-yellow-700">
                    {stats.pendingMentorRequests} mentor request(s) awaiting approval — see the Users tab.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analytics */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Ideas by Category</h2>
              <div className="space-y-3">
                {analytics.ideasByCategory?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="capitalize">{item._id}</span>
                    <span className="badge-primary">{item.count}</span>
                  </div>
                ))}
                {!analytics.ideasByCategory?.length && (
                  <p className="text-gray-500 text-sm">No data yet.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Projects by Status</h2>
              <div className="space-y-3">
                {analytics.projectsByStatus?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="capitalize">{item._id.replace('-', ' ')}</span>
                    <span className="badge-success">{item.count}</span>
                  </div>
                ))}
                {!analytics.projectsByStatus?.length && (
                  <p className="text-gray-500 text-sm">No data yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Top users */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Top Users by Reputation</h2>
            <div className="space-y-3">
              {analytics.topUsers?.map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="badge-primary">{user.reputation} pts</span>
                </div>
              ))}
              {!analytics.topUsers?.length && <p className="text-gray-500 text-sm">No data yet.</p>}
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'ideas' && <AdminIdeas />}
      {activeTab === 'projects' && <AdminProjects />}
      {activeTab === 'reports' && <AdminReports />}
      {activeTab === 'approvals' && <AdminApprovals />}
      {activeTab === 'audit' && <AdminAuditLogs />}
    </div>
  );
};

export default AdminDashboard;