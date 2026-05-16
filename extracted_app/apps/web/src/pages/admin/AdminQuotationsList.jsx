import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Search } from 'lucide-react';
import { formatINR } from '@/lib/currencyUtils';

const AdminQuotationsList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const records = await pb.collection('quotations').getFullList({
        sort: '-created',
        expand: 'customer',
        $autoCancel: false
      });
      setQuotations(records);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-[#D4EDDA] text-[#10b981]';
      case 'rejected': return 'bg-[#F8D7DA] text-[#ff3131]';
      case 'pending':
      case 'sent': return 'bg-[#D1ECF1] text-[#3b82f6]';
      case 'cancelled': return 'bg-[#E8E8E8] text-[#6b7280]';
      default: return 'bg-[#E8E8E8] text-[#6b7280]';
    }
  };

  const filteredQuotations = quotations.filter(q => 
    (q.quotationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.expand?.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="py-12 text-center text-[#666666]">Loading quotations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-black">All Quotations</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input 
            type="text" 
            placeholder="Search quotations..." 
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
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Quotation #</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Customer</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Amount</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-[#666666] uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-[#666666] text-sm">No quotations found.</td>
              </tr>
            ) : (
              filteredQuotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-[#fcfcfc] transition-colors">
                  <td className="p-4 font-medium text-black text-sm">{quotation.quotationNumber}</td>
                  <td className="p-4 text-sm text-[#666666]">{quotation.expand?.customer?.name || 'Unknown'}</td>
                  <td className="p-4 text-sm font-bold text-[#ff3131]">{formatINR(quotation.totalAmount)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(quotation.status)}`}>
                      {quotation.status || 'draft'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[#666666]">{new Date(quotation.created).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminQuotationsList;