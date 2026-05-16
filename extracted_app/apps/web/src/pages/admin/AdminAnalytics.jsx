import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const AdminAnalytics = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const records = await pb.collection('quotations').getFullList({
        $autoCancel: false
      });
      setQuotations(records);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-[#666666]">Loading analytics...</div>;

  // Process data for Pie Chart (Status)
  const statusCounts = quotations.reduce((acc, q) => {
    const status = q.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: 'Accepted', value: statusCounts.accepted || 0, color: '#10b981' },
    { name: 'Rejected', value: statusCounts.rejected || 0, color: '#ff3131' },
    { name: 'Pending', value: (statusCounts.pending || 0) + (statusCounts.sent || 0), color: '#3b82f6' },
    { name: 'Cancelled', value: statusCounts.cancelled || 0, color: '#6b7280' },
  ].filter(d => d.value > 0);

  // Process data for Bar Chart (Monthly)
  const monthlyData = quotations.reduce((acc, q) => {
    const date = new Date(q.created);
    const month = date.toLocaleString('default', { month: 'short' });
    if (!acc[month]) acc[month] = { name: month, count: 0, revenue: 0 };
    acc[month].count += 1;
    if (q.status === 'accepted') {
      acc[month].revenue += (q.totalAmount || 0);
    }
    return acc;
  }, {});

  const barData = Object.values(monthlyData);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-black">Platform Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="admin-card flex flex-col">
          <h3 className="text-sm font-bold text-black mb-4">Quotations by Status</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="admin-card flex flex-col">
          <h3 className="text-sm font-bold text-black mb-4">Quotations Created (Monthly)</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="count" fill="#ff3131" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;