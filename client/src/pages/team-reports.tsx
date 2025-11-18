import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, FileText, Download, TrendingUp, TrendingDown, Users, Calendar,
  Clock, CheckCircle, XCircle, AlertTriangle, BarChart3, PieChart, Activity,
  Award, Target, Zap, Star, User
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  joiningDate?: string;
}

interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'leave';
  checkIn: string;
  checkOut: string;
  workHours?: number;
}

interface MemberStats {
  id: string;
  name: string;
  role: string;
  department?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  attendanceRate: number;
  avgWorkHours: number;
  totalWorkHours: number;
  performanceScore: number;
}

export default function TeamReportsPage() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'team' | 'individual'>('team');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const attendanceStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_attendance::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  const teamMembersStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_team_members::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  // Load team members
  useEffect(() => {
    if (!teamMembersStorageKey) return;
    try {
      const saved = localStorage.getItem(teamMembersStorageKey);
      if (saved) {
        setTeamMembers(JSON.parse(saved));
      }
    } catch {}
  }, [teamMembersStorageKey]);

  // Load attendance records
  useEffect(() => {
    if (!attendanceStorageKey) return;
    try {
      const saved = localStorage.getItem(attendanceStorageKey);
      if (saved) {
        setAttendanceRecords(JSON.parse(saved));
      }
    } catch {}
  }, [attendanceStorageKey]);

  // Calculate stats for all members
  const memberStats: MemberStats[] = useMemo(() => {
    return teamMembers.map(member => {
      const memberRecords = attendanceRecords.filter(
        r => r.memberId === member.id &&
          r.date >= dateRange.start &&
          r.date <= dateRange.end
      );

      const totalDays = memberRecords.length;
      const presentDays = memberRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const absentDays = memberRecords.filter(r => r.status === 'absent').length;
      const lateDays = memberRecords.filter(r => r.status === 'late').length;
      const leaveDays = memberRecords.filter(r => r.status === 'leave').length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      
      const workHoursRecords = memberRecords.filter(r => r.workHours && r.workHours > 0);
      const totalWorkHours = workHoursRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
      const avgWorkHours = workHoursRecords.length > 0 ? totalWorkHours / workHoursRecords.length : 0;
      
      // Performance score (0-100)
      const performanceScore = Math.min(100, Math.round(
        (attendanceRate * 0.6) + // 60% weight on attendance
        (Math.min(100, (avgWorkHours / 8) * 100) * 0.3) + // 30% weight on work hours
        ((1 - (lateDays / Math.max(totalDays, 1))) * 100 * 0.1) // 10% weight on punctuality
      ));

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        department: member.department,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        attendanceRate,
        avgWorkHours,
        totalWorkHours,
        performanceScore
      };
    });
  }, [teamMembers, attendanceRecords, dateRange]);

  // Team-wide stats
  const teamStats = useMemo(() => {
    const totalMembers = memberStats.length;
    if (totalMembers === 0) return null;

    const avgAttendance = memberStats.reduce((sum, s) => sum + s.attendanceRate, 0) / totalMembers;
    const avgWorkHours = memberStats.reduce((sum, s) => sum + s.avgWorkHours, 0) / totalMembers;
    const avgPerformance = memberStats.reduce((sum, s) => sum + s.performanceScore, 0) / totalMembers;
    const totalPresent = memberStats.reduce((sum, s) => sum + s.presentDays, 0);
    const totalAbsent = memberStats.reduce((sum, s) => sum + s.absentDays, 0);
    const totalLate = memberStats.reduce((sum, s) => sum + s.lateDays, 0);

    return {
      totalMembers,
      avgAttendance,
      avgWorkHours,
      avgPerformance,
      totalPresent,
      totalAbsent,
      totalLate,
      topPerformers: [...memberStats].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5),
      needsAttention: memberStats.filter(s => s.attendanceRate < 80 || s.performanceScore < 60)
    };
  }, [memberStats]);

  const exportTeamReport = () => {
    const csv = ['Team Performance Report'];
    csv.push(`Period: ${dateRange.start} to ${dateRange.end}`);
    csv.push('');
    csv.push('Name,Role,Department,Total Days,Present,Absent,Late,Leave,Attendance %,Avg Hours,Performance Score');
    
    memberStats.forEach(s => {
      csv.push([
        s.name,
        s.role,
        s.department || 'N/A',
        s.totalDays,
        s.presentDays,
        s.absentDays,
        s.lateDays,
        s.leaveDays,
        s.attendanceRate.toFixed(1),
        s.avgWorkHours.toFixed(1),
        s.performanceScore
      ].map(v => `"${v}"`).join(','));
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_report_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Report Exported', description: 'Team report downloaded successfully' });
  };

  const exportIndividualReport = (member: MemberStats) => {
    const csv = [`Individual Performance Report - ${member.name}`];
    csv.push(`Role: ${member.role}`);
    csv.push(`Department: ${member.department || 'N/A'}`);
    csv.push(`Period: ${dateRange.start} to ${dateRange.end}`);
    csv.push('');
    csv.push('Metric,Value');
    csv.push(`Total Days,${member.totalDays}`);
    csv.push(`Present Days,${member.presentDays}`);
    csv.push(`Absent Days,${member.absentDays}`);
    csv.push(`Late Days,${member.lateDays}`);
    csv.push(`Leave Days,${member.leaveDays}`);
    csv.push(`Attendance Rate,${member.attendanceRate.toFixed(1)}%`);
    csv.push(`Average Work Hours,${member.avgWorkHours.toFixed(1)}`);
    csv.push(`Total Work Hours,${member.totalWorkHours.toFixed(1)}`);
    csv.push(`Performance Score,${member.performanceScore}`);

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${member.name.replace(/\s+/g, '_')}_report_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Report Exported', description: `Report for ${member.name} downloaded` });
  };

  const selectedMemberStats = memberStats.find(s => s.id === selectedMember);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-green-600" size={28} />
                Team Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive team and individual performance reports</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportTeamReport}
              variant="outline"
              className="gap-2"
            >
              <Download size={18} />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange({
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  })}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange({
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  })}
                >
                  Last 30 Days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="team">Team Report</TabsTrigger>
            <TabsTrigger value="individual">Individual Reports</TabsTrigger>
          </TabsList>

          {/* Team Report */}
          <TabsContent value="team" className="space-y-6">
            {teamStats && (
              <>
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Team Size</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{teamStats.totalMembers}</div>
                        <p className="text-xs text-gray-500 mt-1">Active members</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg Attendance</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{teamStats.avgAttendance.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500 mt-1">Team average</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg Work Hours</CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{teamStats.avgWorkHours.toFixed(1)}h</div>
                        <p className="text-xs text-gray-500 mt-1">Per day</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{teamStats.avgPerformance.toFixed(0)}/100</div>
                        <p className="text-xs text-gray-500 mt-1">Overall score</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamStats.topPerformers.map((member, index) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-600' :
                              'bg-purple-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{member.name}</h3>
                              <p className="text-sm text-gray-600">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{member.attendanceRate.toFixed(1)}% Attendance</p>
                              <p className="text-xs text-gray-500">{member.avgWorkHours.toFixed(1)}h avg</p>
                            </div>
                            <div className="w-16 h-16 relative">
                              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="3"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  stroke={index === 0 ? '#f59e0b' : '#8b5cf6'}
                                  strokeWidth="3"
                                  strokeDasharray={`${member.performanceScore} 100`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-700">{member.performanceScore}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Needs Attention */}
                {teamStats.needsAttention.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Needs Attention ({teamStats.needsAttention.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teamStats.needsAttention.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <AlertTriangle className="h-6 w-6 text-red-500" />
                              <div>
                                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                <p className="text-sm text-gray-600">{member.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium text-red-700">
                                  {member.attendanceRate.toFixed(1)}% Attendance
                                </p>
                                <p className="text-xs text-gray-600">
                                  {member.absentDays} absent, {member.lateDays} late
                                </p>
                              </div>
                              <Badge variant="destructive">
                                Score: {member.performanceScore}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle>Complete Team Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">NAME</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ROLE</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">PRESENT</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">ABSENT</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">LATE</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">ATTENDANCE</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">AVG HOURS</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">SCORE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {memberStats.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{member.role}</td>
                              <td className="px-4 py-3 text-center text-sm text-green-600">{member.presentDays}</td>
                              <td className="px-4 py-3 text-center text-sm text-red-600">{member.absentDays}</td>
                              <td className="px-4 py-3 text-center text-sm text-yellow-600">{member.lateDays}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge className={
                                  member.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                                  member.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {member.attendanceRate.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-700">
                                {member.avgWorkHours.toFixed(1)}h
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge className={
                                  member.performanceScore >= 80 ? 'bg-green-100 text-green-800' :
                                  member.performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {member.performanceScore}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Individual Reports */}
          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose a team member...</option>
                  {memberStats.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {selectedMemberStats && (
              <>
                {/* Member Header */}
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                          {selectedMemberStats.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{selectedMemberStats.name}</h2>
                          <p className="text-gray-600">{selectedMemberStats.role}</p>
                          {selectedMemberStats.department && (
                            <p className="text-sm text-gray-500">{selectedMemberStats.department}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => exportIndividualReport(selectedMemberStats)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Download size={18} />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Attendance Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <div className="w-32 h-32 relative">
                          <svg className="transform -rotate-90" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3"
                              strokeDasharray={`${selectedMemberStats.attendanceRate} 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-bold text-gray-900">
                              {selectedMemberStats.attendanceRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Work Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Daily</span>
                        <span className="text-xl font-bold text-blue-600">
                          {selectedMemberStats.avgWorkHours.toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Hours</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {selectedMemberStats.totalWorkHours.toFixed(0)}h
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Performance Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-600 mb-2">
                          {selectedMemberStats.performanceScore}
                        </div>
                        <Badge className={
                          selectedMemberStats.performanceScore >= 80 ? 'bg-green-100 text-green-800' :
                          selectedMemberStats.performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {selectedMemberStats.performanceScore >= 80 ? 'Excellent' :
                           selectedMemberStats.performanceScore >= 60 ? 'Good' :
                           'Needs Improvement'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">{selectedMemberStats.presentDays}</div>
                        <div className="text-sm text-gray-600">Present Days</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-600">{selectedMemberStats.absentDays}</div>
                        <div className="text-sm text-gray-600">Absent Days</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">{selectedMemberStats.lateDays}</div>
                        <div className="text-sm text-gray-600">Late Arrivals</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{selectedMemberStats.leaveDays}</div>
                        <div className="text-sm text-gray-600">Leave Days</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
