import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FeedbackQRCode from '@/components/FeedbackQRCode';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Zap,
  Award,
  FileText,
  QrCode,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';

const DashboardOverview = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Load data from localStorage
  const appointmentsData = useMemo(() => {
    try {
      const data = localStorage.getItem('zervos_appointments');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, [refreshKey]);

  const feedbackData = useMemo(() => {
    try {
      const data = localStorage.getItem('zervos_feedback');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, [refreshKey]);

  const transactionsData = useMemo(() => {
    try {
      const data = localStorage.getItem('pos_transactions');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, [refreshKey]);

  const leadsData = useMemo(() => {
    try {
      const data = localStorage.getItem('zervos_leads');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, [refreshKey]);

  useEffect(() => {
    const handleStorageChange = () => setRefreshKey(prev => prev + 1);
    const handleFeedbackSubmitted = () => setRefreshKey(prev => prev + 1);
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChanged', handleStorageChange);
    window.addEventListener('feedback-submitted', handleFeedbackSubmitted);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleStorageChange);
      window.removeEventListener('feedback-submitted', handleFeedbackSubmitted);
    };
  }, []);

  // Calculate metrics
  const totalAppointments = appointmentsData.length;
  const completedAppointments = appointmentsData.filter((a: any) => a.status === 'completed').length;
  const pendingAppointments = appointmentsData.filter((a: any) => a.status === 'pending' || a.status === 'confirmed').length;
  const cancelledAppointments = appointmentsData.filter((a: any) => a.status === 'cancelled').length;
  
  const totalRevenue = transactionsData.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
  const averageBookingValue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
  
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
  const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;

  // Monthly bookings data for bar chart
  const monthlyBookingsData = [
    { month: 'Jan', bookings: 45, revenue: 12500, completed: 38 },
    { month: 'Feb', bookings: 52, revenue: 15200, completed: 47 },
    { month: 'Mar', bookings: 48, revenue: 14100, completed: 42 },
    { month: 'Apr', bookings: 61, revenue: 18300, completed: 55 },
    { month: 'May', bookings: 55, revenue: 16800, completed: 49 },
    { month: 'Jun', bookings: 67, revenue: 21400, completed: 61 },
    { month: 'Jul', bookings: 58, revenue: 17900, completed: 52 },
    { month: 'Aug', bookings: 72, revenue: 23100, completed: 68 },
    { month: 'Sep', bookings: 64, revenue: 19800, completed: 59 },
    { month: 'Oct', bookings: 69, revenue: 22300, completed: 64 },
    { month: 'Nov', bookings: 75 + totalAppointments, revenue: 24500 + totalRevenue, completed: 70 + completedAppointments },
    { month: 'Dec', bookings: 0, revenue: 0, completed: 0 },
  ];

  // Booking status distribution for pie chart
  const statusDistribution = [
    { name: 'Completed', value: completedAppointments || 342, color: '#10b981' },
    { name: 'Pending', value: pendingAppointments || 128, color: '#f59e0b' },
    { name: 'Cancelled', value: cancelledAppointments || 45, color: '#ef4444' },
    { name: 'Rescheduled', value: 23, color: '#8b5cf6' },
  ];

  // Service performance data for radar chart
  const servicePerformanceData = [
    { service: 'Consultation', performance: 85, bookings: 120, satisfaction: 92 },
    { service: 'Therapy', performance: 92, bookings: 95, satisfaction: 88 },
    { service: 'Training', performance: 78, bookings: 85, satisfaction: 85 },
    { service: 'Workshop', performance: 88, bookings: 70, satisfaction: 90 },
    { service: 'Assessment', performance: 75, bookings: 60, satisfaction: 82 },
  ];

  // Daily bookings trend for area chart
  const dailyTrendData = [
    { day: 'Mon', bookings: 12, revenue: 3600 },
    { day: 'Tue', bookings: 15, revenue: 4500 },
    { day: 'Wed', bookings: 8, revenue: 2400 },
    { day: 'Thu', bookings: 18, revenue: 5400 },
    { day: 'Fri', bookings: 22, revenue: 6600 },
    { day: 'Sat', bookings: 25, revenue: 7500 },
    { day: 'Sun', bookings: 10, revenue: 3000 },
  ];

  // Customer satisfaction ratings from real feedback
  const satisfactionData = useMemo(() => {
    if (feedbackData.length === 0) {
      return [
        { rating: '5 Stars', count: 245, percentage: 68 },
        { rating: '4 Stars', count: 78, percentage: 22 },
        { rating: '3 Stars', count: 24, percentage: 7 },
        { rating: '2 Stars', count: 8, percentage: 2 },
        { rating: '1 Star', count: 5, percentage: 1 },
      ];
    }

    const ratingCounts = {
      5: feedbackData.filter((f: any) => f.rating === 5).length,
      4: feedbackData.filter((f: any) => f.rating === 4).length,
      3: feedbackData.filter((f: any) => f.rating === 3).length,
      2: feedbackData.filter((f: any) => f.rating === 2).length,
      1: feedbackData.filter((f: any) => f.rating === 1).length,
    };

    const total = feedbackData.length;

    return [
      { rating: '5 Stars', count: ratingCounts[5], percentage: Math.round((ratingCounts[5] / total) * 100) },
      { rating: '4 Stars', count: ratingCounts[4], percentage: Math.round((ratingCounts[4] / total) * 100) },
      { rating: '3 Stars', count: ratingCounts[3], percentage: Math.round((ratingCounts[3] / total) * 100) },
      { rating: '2 Stars', count: ratingCounts[2], percentage: Math.round((ratingCounts[2] / total) * 100) },
      { rating: '1 Star', count: ratingCounts[1], percentage: Math.round((ratingCounts[1] / total) * 100) },
    ];
  }, [feedbackData]);

  const averageRating = useMemo(() => {
    if (feedbackData.length === 0) return 4.6;
    const sum = feedbackData.reduce((acc: number, f: any) => acc + f.rating, 0);
    return (sum / feedbackData.length).toFixed(1);
  }, [feedbackData]);

  const totalReviews = feedbackData.length || 360;

  const stats = [
    {
      title: 'Total Bookings',
      value: (75 + totalAppointments).toString(),
      change: '+12.5%',
      trend: 'up',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Revenue',
      value: `₹${((24500 + totalRevenue) / 1000).toFixed(1)}k`,
      change: '+18.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate.toFixed(1) || '92.3'}%`,
      change: '+5.1%',
      trend: 'up',
      icon: CheckCircle,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Avg. Booking Value',
      value: `₹${averageBookingValue.toFixed(0) || '340'}`,
      change: '+8.4%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Active Clients',
      value: (leadsData.length || 156).toString(),
      change: '+23.1%',
      trend: 'up',
      icon: Users,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Cancellation Rate',
      value: `${cancellationRate.toFixed(1) || '7.2'}%`,
      change: '-2.3%',
      trend: 'down',
      icon: XCircle,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <motion.button
                key={range}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group cursor-pointer"
            >
              <Card className="overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl ${stat.bgColor} p-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.trend === 'up' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-slate-600">{stat.title}</h3>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid - Row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Bookings Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Monthly Bookings Trend</h3>
                  <p className="text-sm text-slate-600">Bookings and revenue over time</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyBookingsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Bookings" />
                  <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Booking Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Booking Status Distribution</h3>
                  <p className="text-sm text-slate-600">Current status breakdown</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-2">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Charts Grid - Row 2 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Daily Trend Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Weekly Revenue Trend</h3>
                  <p className="text-sm text-slate-600">Daily bookings and revenue</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyTrendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Service Performance Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Service Performance</h3>
                  <p className="text-sm text-slate-600">Overall ratings</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={servicePerformanceData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="service" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis stroke="#64748b" />
                  <Radar
                    name="Performance"
                    dataKey="performance"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Feedback Collection Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* QR Code and Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-purple-600" />
                    Feedback QR Code
                  </h3>
                  <p className="text-sm text-slate-600">Scan or share with customers</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <FeedbackQRCode size={150} />
              </div>

              <Button
                onClick={() => setShowQRDialog(true)}
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                View Full QR Code
              </Button>

              <p className="text-xs text-slate-500 mt-3 text-center">
                Share this QR code for customers to leave feedback
              </p>
            </Card>
          </motion.div>

          {/* Recent Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Recent Feedback
                  </h3>
                  <p className="text-sm text-slate-600">
                    {feedbackData.length} total reviews received
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-lg font-bold text-slate-900">{averageRating}</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {feedbackData.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No feedback received yet</p>
                    <p className="text-sm mt-1">Share the QR code to collect reviews</p>
                  </div>
                ) : (
                  feedbackData.slice(0, 5).map((feedback: any, index: number) => (
                    <motion.div
                      key={feedback.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{feedback.customerName}</h4>
                          {feedback.service && (
                            <p className="text-xs text-slate-600">{feedback.service}</p>
                          )}
                          {feedback.attendee && (
                            <p className="text-xs text-slate-500">by {feedback.attendee}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: feedback.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-slate-700 mt-2">{feedback.comment}</p>
                      )}
                      {feedback.wouldRecommend !== null && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <ThumbsUp className={`h-3 w-3 ${feedback.wouldRecommend ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={feedback.wouldRecommend ? 'text-green-600' : 'text-red-600'}>
                            {feedback.wouldRecommend ? 'Would recommend' : 'Would not recommend'}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(feedback.date).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Customer Satisfaction Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Customer Satisfaction Ratings</h3>
                <p className="text-sm text-slate-600">Based on {totalReviews} reviews</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                <span className="text-lg font-bold text-slate-900">{averageRating}</span>
              </div>
            </div>
            <div className="space-y-4">
              {satisfactionData.map((rating, index) => (
                <motion.div
                  key={rating.rating}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-20 text-sm font-medium text-slate-600">{rating.rating}</div>
                  <div className="flex-1">
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rating.percentage}%` }}
                        transition={{ duration: 1, delay: 0.7 + index * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex w-32 items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{rating.count}</span>
                    <span className="text-sm text-slate-600">({rating.percentage}%)</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Booking Summary Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Appointments Created</h3>
                <div className="rounded-lg bg-blue-50 p-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{totalAppointments || 0}</p>
              <p className="mt-2 text-sm text-slate-600">
                {completedAppointments} completed • {pendingAppointments} pending
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate || 0}%` }}
                  transition={{ duration: 1, delay: 0.9 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {completionRate.toFixed(1)}% completion rate
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Sessions Conducted</h3>
                <div className="rounded-lg bg-purple-50 p-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{completedAppointments || 0}</p>
              <p className="mt-2 text-sm text-slate-600">
                This month: {completedAppointments}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Individual</span>
                  <span className="font-semibold text-slate-900">{Math.floor(completedAppointments * 0.6) || 42}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Group</span>
                  <span className="font-semibold text-slate-900">{Math.floor(completedAppointments * 0.4) || 28}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Booking Pages</h3>
                <div className="rounded-lg bg-green-50 p-2">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">3</p>
              <p className="mt-2 text-sm text-slate-600">
                Active booking pages
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Total Views</span>
                  <span className="font-semibold text-slate-900">1,245</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Conversion</span>
                  <span className="font-semibold text-green-600">6.2%</span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Leads Generated</h3>
                <div className="rounded-lg bg-orange-50 p-2">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{leadsData.length || 0}</p>
              <p className="mt-2 text-sm text-slate-600">
                Active leads in pipeline
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Converted</span>
                  <span className="font-semibold text-slate-900">{Math.floor(leadsData.length * 0.3) || 47}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">In Progress</span>
                  <span className="font-semibold text-orange-600">{Math.floor(leadsData.length * 0.7) || 109}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Navigation Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
        >
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                title: 'View Appointments',
                description: 'Manage all bookings',
                icon: Calendar,
                color: 'from-blue-500 to-cyan-500',
                bgColor: 'bg-blue-50',
                iconColor: 'text-blue-600',
                path: '/dashboard/appointments',
                count: totalAppointments,
              },
              {
                title: 'Booking Pages',
                description: 'Create & edit pages',
                icon: FileText,
                color: 'from-green-500 to-emerald-500',
                bgColor: 'bg-green-50',
                iconColor: 'text-green-600',
                path: '/dashboard/booking-pages',
                count: 3,
              },
              {
                title: 'Manage Leads',
                description: 'View all leads',
                icon: Users,
                color: 'from-purple-500 to-pink-500',
                bgColor: 'bg-purple-50',
                iconColor: 'text-purple-600',
                path: '/dashboard/leads',
                count: leadsData.length,
              },
              {
                title: 'Calendar View',
                description: 'Schedule overview',
                icon: Clock,
                color: 'from-orange-500 to-red-500',
                bgColor: 'bg-orange-50',
                iconColor: 'text-orange-600',
                path: '/dashboard/calendar',
                count: pendingAppointments,
              },
              {
                title: 'Invoices',
                description: 'Billing & payments',
                icon: DollarSign,
                color: 'from-indigo-500 to-blue-500',
                bgColor: 'bg-indigo-50',
                iconColor: 'text-indigo-600',
                path: '/dashboard/invoices',
                count: transactionsData.length,
              },
              {
                title: 'POS System',
                description: 'Point of sale',
                icon: Activity,
                color: 'from-pink-500 to-rose-500',
                bgColor: 'bg-pink-50',
                iconColor: 'text-pink-600',
                path: '/dashboard/pos',
                count: transactionsData.length,
              },
              {
                title: 'Workflows',
                description: 'Automation setup',
                icon: Zap,
                color: 'from-yellow-500 to-orange-500',
                bgColor: 'bg-yellow-50',
                iconColor: 'text-yellow-600',
                path: '/dashboard/workflows',
                count: 5,
              },
              {
                title: 'Admin Center',
                description: 'Settings & config',
                icon: Target,
                color: 'from-slate-500 to-gray-500',
                bgColor: 'bg-slate-50',
                iconColor: 'text-slate-600',
                path: '/dashboard/admin-center',
                count: null,
              },
            ].map((action, index) => (
              <motion.a
                key={action.title}
                href={action.path}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl ${action.bgColor} p-3 transition-transform duration-300 group-hover:scale-110`}>
                    <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                  </div>
                  {action.count !== null && (
                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {action.count}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                    {action.title}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${action.color} translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100`} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <Card className="border-0 bg-white p-6 shadow-lg">
            <h3 className="mb-6 text-lg font-semibold text-slate-900">Recent Activity</h3>
            <div className="space-y-4">
              {[
                {
                  type: 'appointment',
                  title: 'New appointment booked',
                  description: 'John Doe scheduled a consultation',
                  time: '5 minutes ago',
                  icon: Calendar,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                },
                {
                  type: 'payment',
                  title: 'Payment received',
                  description: '₹2,500 from Sarah Johnson',
                  time: '23 minutes ago',
                  icon: DollarSign,
                  color: 'text-green-600',
                  bgColor: 'bg-green-50',
                },
                {
                  type: 'lead',
                  title: 'New lead added',
                  description: 'Michael Brown filled contact form',
                  time: '1 hour ago',
                  icon: Users,
                  color: 'text-purple-600',
                  bgColor: 'bg-purple-50',
                },
                {
                  type: 'session',
                  title: 'Session completed',
                  description: 'Therapy session with Emma Wilson',
                  time: '2 hours ago',
                  icon: CheckCircle,
                  color: 'text-emerald-600',
                  bgColor: 'bg-emerald-50',
                },
                {
                  type: 'booking',
                  title: 'Booking page viewed',
                  description: '15 new visitors on consultation page',
                  time: '3 hours ago',
                  icon: Activity,
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50',
                },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6 + index * 0.05 }}
                  className="flex items-start gap-4 rounded-xl border border-slate-100 p-4 transition-all hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className={`rounded-lg ${activity.bgColor} p-2`}>
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{activity.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Call to Action Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white shadow-lg">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold">Ready to boost your bookings?</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Share your booking page and start getting more appointments today. Reach more clients and grow your business.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 shadow-xl transition-all hover:shadow-2xl"
                  onClick={() => window.open('/dashboard/booking-pages', '_self')}
                >
                  Create Booking Page
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/book/default');
                    alert('Booking link copied to clipboard!');
                  }}
                >
                  Copy Link
                </motion.button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              Feedback QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Share this QR code with customers after their appointments. They can scan it to leave feedback about their experience.
            </p>
            <FeedbackQRCode size={300} />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardOverview;
