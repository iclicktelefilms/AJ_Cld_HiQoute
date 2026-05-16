import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Home } from 'lucide-react';

import AdminPlansPage from './AdminPlansPage';
import AdminUsersPage from './AdminUsersPage';
import AdminAnalyticsPage from './AdminAnalyticsPage';

const AdminDashboard = () => {
  const { isDirectLogin, switchBackToAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('users');

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const handleSwitchBack = () => {
    switchBackToAdmin();
    navigate('/admin');
  };

  return (
    <div className="min-h-[100dvh] bg-[#f9f9f9] pb-24 md:pb-12">
      <Helmet>
        <title>Admin Dashboard - Pixora</title>
      </Helmet>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 hover:bg-muted rounded-full transition-colors -ml-2"
              aria-label="Go to Home"
            >
              <Home className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isDirectLogin && (
              <button 
                onClick={handleSwitchBack}
                className="bg-destructive text-destructive-foreground px-4 py-2 rounded-xl font-bold hover:bg-destructive/90 transition-colors min-h-[44px] flex-1 sm:flex-none"
              >
                Back to Admin
              </button>
            )}
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-foreground" />
              <span className="text-sm font-bold hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        <div className="bg-card border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide bg-muted/30">
              <TabsList className="h-14 bg-transparent p-0 flex w-max min-w-full px-2">
                <TabsTrigger 
                  value="users" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-4 md:px-6 font-bold text-muted-foreground transition-colors min-h-[56px]"
                >
                  Users
                </TabsTrigger>
                <TabsTrigger 
                  value="plans" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-4 md:px-6 font-bold text-muted-foreground transition-colors min-h-[56px]"
                >
                  Plans
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-4 md:px-6 font-bold text-muted-foreground transition-colors min-h-[56px]"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-4 md:p-6">
              <TabsContent value="users" className="m-0 outline-none">
                <AdminUsersPage />
              </TabsContent>
              <TabsContent value="plans" className="m-0 outline-none">
                <AdminPlansPage />
              </TabsContent>
              <TabsContent value="analytics" className="m-0 outline-none">
                <AdminAnalyticsPage />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;