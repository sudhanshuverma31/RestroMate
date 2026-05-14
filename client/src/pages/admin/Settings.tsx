import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Store, 
  Clock, 
  Shield, 
  UserPlus, 
  Power, 
  Save, 
  Loader2,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import type { ShopSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [showSubAdminForm, setShowSubAdminForm] = useState(false);
  const [subAdminData, setSubAdminData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { data: settingsData, isLoading: isSettingsLoading } = useQuery<{ settings: ShopSettings }>({
    queryKey: ['shop-settings'],
    queryFn: async () => {
      const res = await api.get('/shop/status');
      return res.data;
    },
  });

  const toggleShopMutation = useMutation({
    mutationFn: async () => api.put('/shop/toggle'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
      toast.success('Shop status updated');
    },
  });

  const updateTimingMutation = useMutation({
    mutationFn: async (data: { openingTime: string, closingTime: string }) => api.put('/shop/timing', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
      toast.success('Timings updated');
    },
  });

  const createSubAdminMutation = useMutation({
    mutationFn: async (data: any) => api.post('/admin/create-sub-admin', data),
    onSuccess: () => {
      toast.success('Sub-admin created successfully');
      setShowSubAdminForm(false);
      setSubAdminData({ name: '', email: '', password: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create sub-admin'),
  });

  if (isSettingsLoading) return <div className="p-10 text-center animate-pulse">Loading settings...</div>;

  const settings = settingsData?.settings;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Shop Controls & Settings</h1>
        <p className="page-subtitle">Manage restaurant operations, timings, and team access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Shop Status */}
        <div className="card p-8 flex flex-col items-center text-center">
          <div className={`p-6 rounded-3xl mb-6 transition-all duration-500 ${settings?.isOpen ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            <Power size={48} className={settings?.isOpen ? 'animate-pulse' : ''} />
          </div>
          <h3 className="text-2xl font-bold text-gold font-display mb-2">
            {settings?.isOpen ? 'Restaurant is OPEN' : 'Restaurant is CLOSED'}
          </h3>
          <p className="text-brand-700 text-sm mb-8 leading-relaxed max-w-xs">
            {settings?.isOpen 
              ? 'Customers can now scan QR codes and place orders. All digital menus are active.' 
              : 'All table QR codes are disabled. Customers will see a "Closed" message.'}
          </p>
          <button 
            onClick={() => toggleShopMutation.mutate()}
            disabled={toggleShopMutation.isPending}
            className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${settings?.isOpen ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'btn-primary'}`}
          >
            {toggleShopMutation.isPending ? <Loader2 size={20} className="animate-spin mx-auto" /> : settings?.isOpen ? 'Close Shop Now' : 'Open Shop Now'}
          </button>
        </div>

        {/* Operating Hours */}
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-brand-600/10 text-brand-600">
              <Clock size={20} />
            </div>
            <h3 className="text-lg font-bold text-gold font-display">Operating Hours</h3>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            updateTimingMutation.mutate({
              openingTime: (form.elements.namedItem('open') as HTMLInputElement).value,
              closingTime: (form.elements.namedItem('close') as HTMLInputElement).value,
            });
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Opening Time</label>
                <input name="open" type="time" className="input" defaultValue={settings?.openingTime || "09:00"} />
              </div>
              <div>
                <label className="label">Closing Time</label>
                <input name="close" type="time" className="input" defaultValue={settings?.closingTime || "23:00"} />
              </div>
            </div>
            <button className="btn-secondary w-full py-3">
              <Save size={16} /> Save Timings
            </button>
          </form>

          <div className="mt-8 pt-8 border-t dark:border-dark-border border-light-border">
            <div className="flex items-center gap-3 mb-2 text-brand-600">
              <Shield size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Access Level</span>
            </div>
            <p className="text-[10px] text-brand-700 font-bold uppercase">
              Logged in as: <span className="text-gold ml-1">{currentUser?.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Admin Management (Super Admin Only) */}
      {currentUser?.role === 'super-admin' && (
        <div className="card overflow-hidden">
          <div className="p-8 border-b dark:border-dark-border border-light-border flex items-center justify-between bg-dark-muted/20">
            <div>
              <h3 className="text-xl font-bold text-gold font-display">Staff & Sub-Admins</h3>
              <p className="text-xs text-brand-700 mt-1">Create additional accounts for your managers and staff.</p>
            </div>
            <button 
              onClick={() => setShowSubAdminForm(!showSubAdminForm)}
              className="btn-primary"
            >
              <UserPlus size={18} />
              {showSubAdminForm ? 'Cancel' : 'Add Sub-Admin'}
            </button>
          </div>

          {showSubAdminForm && (
            <div className="p-8 bg-dark-bg/50 border-b dark:border-dark-border border-light-border animate-slide-up">
              <form onSubmit={(e) => {
                e.preventDefault();
                createSubAdminMutation.mutate(subAdminData);
              }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="label">Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={16} />
                    <input 
                      className="input pl-10" 
                      placeholder="Full Name" 
                      value={subAdminData.name}
                      onChange={(e) => setSubAdminData({...subAdminData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={16} />
                    <input 
                      type="email" 
                      className="input pl-10" 
                      placeholder="email@example.com"
                      value={subAdminData.email}
                      onChange={(e) => setSubAdminData({...subAdminData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={16} />
                    <input 
                      type="password" 
                      className="input pl-10" 
                      placeholder="••••••••"
                      value={subAdminData.password}
                      onChange={(e) => setSubAdminData({...subAdminData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button 
                    disabled={createSubAdminMutation.isPending}
                    className="btn-primary px-8"
                  >
                    {createSubAdminMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="p-8 flex items-center justify-center py-20 text-center">
            <div className="max-w-xs">
              <Store size={48} className="text-brand-600/20 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gold font-display">System Integrity</h4>
              <p className="text-xs text-brand-700 mt-2 leading-relaxed">
                As Super Admin, you have full control over the restaurant's digital presence. Keep your credentials secure.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
