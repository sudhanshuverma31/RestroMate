import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  X,
  Image as ImageIcon,
  Loader2,
  UtensilsCrossed
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import type { MenuItem, MenuCategory } from '../../types';

const CATEGORIES: MenuCategory[] = ['Starters', 'Main Course', 'Desserts', 'Drinks', 'Snacks', 'Breads', 'Rice', 'Combos'];

const MenuManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery<{ items: MenuItem[] }>({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await api.get('/menu');
      return res.data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (editingItem) {
        return api.put(`/menu/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return api.post('/menu/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success(editingItem ? 'Item updated' : 'Item added');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/menu/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Item deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/menu/${id}/availability`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setImageFile(null);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const filteredItems = data?.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="page-subtitle">Add, edit and organize your restaurant menu items.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          Add New Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={18} />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'All' ? 'bg-brand-600 text-white shadow-gold' : 'glass text-brand-700'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-brand-600 text-white shadow-gold' : 'glass text-brand-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 card animate-pulse bg-brand-600/5"></div>)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-20 flex flex-col items-center justify-center text-center">
          <UtensilsCrossed size={60} className="text-brand-600/20 mb-4" />
          <h3 className="text-xl font-bold text-gold">No items found</h3>
          <p className="text-brand-700 mt-1">Try adjusting your filters or add a new menu item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item._id} className="menu-card flex flex-col h-full">
              <div className="relative h-48 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-brand-600/10 flex items-center justify-center text-brand-600">
                    <UtensilsCrossed size={40} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${item.isAvailable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg glass text-brand-600 hover:bg-brand-600 hover:text-white transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { if(confirm('Delete this item?')) deleteMutation.mutate(item._id) }} className="p-2 rounded-lg glass text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gold text-lg font-display">{item.name}</h3>
                  <span className="text-emerald-500 font-bold">₹{item.price}</span>
                </div>
                <p className="text-xs text-brand-700 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                <div className="mt-auto pt-4 border-t dark:border-dark-border border-light-border flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-600/10 text-brand-600 px-2 py-1 rounded-md">
                    {item.category}
                  </span>
                  <button 
                    onClick={() => handleToggle(item._id)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all ${item.isAvailable ? 'text-emerald-500' : 'text-red-500'}`}
                  >
                    {item.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {item.isAvailable ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-xl overflow-hidden shadow-gold-lg border-brand-600/30">
            <div className="p-6 border-b dark:border-dark-border border-light-border flex items-center justify-between bg-dark-card">
              <h3 className="text-xl font-bold text-gold font-display">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-brand-600/10 rounded-full transition-all text-brand-700">
                <X size={20} />
              </button>
            </div>
            
            <form id="menu-form" onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              if (imageFile) formData.append('image', imageFile);
              upsertMutation.mutate(formData);
            }} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Item Name</label>
                  <input name="name" className="input" defaultValue={editingItem?.name} required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Price (₹)</label>
                  <input name="price" type="number" className="input" defaultValue={editingItem?.price} required />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select name="category" className="input cursor-pointer" defaultValue={editingItem?.category || 'Main Course'}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea name="description" className="input min-h-[100px] resize-none" defaultValue={editingItem?.description}></textarea>
              </div>

              <div>
                <label className="label">Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-brand-600/30 flex items-center justify-center overflow-hidden bg-dark-muted">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
                    ) : editingItem?.imageUrl ? (
                      <img src={editingItem.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-brand-700" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="text-xs file:px-4 file:py-2 file:rounded-xl file:border file:border-brand-600 file:text-brand-600 file:bg-transparent hover:file:bg-brand-600 hover:file:text-white file:border-0 file:mr-4 cursor-pointer text-brand-700" 
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="isAvailable" 
                  id="avail" 
                  className="w-4 h-4 rounded border-brand-600 bg-transparent text-brand-600 focus:ring-brand-600"
                  defaultChecked={editingItem ? editingItem.isAvailable : true} 
                />
                <label htmlFor="avail" className="text-sm font-bold text-gold">Available for Ordering</label>
              </div>
            </form>

            <div className="p-6 bg-dark-muted border-t dark:border-dark-border border-light-border flex justify-end gap-3">
              <button onClick={closeModal} className="btn-secondary px-8">Cancel</button>
              <button type="submit" form="menu-form" disabled={upsertMutation.isPending} className="btn-primary px-10">
                {upsertMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
