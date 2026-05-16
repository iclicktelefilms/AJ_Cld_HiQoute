import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Search, Plus, Edit2, Eye, Trash2, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '@/lib/currencyUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlanForm from '@/components/admin/PlanForm';
import ConfirmDialog from '@/components/m3/ConfirmDialog';

const AdminPlansPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  useEffect(() => {
    fetchPlans(true);
  }, []);

  const fetchPlans = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const records = await pb.collection('plans').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setPlans(records);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedPlan(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      await pb.collection('plans').delete(planToDelete.id, { $autoCancel: false });
      toast.success('Plan deleted successfully');
      setDeleteDialogOpen(false);
      fetchPlans(false);
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const filteredPlans = plans.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="py-12 text-center text-[#666666]">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Manage Plans</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input 
            type="text" 
            placeholder="Search plans..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-black border border-gray-200 rounded-lg py-2 pl-9 pr-4 outline-none focus:border-[#ff3131] focus:ring-1 focus:ring-[#ff3131] text-sm"
          />
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#ff3131] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#ff1a1a] transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add New Plan
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block admin-table-container border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-[#f9f9f9]">
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Plan Name</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Price</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-[#666666] text-sm">No plans found.</td>
              </tr>
            ) : (
              filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-[#fcfcfc] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">{plan.name}</span>
                      {plan.is_default && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#666666] truncate max-w-[200px] mt-1">{plan.description || 'No description'}</div>
                  </td>
                  <td className="p-4 text-sm font-bold text-black">{formatINR(plan.price)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${plan.status === 'active' ? 'bg-[#D4EDDA] text-[#10b981]' : 'bg-[#E8E8E8] text-[#6b7280]'}`}>
                      {plan.status || 'inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/plans/${plan.id}`)}
                        className="p-2 text-[#666666] hover:bg-[#f5f5f5] rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(plan)}
                        className="p-2 text-[#3b82f6] hover:bg-[#eff6ff] rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setPlanToDelete(plan); setDeleteDialogOpen(true); }}
                        className="p-2 text-[#ff3131] hover:bg-[#F8D7DA] rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredPlans.length === 0 ? (
          <div className="p-8 text-center text-[#666666] bg-white rounded-2xl border border-gray-200">No plans found.</div>
        ) : (
          filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-black text-lg truncate">{plan.name}</div>
                    {plan.is_default && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-extrabold text-[#ff3131] mt-1">{formatINR(plan.price)}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${plan.status === 'active' ? 'bg-[#D4EDDA] text-[#10b981]' : 'bg-[#E8E8E8] text-[#6b7280]'}`}>
                  {plan.status || 'inactive'}
                </span>
              </div>
              
              <div className="text-sm text-[#666666] bg-gray-50 p-3 rounded-xl border border-gray-100">
                {plan.description || 'No description provided.'}
              </div>

              {plan.features && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-black uppercase tracking-wider">Features</p>
                  <div className="flex flex-col gap-1">
                    {plan.features.split(',').slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-sm text-[#666666]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                        <span className="truncate">{f.trim()}</span>
                      </div>
                    ))}
                    {plan.features.split(',').length > 3 && (
                      <div className="text-xs text-[#3b82f6] font-medium pl-5">
                        +{plan.features.split(',').length - 3} more features
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e0e0e0]">
                <button 
                  onClick={() => navigate(`/admin/plans/${plan.id}`)}
                  className="flex-1 py-2.5 text-[#666666] bg-[#f5f5f5] rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button 
                  onClick={() => handleOpenEdit(plan)}
                  className="flex-1 py-2.5 text-[#3b82f6] bg-[#eff6ff] rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => { setPlanToDelete(plan); setDeleteDialogOpen(true); }}
                  className="p-2.5 text-[#ff3131] bg-[#F8D7DA] rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-gray-200 rounded-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200 shrink-0">
            <DialogTitle className="text-xl font-bold text-black">
              {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 p-6">
            <PlanForm 
              initialData={selectedPlan} 
              onSuccess={() => { setModalOpen(false); fetchPlans(false); }} 
              onCancel={() => setModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Plan"
        description={`Are you sure you want to delete ${planToDelete?.name}? This action cannot be undone.`}
        onConfirm={handleDeletePlan}
        confirmText="Delete Plan"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminPlansPage;