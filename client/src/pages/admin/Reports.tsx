import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Clock,
  ArrowUpRight,
  ChevronRight,
  FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../../utils/api';
import type { DailySummary, HistoryEntry } from '../../types';

const COLORS = ['#C4A47A', '#B8860B', '#8B5A2B', '#A0522D', '#CD853F'];

const Reports: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: summary, isLoading: isSummaryLoading } = useQuery<DailySummary>({
    queryKey: ['report-daily', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/admin/reports/daily?date=${selectedDate}`);
      return res.data;
    },
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery<{ history: HistoryEntry[] }>({
    queryKey: ['report-history'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/history');
      return res.data;
    },
  });

  const handleExport = () => {
    window.open(`/api/admin/reports/export?date=${selectedDate}`, '_blank');
  };

  if (isSummaryLoading || isHistoryLoading) return <div className="p-10 text-center animate-pulse">Generating reports...</div>;

  const pieData = summary?.itemsSold.slice(0, 5).map(item => ({
    name: item.name,
    value: item.quantity
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Detailed breakdown of sales, popular items, and peak performance hours.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={16} />
            <input 
              type="date" 
              className="input pl-10 py-2 text-xs h-10 w-40 rounded-xl glass border-brand-600/20"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button onClick={handleExport} className="btn-secondary h-10 text-xs px-4">
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> 12%
            </span>
          </div>
          <p className="stat-label mt-3">Daily Revenue</p>
          <h3 className="stat-value">₹{summary?.totalRevenue || 0}</h3>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-brand-600/10 text-brand-600">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="stat-label mt-3">Daily Orders</p>
          <h3 className="stat-value">{summary?.totalOrders || 0}</h3>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="stat-label mt-3">Peak Hour</p>
          <h3 className="stat-value">{summary?.peakHour || 0}:00</h3>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock size={20} />
            </div>
          </div>
          <p className="stat-label mt-3">Avg. Prep Time</p>
          <h3 className="stat-value">14 Min</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gold font-display mb-8">30-Day Revenue Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData?.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
                <XAxis dataKey="date" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8B5A2B', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                  itemStyle={{ color: '#C4A47A' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#B8860B" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Items Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gold font-display mb-8">Item Sales Breakdown</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 shrink-0 pr-4">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] font-bold text-brand-700 uppercase">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Performance */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-bold text-gold font-display mb-8">Hourly Order Volume</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary?.hourlyData.map((count, hour) => ({ hour: `${hour}:00`, count }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#8B5A2B', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8B5A2B', fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
              />
              <Bar dataKey="count" fill="#B8860B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Items Sold Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b dark:border-dark-border border-light-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-gold font-display">Item Performance</h3>
          <FileText size={18} className="text-brand-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th className="text-center">Units Sold</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {summary?.itemsSold.map((item) => (
                <tr key={item.itemId}>
                  <td className="font-bold text-gold">{item.name}</td>
                  <td className="text-center">
                    <span className="px-2 py-1 rounded bg-brand-600/10 text-brand-600 font-bold text-xs">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="text-right font-bold text-emerald-500">₹{item.revenue}</td>
                  <td className="text-right">
                    <button className="p-2 rounded-lg hover:bg-brand-600/10 text-brand-600 transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
