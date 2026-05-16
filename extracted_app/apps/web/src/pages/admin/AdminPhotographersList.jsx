import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Search, Eye, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminPhotographersList = () => {
  const navigate = useNavigate();
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);

  useEffect(() => {
    fetchPhotographers();
  }, []);

  const fetchPhotographers = async () => {
    try {
      const records = await pb.collection('users').getFullList({
        filter: 'role = "photographer"',
        sort: '-created',
        $autoCancel: false
      });
      setPhotographers(records);
    } catch (error) {
      console.error('Error fetching photographers:', error);
      toast.error('Failed to load photographers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('users').delete(selectedPhotographer.id, { $autoCancel: false });
      toast.success('Photographer deleted successfully');
      setDeleteDialogOpen(false);
      fetchPhotographers();
    } catch (error) {
      toast.error('Failed to delete photographer');
    }
  };

  const filteredPhotographers = photographers.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="py-12 text-center text-[#666666]">Loading photographers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-black">All Photographers</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-black border border-[#e0e0e0] rounded-lg py-2 pl-9 pr-4 outline-none focus:border-[#ff3131] focus:ring-1 focus:ring-[#ff3131] text-sm"
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#f9f9f9]">
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Phone</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Joined</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {filteredPhotographers.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-[#666666] text-sm">No photographers found.</td>
              </tr>
            ) : (
              filteredPhotographers.map((photographer) => (
                <tr key={photographer.id} className="hover:bg-[#fcfcfc] transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-black">{photographer.name || photographer.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-[#666666]">{photographer.business_name}</div>
                  </td>
                  <td className="p-4 text-sm text-[#666666]">{photographer.email}</td>
                  <td className="p-4 text-sm text-[#666666]">{photographer.phone || '-'}</td>
                  <td className="p-4 text-sm text-[#666666]">{new Date(photographer.created).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors outline-none">
                          <MoreVertical className="w-4 h-4 text-[#666666]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-white border border-[#e0e0e0] rounded-lg shadow-md">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/admin-photographer/${photographer.id}`)}
                          className="text-xs text-black px-3 py-2 hover:bg-[#f5f5f5] cursor-pointer flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedPhotographer(photographer);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-xs text-[#ff3131] px-3 py-2 hover:bg-[#fff0f0] cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Photographer"
        description={`Are you sure you want to delete ${selectedPhotographer?.name || 'this photographer'}? This will permanently remove their account and all associated data.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminPhotographersList;