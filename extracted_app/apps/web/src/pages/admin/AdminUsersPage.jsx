import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Edit2, Eye, LogIn, Zap, Trash2, Mail, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from '@/components/admin/UserForm';
import ConfirmDialog from '@/components/m3/ConfirmDialog';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { directLoginAsUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await pb.collection('users').getFullList({
        sort: '-created',
        expand: 'plan_id',
        $autoCancel: false
      });
      setUsers(usersRes);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load users data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await pb.collection('users').delete(userToDelete.id, { $autoCancel: false });
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleDirectLogin = async (userId) => {
    const result = await directLoginAsUser(userId);
    if (result.success) {
      toast.success('Logged in as user');
      navigate('/dashboard');
    } else {
      toast.error('Failed to login as user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.phone || '').includes(searchQuery);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="py-12 text-center text-[#666666]">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-black border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-[#ff3131] focus:ring-1 focus:ring-[#ff3131] text-base sm:text-sm min-h-[44px]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white text-black border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-[#ff3131] text-base sm:text-sm min-h-[44px] w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="photographer">Photographers</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#ff3131] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#ff1a1a] transition-colors whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block admin-table-container border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-[#f9f9f9]">
              <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider">User</th>
              <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider">Contact Info</th>
              <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider">Role & Status</th>
              <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider">Plan</th>
              <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-[#666666] text-sm">No users found.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#fcfcfc] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-black">{user.name || user.full_name || 'Unnamed'}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-sm text-[#666666]">
                      <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> <span className="truncate max-w-[150px]">{user.email}</span></div>
                      {user.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {user.phone}</div>}
                      {user.business_name && <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> <span className="truncate max-w-[150px]">{user.business_name}</span></div>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'super_admin' ? 'bg-[#E8E8E8] text-[#000000]' : 'bg-[#eff6ff] text-[#3b82f6]'}`}>
                        {user.role || 'photographer'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.status === 'inactive' ? 'bg-[#F8D7DA] text-[#ff3131]' : 'bg-[#D4EDDA] text-[#10b981]'}`}>
                        {user.status || 'active'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.expand?.plan_id ? (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-black">
                        <Zap className="w-4 h-4 text-[#ff3131]" />
                        {user.expand.plan_id.name}
                      </div>
                    ) : (
                      <span className="text-sm text-[#999999] italic">No Plan</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDirectLogin(user.id)}
                        className="p-2 text-[#10b981] hover:bg-[#d1fae5] rounded-lg transition-colors"
                        title="Login As User"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="p-2 text-[#666666] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-[#3b82f6] hover:bg-[#eff6ff] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }}
                        className="p-2 text-[#ff3131] hover:bg-[#F8D7DA] rounded-lg transition-colors"
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
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-[#666666] bg-white rounded-2xl border border-gray-200">No users found.</div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-black text-base truncate">{user.name || user.full_name || 'Unnamed'}</div>
                  <div className="text-sm text-[#666666] mt-1 space-y-1">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> <span className="truncate">{user.email}</span></div>
                    {user.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {user.phone}</div>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'super_admin' ? 'bg-[#E8E8E8] text-[#000000]' : 'bg-[#eff6ff] text-[#3b82f6]'}`}>
                    {user.role || 'photographer'}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.status === 'inactive' ? 'bg-[#F8D7DA] text-[#ff3131]' : 'bg-[#D4EDDA] text-[#10b981]'}`}>
                    {user.status || 'active'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-[#e0e0e0]">
                <div className="text-sm font-bold text-black flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#ff3131]" />
                  {user.expand?.plan_id?.name || 'No Plan'}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleDirectLogin(user.id)}
                    className="p-2.5 text-[#10b981] bg-[#d1fae5] rounded-xl transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="p-2.5 text-[#666666] bg-[#f5f5f5] rounded-xl transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(user)}
                    className="p-2.5 text-[#3b82f6] bg-[#eff6ff] rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }}
                    className="p-2.5 text-[#ff3131] bg-[#F8D7DA] rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[95vw] max-w-[600px] bg-white border-[#e0e0e0] rounded-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-black">
              {selectedUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-4">
            <UserForm 
              initialData={selectedUser} 
              onSuccess={() => { setModalOpen(false); fetchData(); }} 
              onCancel={() => setModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.name || userToDelete?.email}? This action cannot be undone.`}
        onConfirm={handleDeleteUser}
        confirmText="Delete User"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminUsersPage;