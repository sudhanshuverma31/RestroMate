import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import api from '../../utils/api';
import type { DailySummary } from '../../types';

const Dashboard: React.FC = () => {
  const { data: summary, isLoading } = useQuery<DailySummary>({
    queryKey: ['daily-summary'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/daily');
      return res.data;
    },
  });

  if (isLoading) return <div className="animate-pulse">Loading dashboard...</div>;

  const stats = [
    { label: "Today's Revenue", value: `₹${summary?.totalRevenue || 0}`, icon: DollarSign, trend: "+12%", trendUp: true, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Orders", value: summary?.totalOrders || 0, icon: ShoppingBag, trend: "+5%", trendUp: true, color: "text-brand-500", bg: "bg-brand-500/10" },
    { label: "UPI Payments", value: `₹${summary?.totalUPIAmount || 0}`, icon: CreditCard, trend: "+18%", trendUp: true, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Cash Payments", value: `₹${summary?.totalCashAmount || 0}`, icon: DollarSign, trend: "-2%", trendUp: false, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  const hourlyChartData = summary?.hourlyData.map((count, hour) => ({
    time: `${hour}:00`,
    orders: count
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border-brand-600/20">
          <Clock size={16} className="text-brand-600" />
          <span className="text-sm font-bold text-gold">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card group hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {stat.trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="stat-label uppercase tracking-wider text-[10px]">{stat.label}</p>
              <h3 className="stat-value mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gold font-display">Orders Distribution (24h)</h3>
            <select className="bg-transparent text-xs font-bold text-brand-700 outline-none border-none cursor-pointer">
              <option>Last 24 Hours</option>
              <option>Previous Day</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyChartData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8860B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#B8860B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#8B5A2B', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8B5A2B', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                  itemStyle={{ color: '#C4A47A' }}
                />
                <Area type="monotone" dataKey="orders" stroke="#B8860B" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gold font-display">Popular Items</h3>
            <TrendingUp size={18} className="text-brand-600" />
          </div>
          <div className="space-y-6">
            {summary?.itemsSold.slice(0, 5).map((item, i) => (
              <div key={item.itemId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg dark:bg-dark-muted bg-light-muted flex items-center justify-center text-xs font-bold text-brand-600">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gold">{item.name}</p>
                    <p className="text-[10px] text-brand-700 font-bold uppercase">{item.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-500">
                  ₹{item.revenue}
                </div>
              </div>
            )) || <p className="text-center py-10 text-sm text-brand-700">No data available yet</p>}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-brand-600/20 text-brand-600 text-xs font-bold uppercase tracking-widest hover:bg-brand-600/5 transition-all flex items-center justify-center gap-2">
            View All Reports <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
