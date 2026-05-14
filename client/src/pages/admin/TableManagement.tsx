import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Download, 
  QrCode, 
  ToggleLeft, 
  ToggleRight, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import type { Table } from '../../types';

const TableManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);

  const { data, isLoading } = useQuery<{ tables: Table[] }>({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await api.get('/tables');
      return res.data;
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (count: number) => api.post('/tables/bulk-create', { count }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success(res.data.message);
      setIsBulkModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create tables'),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => api.put(`/tables/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table deleted');
    },
  });

  const handleDownload = (id: string) => {
    window.open(`/api/tables/${id}/qr/download`, '_blank');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Table & QR Management</h1>
          <p className="page-subtitle">Manage restaurant tables and generate unique QR codes for each.</p>
        </div>
        <button onClick={() => setIsBulkModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          Create Tables
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="h-40 card animate-pulse bg-brand-600/5"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data?.tables.map(table => (
            <div key={table._id} className={`card-hover p-5 flex flex-col items-center ${!table.isActive ? 'opacity-50 grayscale' : ''}`}>
              <div className="w-full flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${table.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {table.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => { if(confirm(`Delete Table ${table.tableNumber}?`)) deleteMutation.mutate(table._id) }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="w-20 h-20 bg-white p-2 rounded-xl mb-4 shadow-sm relative group">
                <img src={table.qrCode} alt={`QR Table ${table.tableNumber}`} className="w-full h-full" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <button onClick={() => handleDownload(table._id)} className="p-2 bg-brand-600 rounded-full text-white">
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gold font-display mb-4">Table {table.tableNumber}</h3>

              <div className="w-full pt-4 border-t dark:border-dark-border border-light-border flex justify-between items-center">
                <button 
                  onClick={() => toggleMutation.mutate(table._id)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${table.isActive ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {table.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {table.isActive ? 'Disable' : 'Enable'}
                </button>
                <button 
                  onClick={() => window.open(`/table/${table._id}`, '_blank')}
                  className="text-brand-600 hover:text-brand-500 transition-all"
                  title="View as Customer"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Empty State / Add Card */}
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="card p-5 flex flex-col items-center justify-center border-dashed border-2 border-brand-600/20 hover:border-brand-600/50 hover:bg-brand-600/5 transition-all text-brand-700"
          >
            <Plus size={32} className="mb-2" />
            <span className="text-sm font-bold">Add More Tables</span>
          </button>
        </div>
      )}

      {/* Bulk Create Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm overflow-hidden shadow-gold-lg border-brand-600/30">
            <div className="p-6 border-b dark:border-dark-border border-light-border bg-dark-card">
              <h3 className="text-xl font-bold text-gold font-display">Create Tables</h3>
              <p className="text-xs text-brand-700 mt-1">Existing table numbers will be skipped.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="label">Number of Tables (Up to 50)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={bulkCount} 
                    onChange={(e) => setBulkCount(parseInt(e.target.value))}
                    className="flex-1 accent-brand-600"
                  />
                  <span className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 font-bold border border-brand-600/20">
                    {bulkCount}
                  </span>
                </div>
              </div>
              
              <div className="bg-brand-600/5 p-4 rounded-xl border border-brand-600/10 flex items-start gap-3">
                <QrCode size={20} className="text-brand-600 mt-0.5" />
                <p className="text-xs text-brand-700 leading-relaxed">
                  Unique QR codes will be automatically generated for each table and stored in the database.
                </p>
              </div>
            </div>

            <div className="p-6 bg-dark-muted border-t dark:border-dark-border border-light-border flex gap-3">
              <button onClick={() => setIsBulkModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button 
                onClick={() => bulkCreateMutation.mutate(bulkCount)} 
                disabled={bulkCreateMutation.isPending}
                className="btn-primary flex-1"
              >
                {bulkCreateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
