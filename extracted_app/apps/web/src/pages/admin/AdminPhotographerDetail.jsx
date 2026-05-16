import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

const AdminPhotographerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photographer, setPhotographer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotographerDetails();
  }, [id]);

  const fetchPhotographerDetails = async () => {
    try {
      const record = await pb.collection('users').getOne(id, { $autoCancel: false });
      setPhotographer(record);
    } catch (error) {
      console.error('Error fetching photographer details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#ff3131] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] p-8 text-center">
        <p className="text-[#666666]">Photographer not found.</p>
        <button onClick={() => navigate('/admin-dashboard')} className="mt-4 text-[#ff3131] hover:underline">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-20">
      <Helmet>
        <title>{photographer.name || 'Photographer'} - Admin</title>
      </Helmet>

      <header className="bg-white border-b border-[#e0e0e0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <h1 className="text-lg font-bold text-black">Photographer Profile</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 bg-[#f5f5f5] rounded-full flex items-center justify-center text-3xl font-bold text-[#ff3131] border border-[#e0e0e0] flex-shrink-0">
              {(photographer.name || photographer.email || 'U').charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-black">{photographer.name || photographer.full_name || 'Unnamed Photographer'}</h2>
                <p className="text-sm text-[#666666]">Joined {new Date(photographer.created).toLocaleDateString()}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <Mail className="w-4 h-4" />
                  <span>{photographer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <Phone className="w-4 h-4" />
                  <span>{photographer.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <Briefcase className="w-4 h-4" />
                  <span>{photographer.business_name || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <MapPin className="w-4 h-4" />
                  <span>{photographer.location || 'Not provided'}</span>
                </div>
              </div>
              
              {photographer.bio && (
                <div className="pt-4 border-t border-[#e0e0e0]">
                  <h3 className="text-sm font-bold text-black mb-2">Bio</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{photographer.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-xl p-6 shadow-sm text-center">
          <p className="text-[#666666] text-sm">Detailed analytics and related records view coming soon.</p>
        </div>
      </main>
    </div>
  );
};

export default AdminPhotographerDetail;