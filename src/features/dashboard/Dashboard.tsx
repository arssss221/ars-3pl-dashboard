// src/features/dashboard/Dashboard.tsx
import { useState, useEffect } from 'react';
import {
  Users,
  Car,
  CreditCard,
  TrendingUp,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Fuel,
  Wrench,
  Clock,
  CalendarCheck,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 124,
    activeVehicles: 18,
    monthlyRevenue: 84500,
    pendingTransactions: 7,
    totalTrips: 342,
    pendingServices: 3,
    avgFuelEfficiency: '8.2 km/l',
    upcomingMaintenance: 5,
  });

  useEffect(() => {
    // এখানে API কল করে আসল ডাটা আনবেন
    // setStats(realData);
  }, []);

  const recentActivities = [
    {
      id: 1,
      action: 'New employee joined',
      name: 'Md. Rahim',
      time: '2h ago',
      icon: Users,
    },
    {
      id: 2,
      action: 'Oil change completed',
      name: 'Truck KA-01-1234',
      time: '5h ago',
      icon: Fuel,
    },
    {
      id: 3,
      action: 'Payment received',
      name: '৳25,000 from ABC',
      time: 'Yesterday',
      icon: CreditCard,
    },
    {
      id: 4,
      action: 'Trip completed',
      name: 'Dhaka → Chittagong',
      time: 'Yesterday',
      icon: Car,
    },
  ];

  const quickActions = [
    { icon: Users, label: 'Add Employee', color: 'emerald' },
    { icon: Car, label: 'Schedule Service', color: 'blue' },
    { icon: CreditCard, label: 'Record Payment', color: 'purple' },
    { icon: Package, label: 'Check Stock', color: 'orange' },
    { icon: Wrench, label: 'Maintenance', color: 'slate' },
  ];

  return (
    <div className="space-y-4 p-4 md:p-5">
      {/* Compact Stats Grid - ছোট কার্ড, বেশি কলাম */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
        <CompactStatCard
          title="Employees"
          value={stats.totalEmployees}
          change="+12%"
          trend="up"
          icon={Users}
          color="emerald"
        />
        <CompactStatCard
          title="Vehicles"
          value={stats.activeVehicles}
          change="+2"
          trend="up"
          icon={Car}
          color="blue"
        />
        <CompactStatCard
          title="Revenue"
          value={`৳${(stats.monthlyRevenue / 1000).toFixed(0)}k`}
          change="+18%"
          trend="up"
          icon={TrendingUp}
          color="purple"
        />
        <CompactStatCard
          title="Pending Pay"
          value={stats.pendingTransactions}
          change="-3"
          trend="down"
          icon={DollarSign}
          color="orange"
        />
        <CompactStatCard
          title="Trips"
          value={stats.totalTrips}
          change="+8%"
          trend="up"
          icon={CalendarCheck}
          color="teal"
        />
        <CompactStatCard
          title="Services Due"
          value={stats.pendingServices}
          change="+1"
          trend="up"
          icon={Wrench}
          color="rose"
        />
      </div>

      {/* Two column layout for activity & actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity - compact list */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-4 py-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50"
              >
                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                  <activity.icon size={14} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    {activity.action}{' '}
                    <span className="font-medium text-emerald-600">
                      {activity.name}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + extra info */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="px-4 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Quick Actions
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-${action.color}-50 hover:text-${action.color}-600`}
                >
                  <action.icon size={14} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Extra info card: Fleet status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-500">
                Fleet Efficiency
              </span>
              <span className="text-sm font-bold text-slate-800">92%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: '92%' }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Fuel size={12} /> Avg: {stats.avgFuelEfficiency}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> Maint: {stats.upcomingMaintenance}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ছোট স্ট্যাট কার্ড (বক্সের সাইজ কম)
function CompactStatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: any) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    teal: 'bg-teal-100 text-teal-600',
    rose: 'bg-rose-100 text-rose-600',
  };
  return (
    <div className="bg-white rounded-lg border border-slate-100 p-2.5 shadow-sm hover:shadow transition-all">
      <div className="flex items-center justify-between">
        <div
          className={`h-7 w-7 rounded-md ${colorClasses[color]} flex items-center justify-center`}
        >
          <Icon size={14} />
        </div>
        <span
          className={`text-[10px] font-medium flex items-center gap-0.5 ${
            trend === 'up' ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {trend === 'up' ? (
            <ArrowUpRight size={10} />
          ) : (
            <ArrowDownRight size={10} />
          )}
          {change}
        </span>
      </div>
      <p className="text-lg font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
        {title}
      </p>
    </div>
  );
}
