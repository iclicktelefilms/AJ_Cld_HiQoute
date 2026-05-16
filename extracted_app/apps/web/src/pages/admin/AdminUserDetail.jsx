import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Mail, Phone, Calendar, Shield, LogIn, Trash2, Zap, Briefcase, MapPin, Instagram, Edit2, CheckCircle2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from '@/components/admin/UserForm';
import { Button } from '@/components/ui/button';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { directLoginAsUser } = useAuth();
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const userRecord = await pb.collection('users').getOne(id, { expand: 'plan_id,referred_by', $autoCancel: false });
      setUser(userRecord);
      setSelectedPlanId(userRecord.plan_id || '');

      const plansList = await pb.collection('plans').getFullList({ $autoCancel: false });
      setPlans(plansList);

      try {
        const customerRecords = await pb.collection('customers').getList(1, 1, {
          filter: `user_id="${id}"`,
          $autoCancel: false
        });
        if (customerRecords.items.length > 0) {
          setCustomerProfile(customerRecords.items[0]);
        }
      } catch (err) {
        console.log('No customer profile found for user');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('User not found');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('users').delete(user.id, { $autoCancel: false });
      toast.success('User deleted successfully');
      navigate('/admin');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleDirectLogin = async () => {
    const result = await directLoginAsUser(user.id);
    if (result.success) {
      toast.success(`Logged in as ${user.full_name || user.name || user.email}`);
      navigate('/dashboard');
    } else {
      toast.error('Failed to login as user');
    }
  };

  const handlePlanChange = async () => {
    if (selectedPlanId === (user.plan_id || '')) return;
    
    setIsUpdatingPlan(true);
    try {
      await pb.collection('users').update(user.id, {
        plan_id: selectedPlanId || null
      }, { $autoCancel: false });
      
      toast.success('User plan updated successfully');
      await fetchData();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error('Failed to update user plan');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  if (loading) {
    return <div className="min-h-[100dvh] bg-[#f9f9f9] flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  const combinedData = {
    ...user,
    full_name: user.full_name || user.name || '',
    business_name: customerProfile?.business_name || user.business_name || '',
    address: customerProfile?.address || user.address || user.location || '',
    instagramProfile: customerProfile?.instagramProfile || user.instagramProfile || '',
    phone: customerProfile?.phone || user.phone || ''
  };

  return (
    <div className="min-h-[100dvh] bg-[#f9f9f9] pb-24 md:pb-12">
      <Helmet>
        <title>{combinedData.full_name || 'User'} - Admin</title>
      </Helmet>

      <header className="bg-white border-b border-[#e0e0e0] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/admin/users')}
              className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h1 className="text-lg font-bold text-black truncate max-w-[150px] sm:max-w-xs">User Profile</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDirectLogin}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-[#d1fae5] text-[#10b981] rounded-xl text-sm font-bold hover:bg-[#a7f3d0] transition-colors min-h-[40px]"
            >
              <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Login As</span>
            </button>
            <button 
              onClick={() => setEditModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-[#eff6ff] text-[#3b82f6] rounded-xl text-sm font-bold hover:bg-[#dbeafe] transition-colors min-h-[40px]"
            >
              <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Edit</span>
            </button>
            <button 
              onClick={() => setDeleteDialogOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-[#fff0f0] text-[#ff3131] rounded-xl text-sm font-bold hover:bg-[#fee2e2] transition-colors min-h-[40px]"
            >
              <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            <div className="w-24 h-24 bg-[#fff0f0] rounded-full flex items-center justify-center text-3xl font-bold text-[#ff3131] border border-[#ff3131]/20 flex-shrink-0">
              {(combinedData.full_name || combinedData.email || 'U').charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h2 className="text-2xl font-bold text-black">{combinedData.full_name || 'Unnamed User'}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'super_admin' ? 'bg-[#E8E8E8] text-[#000000]' : 'bg-[#eff6ff] text-[#3b82f6]'}`}>
                    {user.role || 'photographer'}
                  </span>
                  <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.status === 'inactive' ? 'bg-[#F8D7DA] text-[#ff3131]' : 'bg-[#D4EDDA] text-[#10b981]'}`}>
                    {user.status || 'active'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#e0e0e0] w-full">
                <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-[#666666]">
                  <Mail className="w-4 h-4 text-[#ff3131] flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-[#666666]">
                  <Phone className="w-4 h-4 text-[#ff3131] flex-shrink-0" />
                  <span>{combinedData.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-[#666666]">
                  <Calendar className="w-4 h-4 text-[#ff3131] flex-shrink-0" />
                  <span>Joined {new Date(user.created).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-[#666666]">
                  <Shield className="w-4 h-4 text-[#ff3131] flex-shrink-0" />
                  <span className="truncate">ID: {user.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plan Card */}
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#f59e0b]" />
            <h3 className="text-lg font-bold text-black">Subscription Plan</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-[#666666] mb-2">Current Assigned Plan</label>
              <select 
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-[#f9f9f9] text-black border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-[#ff3131]"
              >
                <option value="">No Plan</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}</option>
                ))}
              </select>
            </div>
            
            <Button 
              onClick={handlePlanChange}
              disabled={isUpdatingPlan || selectedPlanId === (user.plan_id || '')}
              className="w-full sm:w-auto h-[46px] rounded-xl px-6 gap-2"
            >
              {isUpdatingPlan ? 'Updating...' : 'Update Plan'}
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Customer Profile Details */}
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-black mb-4">Studio & Profile Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Studio Name
              </p>
              <p className="text-sm font-medium text-black">{combinedData.business_name || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Address
              </p>
              <p className="text-sm font-medium text-black">{combinedData.address || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </p>
              <p className="text-sm font-medium text-black">{combinedData.instagramProfile || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Referral Code
              </p>
              <p className="text-sm font-medium text-black font-mono">{combinedData.referral_code || combinedData.referralCode || 'Not provided'}</p>
            </div>
            
            {user.expand?.referred_by && (
              <div className="space-y-1 sm:col-span-2 mt-2 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Referred By
                </p>
                <p className="text-sm font-medium text-black">
                  {user.expand.referred_by.full_name || user.expand.referred_by.name || 'Unknown'} - {user.expand.referred_by.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-[95vw] max-w-[600px] bg-card border-border rounded-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-foreground">Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <UserForm 
              initialData={combinedData} 
              onSuccess={() => { setEditModalOpen(false); fetchData(); }} 
              onCancel={() => setEditModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${user.email}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminUserDetail;