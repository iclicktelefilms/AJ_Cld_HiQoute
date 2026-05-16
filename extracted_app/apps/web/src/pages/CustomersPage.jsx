import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import AppScaffold from '@/components/m3/AppScaffold';
import { Search, Plus, Users, Edit2, Trash2, Phone, MapPin, Mail, Loader2, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import BottomSheetForm from '@/components/m3/BottomSheetForm';
import AppTextField from '@/components/m3/AppTextField';
import { Button } from '@/components/ui/button';

const CustomersPage = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, customerId: null });
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchCustomers();
    }
  }, [currentUser]);

  const fetchCustomers = async () => {
    try {
      const records = await pb.collection('customers').getFullList({
        filter: `user_id="${currentUser?.id}" && is_deleted!=true`,
        sort: '-created',
        $autoCancel: false
      });
      setCustomers(records);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        address: customer.address || '',
        email: customer.email || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', email: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCustomer) {
        await pb.collection('customers').update(editingCustomer.id, formData, { $autoCancel: false });
        toast.success('Customer updated successfully');
      } else {
        await pb.collection('customers').create({
          ...formData,
          user_id: currentUser.id,
          is_deleted: false
        }, { $autoCancel: false });
        toast.success('Customer created successfully');
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save customer. Please check if the mobile number is already in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('customers').update(deleteDialog.customerId, { is_deleted: true }, { $autoCancel: false });
      toast.success('Customer deleted successfully');
      setDeleteDialog({ open: false, customerId: null });
      fetchCustomers();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <AppScaffold title="Customers">
      <Helmet><title>Customers - Pixora</title></Helmet>

      <div className="flex flex-col h-full space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers by name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button 
            onClick={() => handleOpenForm()} 
            className="hidden sm:flex items-center justify-center gap-2 px-4 h-11 bg-primary text-primary-foreground rounded-xl shadow-sm hover:bg-primary/90 transition-colors font-semibold text-[13px] shrink-0"
          >
            <Plus className="w-4 h-4" /> New Customer
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No Customers Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">Add your first customer to start creating and sharing quotations seamlessly.</p>
            <Button onClick={() => handleOpenForm()} className="gap-2">
              <Plus className="w-4 h-4" /> Add Customer
            </Button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <SearchX className="w-12 h-12 mb-3 opacity-20" />
            <p>No customers match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-3">
                    <h4 className="font-bold text-foreground truncate">{customer.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => handleOpenForm(customer)} 
                      className="p-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg transition-colors"
                      aria-label="Edit customer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteDialog({ open: true, customerId: customer.id })} 
                      className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                      aria-label="Delete customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {(customer.email || customer.address) && (
                  <div className="pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-muted-foreground">
                    {customer.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{customer.email}</span></span>}
                    {customer.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="line-clamp-2">{customer.address}</span></span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="sm:hidden">
          <button 
            onClick={() => handleOpenForm()}
            className="fixed bottom-20 right-6 md:bottom-8 md:right-8 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center z-50"
            aria-label="New Customer"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <BottomSheetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <AppTextField
            label="Full Name *"
            value={formData.name}
            onChange={v => setFormData({ ...formData, name: v })}
            placeholder="Enter customer name"
          />
          <AppTextField
            label="Phone Number *"
            value={formData.phone}
            onChange={v => setFormData({ ...formData, phone: v })}
            placeholder="Enter 10-digit mobile number"
            type="tel"
          />
          <AppTextField
            label="Email Address (Optional)"
            value={formData.email}
            onChange={v => setFormData({ ...formData, email: v })}
            placeholder="Enter email address"
            type="email"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Address (Optional)</label>
            <textarea
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full address details"
              className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none transition-all"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 h-11 rounded-xl font-bold">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 h-11 rounded-xl font-bold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Customer'}
            </Button>
          </div>
        </form>
      </BottomSheetForm>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, customerId: null })}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action will safely remove them from your active records without affecting past quotations."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={handleDelete}
      />
    </AppScaffold>
  );
};

export default CustomersPage;