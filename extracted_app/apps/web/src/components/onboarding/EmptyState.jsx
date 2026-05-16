import React from 'react';
import { FileText, Plus } from 'lucide-react';

const EmptyState = ({ onCreateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-[#f3f4f6] shadow-sm">
      <div className="w-16 h-16 bg-[#f9f9f9] rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-[#6b7280]" />
      </div>
      <h3 className="text-xl font-bold text-black mb-2">No quotations yet</h3>
      <p className="text-[#6b7280] mb-8 max-w-sm">
        Create your first quotation to get started. It only takes a minute to create and share professional quotes with your clients.
      </p>
      <button 
        onClick={onCreateClick}
        className="bg-[#ff3131] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#e62c2c] transition-all active:scale-[0.98] flex items-center gap-2 shadow-sm"
      >
        <Plus className="w-5 h-5" /> Create Your First Quotation
      </button>
    </div>
  );
};

export default EmptyState;