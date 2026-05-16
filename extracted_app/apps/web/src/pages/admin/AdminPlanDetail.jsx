import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import { formatINR } from '@/lib/currencyUtils';

const AdminPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchPlanDetails();
  }, [id]);

  const fetchPlanDetails = async () => {
    try {
      const record = await pb.collection('plans').getOne(id, { $autoCancel: false });
      setPlan(record);
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast.error('Plan not found');
      navigate('/admin/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('plans').delete(plan.id, { $autoCancel: false });
      toast.success('Plan deleted successfully');
      navigate('/admin/plans');
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">Loading...</div>;
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-20">
      <Helmet>
        <title>{plan.name || 'Plan'} - Admin</title>
      </Helmet>

      <header className="bg-white border-b border-[#e0e0e0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/plans')}
              className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h1 className="text-lg font-bold text-black">Plan Details</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setDeleteDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#fff0f0] text-[#ff3131] rounded-lg text-sm font-bold hover:bg-[#fee2e2] transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black">{plan.name}</h2>
              <span className={`inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${plan.status === 'active' ? 'bg-[#D4EDDA] text-[#10b981]' : 'bg-[#E8E8E8] text-[#6b7280]'}`}>
                {plan.status || 'inactive'}
              </span>
            </div>
            <div className="text-2xl font-bold text-[#ff3131]">
              {formatINR(plan.price)}
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-[#e0e0e0]">
            <div>
              <h3 className="text-sm font-bold text-black mb-2">Description</h3>
              <p className="text-sm text-[#666666]">{plan.description || 'No description provided.'}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-black mb-2">Features</h3>
              {plan.features ? (
                <ul className="list-disc list-inside text-sm text-[#666666] space-y-1 pl-4">
                  {plan.features.split(',').map((feature, index) => (
                    <li key={index}>{feature.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#666666]">No features listed.</p>
              )}
            </div>

            <div className="text-xs text-[#999999] pt-4">
              Created: {new Date(plan.created).toLocaleString()}
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Plan"
        description={`Are you sure you want to delete ${plan.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminPlanDetail;