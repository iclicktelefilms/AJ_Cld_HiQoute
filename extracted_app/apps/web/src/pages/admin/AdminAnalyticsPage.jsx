import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Users, Package, Activity, DollarSign, TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

const AdminAnalyticsPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeUsers7d: 0,
    activeUsers30d: 0,
    totalRevenue: 0,
    conversionRate: 0,
    mostPopularPlan: 'None',
    totalQuotations: 0,
    avgQuotationsPerUser: 0,
    avgQuotationValue: 0
  });
  
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, plansRes, quotesRes] = await Promise.all([
        pb.collection('users').getFullList({ expand: 'plan_id', $autoCancel: false }),
        pb.collection('plans').getFullList({ $autoCancel: false }),
        pb.collection('quotations').getFullList({ $autoCancel: false })
      ]);

      setUsers(usersRes);
      setPlans(plansRes);
      setQuotations(quotesRes);

      const now = new Date();
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
      const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const activeUsers7d = usersRes.filter(u => new Date(u.updated) > sevenDaysAgo).length;
      const activeUsers30d = usersRes.filter(u => new Date(u.updated) > thirtyDaysAgo).length;
      const newUsersThisMonth = usersRes.filter(u => new Date(u.created) > firstDayOfMonth).length;

      // Revenue & Plans
      const planCounts = {};
      let revenue = 0;
      let paidUsers = 0;

      usersRes.forEach(u => {
        const plan = u.expand?.plan_id;
        if (plan) {
          planCounts[plan.name] = (planCounts[plan.name] || 0) + 1;
          if (plan.price > 0) {
            revenue += plan.price;
            paidUsers++;
          }
        }
      });

      let mostPopular = 'None';
      let maxCount = 0;
      Object.entries(planCounts).forEach(([name, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostPopular = name;
        }
      });

      const conversionRate = usersRes.length > 0 ? ((paidUsers / usersRes.length) * 100).toFixed(1) : 0;

      // Quotations
      const acceptedQuotes = quotesRes.filter(q => q.status === 'accepted');
      const totalQuoteValue = acceptedQuotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
      const avgQuoteValue = acceptedQuotes.length > 0 ? totalQuoteValue / acceptedQuotes.length : 0;
      const avgQuotesPerUser = usersRes.length > 0 ? quotesRes.length / usersRes.length : 0;

      setStats({
        totalUsers: usersRes.length,
        newUsersThisMonth,
        activeUsers7d,
        activeUsers30d,
        totalRevenue: revenue,
        conversionRate,
        mostPopularPlan: mostPopular,
        totalQuotations: quotesRes.length,
        avgQuotationsPerUser: avgQuotesPerUser.toFixed(1),
        avgQuotationValue: avgQuoteValue
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-[#666666]">Loading analytics...</div>;
  }

  // Process data for Plan Distribution Bar Chart
  const planCounts = users.reduce((acc, u) => {
    const planName = u.expand?.plan_id?.name || 'No Plan';
    acc[planName] = (acc[planName] || 0) + 1;
    return acc;
  }, {});

  const planBarData = Object.keys(planCounts).map(name => ({
    name,
    users: planCounts[name]
  })).sort((a, b) => b.users - a.users);

  // Process data for User Growth Line Chart (last 6 months)
  const monthlyGrowth = users.reduce((acc, u) => {
    const date = new Date(u.created);
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!acc[month]) acc[month] = { name: month, users: 0, timestamp: date.getTime() };
    acc[month].users += 1;
    return acc;
  }, {});
  
  const growthData = Object.values(monthlyGrowth)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-6);

  // Process data for Quotation Status
  const quoteStatusCounts = quotations.reduce((acc, q) => {
    const status = q.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const quoteStatusData = [
    { name: 'Accepted', value: quoteStatusCounts.accepted || 0, fill: '#10b981' },
    { name: 'Pending/Sent', value: (quoteStatusCounts.pending || 0) + (quoteStatusCounts.sent || 0), fill: '#3b82f6' },
    { name: 'Draft', value: quoteStatusCounts.draft || 0, fill: '#f59e0b' },
    { name: 'Rejected', value: quoteStatusCounts.rejected || 0, fill: '#ff3131' },
    { name: 'Cancelled', value: quoteStatusCounts.cancelled || 0, fill: '#6b7280' }
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ff3131'];

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Section */}
      <div>
        <h2 className="text-lg font-bold text-black mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-[#666666]">Total Users</h3>
              <div className="p-2 bg-[#eff6ff] rounded-xl">
                <Users className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black">{stats.totalUsers}</div>
            <p className="text-xs text-[#10b981] font-medium mt-2">+{stats.newUsersThisMonth} this month</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-[#666666]">Active Users (30d)</h3>
              <div className="p-2 bg-[#d1fae5] rounded-xl">
                <Activity className="w-5 h-5 text-[#10b981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black">{stats.activeUsers30d}</div>
            <p className="text-xs text-[#666666] font-medium mt-2">{stats.activeUsers7d} active in last 7 days</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-[#666666]">Plan Revenue</h3>
              <div className="p-2 bg-[#fff0f0] rounded-xl">
                <DollarSign className="w-5 h-5 text-[#ff3131]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#ff3131]">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-[#666666] font-medium mt-2">{stats.conversionRate}% conversion rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-[#666666]">Total Quotations</h3>
              <div className="p-2 bg-[#fef3c7] rounded-xl">
                <FileText className="w-5 h-5 text-[#f59e0b]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black">{stats.totalQuotations}</div>
            <p className="text-xs text-[#666666] font-medium mt-2">Avg {stats.avgQuotationsPerUser} per user</p>
          </div>
        </div>
      </div>

      {/* User & Plan Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-black mb-6">User Growth (Last 6 Months)</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="users" stroke="#ff3131" strokeWidth={3} dot={{ r: 4, fill: '#ff3131', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-black">Users by Plan</h3>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Popular: {stats.mostPopularPlan}</span>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} width={100} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0' }} />
                <Bar dataKey="users" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                  {planBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quotation Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:col-span-2">
          <h3 className="text-base font-bold text-black mb-6">Quotation Status Breakdown</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quoteStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {quoteStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-black mb-6">Quotation Insights</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-[#666666] font-medium mb-1">Avg. Accepted Value</p>
                <p className="text-2xl font-bold text-[#10b981]">₹{stats.avgQuotationValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="h-px bg-gray-100 w-full"></div>
              <div>
                <p className="text-sm text-[#666666] font-medium mb-1">Total Quotations Created</p>
                <p className="text-2xl font-bold text-black">{stats.totalQuotations}</p>
              </div>
              <div className="h-px bg-gray-100 w-full"></div>
              <div>
                <p className="text-sm text-[#666666] font-medium mb-1">Acceptance Rate</p>
                <p className="text-2xl font-bold text-[#3b82f6]">
                  {stats.totalQuotations > 0 
                    ? ((quoteStatusCounts.accepted || 0) / stats.totalQuotations * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-[#ff3131] shrink-0 mt-0.5" />
            <p className="text-xs text-[#666666] leading-relaxed">
              Monitor these metrics to understand platform engagement. Higher acceptance rates indicate better package pricing and presentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;