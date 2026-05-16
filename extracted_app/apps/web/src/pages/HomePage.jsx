import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AppButton from '@/components/m3/AppButton';
import { FilePlus } from 'lucide-react';
import Footer from '@/components/Footer';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-[#f5f5f5]">
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-4 tracking-tight text-center">
          Welcome to Pixora Studio
        </h1>
        <p className="text-[#666666] text-center max-w-md mb-8">
          Manage your photography business, quotations, and customers seamlessly.
        </p>
        
        <AppButton 
          variant="filled" 
          className="mb-8 px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
          onClick={() => navigate('/quotations/create')}
        >
          <FilePlus className="w-5 h-5 mr-2" />
          Create Quotation
        </AppButton>

        {/* Redirect to dashboard for authenticated users if this is the root route */}
        <Navigate to="/dashboard" replace />
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;