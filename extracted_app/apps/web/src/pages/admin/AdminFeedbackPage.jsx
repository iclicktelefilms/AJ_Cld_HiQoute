import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Search, Eye, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const AdminFeedbackPage = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const records = await pb.collection('feedback').getFullList({
        sort: '-created_at',
        expand: 'userId',
        $autoCancel: false
      });
      setFeedback(records);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (item) => {
    setSelectedFeedback(item);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedFeedback(null);
  };

  const filteredFeedback = feedback.filter(f => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(searchLower) ||
      (f.email || '').toLowerCase().includes(searchLower) ||
      (f.message || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading feedback...</div>;
  }

  if (viewMode === 'detail' && selectedFeedback) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Back to Feedback List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback Details</h1>
            <p className="text-sm text-muted-foreground">Reviewing submission from {selectedFeedback.name}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Submitted By</p>
              <p className="text-base font-medium text-foreground">{selectedFeedback.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Date</p>
              <p className="text-base font-medium text-foreground">
                {new Date(selectedFeedback.created_at || selectedFeedback.created).toLocaleString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Address</p>
              <p className="text-base font-medium text-foreground">{selectedFeedback.email}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Message</p>
            <div className="bg-muted/30 border border-border rounded-xl p-5 text-base text-foreground whitespace-pre-wrap leading-relaxed">
              {selectedFeedback.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Feedback</h1>
          <p className="text-sm text-muted-foreground">View and manage feedback submitted by users.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search feedback..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card text-foreground border border-border rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block admin-table-container border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Message Preview</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredFeedback.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-12 text-center">
                  <MessageSquare className="w-8 h-8 text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No feedback found.</p>
                  <p className="text-xs text-muted-foreground mt-1">When users submit feedback, it will appear here.</p>
                </td>
              </tr>
            ) : (
              filteredFeedback.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleViewFeedback(item)}>
                  <td className="p-4">
                    <div className="font-bold text-foreground">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-foreground max-w-md truncate">
                      {item.message}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(item.created_at || item.created).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleViewFeedback(item); }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredFeedback.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            <MessageSquare className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No feedback found.</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div 
              key={item.id} 
              className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col gap-3 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleViewFeedback(item)}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-foreground text-base truncate">{item.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{item.email}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(item.created_at || item.created).toLocaleDateString()}
                </div>
              </div>
              
              <div className="text-sm text-foreground bg-muted/30 p-3 rounded-xl border border-border/50 line-clamp-3">
                {item.message}
              </div>
              
              <div className="flex justify-end pt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleViewFeedback(item); }}
                  className="py-2 px-4 text-primary bg-primary/10 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm w-full"
                >
                  <Eye className="w-4 h-4" /> View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackPage;