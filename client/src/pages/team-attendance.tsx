import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Check, X, Edit2, Save, Users, TrendingUp, AlertCircle, ArrowLeft, Download, Upload, Fingerprint, Smartphone, Wifi, Plus } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'leave';
  method: 'auto' | 'manual' | 'biometric' | 'mobile';
  notes?: string;
  location?: string;
  workHours?: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function TeamAttendancePage() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'auto'>('today');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [attendanceForm, setAttendanceForm] = useState({
    status: 'present' as AttendanceRecord['status'],
    checkIn: '',
    checkOut: '',
    notes: ''
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

  // Auto-tracking simulation
  useEffect(() => {
    if (!autoTrackingEnabled || !attendanceStorageKey) return;
    
    const autoCheckIn = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      
      // Auto check-in between 8:00 and 10:00 AM
      if (now.getHours() >= 8 && now.getHours() < 10) {
        teamMembers.forEach(member => {
          const existingRecord = attendanceRecords.find(
            r => r.memberId === member.id && r.date === today
          );
          
          if (!existingRecord && Math.random() > 0.3) { // 70% auto check-in rate
            const newRecord: AttendanceRecord = {
              id: `${Date.now()}-${member.id}`,
              memberId: member.id,
              memberName: member.name,
              date: today,
              checkIn: currentTime,
              checkOut: '',
              status: now.getHours() > 9 ? 'late' : 'present',
              method: 'auto',
              location: 'Office',
              workHours: 0
            };
            
            setAttendanceRecords(prev => {
              const updated = [...prev, newRecord];
              if (attendanceStorageKey) {
                localStorage.setItem(attendanceStorageKey, JSON.stringify(updated));
              }
              return updated;
            });
          }
        });
      }
    };

    const interval = setInterval(autoCheckIn, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [autoTrackingEnabled, teamMembers, attendanceRecords, attendanceStorageKey]);

  const todayRecords = attendanceRecords.filter(r => r.date === selectedDate);
  const presentCount = todayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const absentCount = todayRecords.filter(r => r.status === 'absent').length;
  const lateCount = todayRecords.filter(r => r.status === 'late').length;
  const onLeaveCount = todayRecords.filter(r => r.status === 'leave').length;

  const attendancePercentage = teamMembers.length > 0 
    ? ((presentCount / teamMembers.length) * 100).toFixed(1)
    : 0;

  const handleMarkAttendance = () => {
    if (!selectedMember) {
      toast({ title: 'Error', description: 'Please select a team member', variant: 'destructive' });
      return;
    }

    const member = teamMembers.find(m => m.id === selectedMember);
    if (!member) return;

    const newRecord: AttendanceRecord = {
      id: `${Date.now()}-${selectedMember}`,
      memberId: selectedMember,
      memberName: member.name,
      date: selectedDate,
      checkIn: attendanceForm.checkIn || new Date().toTimeString().slice(0, 5),
      checkOut: attendanceForm.checkOut,
      status: attendanceForm.status,
      method: 'manual',
      notes: attendanceForm.notes,
      workHours: 0
    };

    if (newRecord.checkIn && newRecord.checkOut) {
      const [h1, m1] = newRecord.checkIn.split(':').map(Number);
      const [h2, m2] = newRecord.checkOut.split(':').map(Number);
      newRecord.workHours = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
    }

    const updated = [...attendanceRecords, newRecord];
    setAttendanceRecords(updated);
    if (attendanceStorageKey) {
      localStorage.setItem(attendanceStorageKey, JSON.stringify(updated));
    }

    toast({ title: 'Success', description: 'Attendance marked successfully' });
    setIsMarkAttendanceOpen(false);
    setAttendanceForm({ status: 'present', checkIn: '', checkOut: '', notes: '' });
    setSelectedMember('');
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord({ ...record });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;

    if (editingRecord.checkIn && editingRecord.checkOut) {
      const [h1, m1] = editingRecord.checkIn.split(':').map(Number);
      const [h2, m2] = editingRecord.checkOut.split(':').map(Number);
      editingRecord.workHours = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
    }

    const updated = attendanceRecords.map(r => r.id === editingRecord.id ? editingRecord : r);
    setAttendanceRecords(updated);
    if (attendanceStorageKey) {
      localStorage.setItem(attendanceStorageKey, JSON.stringify(updated));
    }

    toast({ title: 'Success', description: 'Attendance updated successfully' });
    setIsEditDialogOpen(false);
    setEditingRecord(null);
  };

  const quickMarkAttendance = (memberId: string, memberName: string, status: 'present' | 'absent' | 'leave' | 'half-day') => {
    const existingRecord = todayRecords.find(r => r.memberId === memberId);
    if (existingRecord) {
      toast({ title: 'Already Marked', description: 'Attendance already marked for this member today', variant: 'destructive' });
      return;
    }

    const currentTime = new Date().toTimeString().slice(0, 5);
    const newRecord: AttendanceRecord = {
      id: `${Date.now()}-${memberId}`,
      memberId,
      memberName,
      date: selectedDate,
      checkIn: status === 'present' || status === 'half-day' ? currentTime : '00:00',
      checkOut: '',
      status: status,
      method: 'manual',
      workHours: 0
    };

    // For half-day, set default check-out time
    if (status === 'half-day') {
      const [h, m] = currentTime.split(':').map(Number);
      const checkOutTime = `${String(h + 4).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      newRecord.checkOut = checkOutTime;
      newRecord.workHours = 4;
    }

    const updated = [...attendanceRecords, newRecord];
    setAttendanceRecords(updated);
    if (attendanceStorageKey) {
      localStorage.setItem(attendanceStorageKey, JSON.stringify(updated));
    }

    const statusText = status === 'half-day' ? 'Half Day' : status.charAt(0).toUpperCase() + status.slice(1);
    toast({ title: 'Success', description: `Marked ${memberName} as ${statusText}` });
  };

  const exportAttendance = () => {
    const csv = ['Date,Name,Check In,Check Out,Status,Work Hours,Method,Notes'];
    attendanceRecords
      .filter(r => r.date === selectedDate)
      .forEach(r => {
        csv.push([
          r.date,
          r.memberName,
          r.checkIn,
          r.checkOut || 'N/A',
          r.status,
          r.workHours?.toFixed(2) || '0',
          r.method,
          r.notes || ''
        ].map(v => `"${v}"`).join(','));
      });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                <Calendar className="text-blue-600" size={28} />
                Team Attendance
              </h1>
              <p className="text-gray-600 mt-1">Track and manage team member attendance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportAttendance}
              variant="outline"
              className="gap-2"
            >
              <Download size={18} />
              Export
            </Button>
            <Button
              onClick={() => setIsMarkAttendanceOpen(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Check size={18} />
              Mark Attendance
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Present Today</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <p className="text-xs text-gray-500 mt-1">{attendancePercentage}% attendance</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Absent</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <p className="text-xs text-gray-500 mt-1">Missing today</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Late Arrivals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
              <p className="text-xs text-gray-500 mt-1">After 9:00 AM</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{onLeaveCount}</div>
              <p className="text-xs text-gray-500 mt-1">Approved leaves</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="today">Today's Attendance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="auto">Auto Tracking</TabsTrigger>
          </TabsList>

          {/* Today's Attendance */}
          <TabsContent value="today">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Attendance Table - {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-48"
                    />
                    <Button onClick={() => setIsMarkAttendanceOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                    <Button onClick={exportAttendance} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No team members found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left p-3 font-semibold text-gray-700">S.No</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Employee Name</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Check In</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Check Out</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Work Hours</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Quick Actions</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map((member, index) => {
                          const record = todayRecords.find(r => r.memberId === member.id);
                          return (
                            <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="p-3 text-gray-600">{index + 1}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                                    record?.status === 'present' ? 'bg-green-500' :
                                    record?.status === 'late' ? 'bg-yellow-500' :
                                    record?.status === 'absent' ? 'bg-red-500' :
                                    record?.status === 'leave' ? 'bg-blue-500' :
                                    record?.status === 'half-day' ? 'bg-orange-500' :
                                    'bg-gray-400'
                                  }`}>
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{member.name}</div>
                                    <div className="text-xs text-gray-500">{member.role || 'Team Member'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                {record?.checkIn ? (
                                  <span className="text-gray-900 font-medium">{record.checkIn}</span>
                                ) : (
                                  <span className="text-gray-400">--:--</span>
                                )}
                              </td>
                              <td className="p-3">
                                {record?.checkOut ? (
                                  <span className="text-gray-900 font-medium">{record.checkOut}</span>
                                ) : (
                                  <span className="text-gray-400">--:--</span>
                                )}
                              </td>
                              <td className="p-3">
                                {record?.workHours ? (
                                  <span className="font-medium text-gray-900">
                                    {record.workHours.toFixed(1)} hrs
                                  </span>
                                ) : (
                                  <span className="text-gray-400">0.0 hrs</span>
                                )}
                              </td>
                              <td className="p-3">
                                {record ? (
                                  <Badge className={`${
                                    record.status === 'present' ? 'bg-green-100 text-green-800 border-green-200' :
                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    record.status === 'absent' ? 'bg-red-100 text-red-800 border-red-200' :
                                    record.status === 'leave' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    record.status === 'half-day' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                                  } border font-medium`}>
                                    {record.status === 'half-day' ? 'Half Day' : 
                                     record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-500 border border-gray-200">
                                    Not Marked
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                {!record && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => quickMarkAttendance(member.id, member.name, 'present')}
                                      className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600"
                                      title="Mark Present"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => quickMarkAttendance(member.id, member.name, 'absent')}
                                      className="h-7 px-2 text-xs bg-red-500 hover:bg-red-600"
                                      title="Mark Absent"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => quickMarkAttendance(member.id, member.name, 'leave')}
                                      className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600"
                                      title="Mark Leave"
                                    >
                                      <Calendar className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => quickMarkAttendance(member.id, member.name, 'half-day')}
                                      className="h-7 px-2 text-xs bg-orange-500 hover:bg-orange-600"
                                      title="Mark Half Day"
                                    >
                                      <Clock className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {record && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRecord(record)}
                                    className="h-8"
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab - Keep existing */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Attendance History</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setIsMarkAttendanceOpen(true)} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                    <Button onClick={exportAttendance} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No team members found</p>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No attendance records found</p>
                    </div>
                  ) : (
                    attendanceRecords.slice().reverse().map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            record.status === 'present' ? 'bg-green-500' :
                            record.status === 'late' ? 'bg-yellow-500' :
                            record.status === 'absent' ? 'bg-red-500' :
                            record.status === 'leave' ? 'bg-blue-500' :
                            record.status === 'half-day' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`}>
                            {record.memberName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{record.memberName}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(record.date).toLocaleDateString('en-GB')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                In: {record.checkIn}
                              </span>
                              {record.checkOut && (
                                <span className="flex items-center gap-1">
                                  Out: {record.checkOut}
                                </span>
                              )}
                              {record.workHours && (
                                <span className="text-gray-500">
                                  ({record.workHours.toFixed(1)}h)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'absent' ? 'bg-red-100 text-red-800' :
                              record.status === 'leave' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                            {record.method === 'auto' && (
                              <Badge variant="outline" className="gap-1">
                                <Wifi className="h-3 w-3" />
                                Auto
                              </Badge>
                            )}
                            {record.method === 'biometric' && (
                              <Badge variant="outline" className="gap-1">
                                <Fingerprint className="h-3 w-3" />
                                Bio
                              </Badge>
                            )}
                            {record.method === 'mobile' && (
                              <Badge variant="outline" className="gap-1">
                                <Smartphone className="h-3 w-3" />
                                Mobile
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Group by date */}
                  {Object.entries(
                    attendanceRecords.reduce((acc, record) => {
                      if (!acc[record.date]) acc[record.date] = [];
                      acc[record.date].push(record);
                      return acc;
                    }, {} as Record<string, AttendanceRecord[]>)
                  )
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 10)
                    .map(([date, records]) => (
                      <div key={date} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">
                          {new Date(date).toLocaleDateString('en-GB', { 
                            weekday: 'long', 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-500" />
                            {records.filter(r => r.status === 'present' || r.status === 'late').length} Present
                          </span>
                          <span className="flex items-center gap-1">
                            <X className="h-4 w-4 text-red-500" />
                            {records.filter(r => r.status === 'absent').length} Absent
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            {records.filter(r => r.status === 'late').length} Late
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto Tracking */}
          <TabsContent value="auto">
            <Card>
              <CardHeader>
                <CardTitle>Automated Attendance Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Auto Check-In</h3>
                      <p className="text-sm text-gray-600">Automatically mark attendance when team members connect</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoTrackingEnabled}
                      onChange={(e) => setAutoTrackingEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <Fingerprint className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold mb-1">Biometric Integration</h3>
                    <p className="text-sm text-gray-600">Connect fingerprint or face recognition devices</p>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      Configure
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Smartphone className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold mb-1">Mobile App</h3>
                    <p className="text-sm text-gray-600">Allow check-in via mobile application</p>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      Setup
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Wifi className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold mb-1">Geo-fencing</h3>
                    <p className="text-sm text-gray-600">Auto mark when entering office premises</p>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      Enable
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Demo Mode Active</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Auto-tracking is currently in simulation mode. Connect actual devices for live tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mark Attendance Dialog */}
        <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>Manually mark attendance for team members</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Team Member *</Label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a member</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                  <option value="late">Late</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check In Time</Label>
                  <Input
                    type="time"
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check Out Time</Label>
                  <Input
                    type="time"
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  placeholder="Add any notes or remarks..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMarkAttendanceOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAttendance} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Record Dialog */}
        {editingRecord && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Attendance</DialogTitle>
                <DialogDescription>Update attendance record for {editingRecord.memberName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={editingRecord.status}
                    onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                    <option value="leave">On Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Check In</Label>
                    <Input
                      type="time"
                      value={editingRecord.checkIn}
                      onChange={(e) => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check Out</Label>
                    <Input
                      type="time"
                      value={editingRecord.checkOut}
                      onChange={(e) => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea
                    value={editingRecord.notes || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  Update
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
