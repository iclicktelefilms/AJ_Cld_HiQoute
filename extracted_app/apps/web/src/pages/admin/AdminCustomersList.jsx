import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/m3/ConfirmDialog';

const AdminCustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, customerId: null });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const records = await pb.collection('customers').getFullList({
        filter: 'is_deleted!=true',
        sort: '-created',
        expand: 'user_id',
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

  const handleDelete = async () => {
    try {
      await pb.collection('customers').update(deleteDialog.customerId, { is_deleted: true }, { $autoCancel: false });
      toast.success('Customer softly deleted');
      setDeleteDialog({ open: false, customerId: null });
      fetchCustomers();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5"/> Customers Management</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all bg-background text-foreground"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground">Name</th>
              <th className="p-4 font-semibold text-muted-foreground">Contact Details</th>
              <th className="p-4 font-semibold text-muted-foreground">Photographer</th>
              <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-muted-foreground">No customers found.</td>
              </tr>
            ) : (
              filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-bold text-foreground">{customer.name}</td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{customer.phone}</span>
                      {customer.email && <span className="text-xs">{customer.email}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                      {customer.expand?.user_id?.name || customer.expand?.user_id?.email || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setDeleteDialog({ open: true, customerId: customer.id })}
                      className="p-2 text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-lg transition-colors inline-flex"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={open => !open && setDeleteDialog({ open: false, customerId: null })}
        title="Soft Delete Customer"
        description="Are you sure you want to soft-delete this customer record? It will be hidden from the photographer's active list."
        onConfirm={handleDelete}
        confirmText="Delete Customer"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminCustomersList;