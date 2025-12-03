import { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Check, X, Edit2, Save, Users, TrendingUp, AlertCircle, ArrowLeft, Download, Upload, Fingerprint, Smartphone, Wifi, Plus, Settings, Scan, UserCheck, LogIn, LogOut, Activity, CheckCircle2, XCircle } from 'lucide-react';
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
  status: 'present' | 'absent' | 'half-day' | 'late' | 'leave' | string;
  method: 'auto' | 'manual' | 'biometric' | 'mobile' | string;
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

interface DefaultTimingSettings {
  checkInTime: string;
  checkOutTime: string;
  lateThresholdMinutes: number;
  halfDayHours: number;
}

interface BiometricDevice {
  id: string;
  name: string;
  type: 'fingerprint' | 'face-recognition' | 'card-reader' | 'iris-scanner';
  status: 'connected' | 'disconnected' | 'scanning';
  lastSync?: string;
}

interface BiometricLog {
  id: string;
  memberId: string;
  memberName: string;
  timestamp: string;
  action: 'check-in' | 'check-out';
  deviceId: string;
  deviceName: string;
  verified: boolean;
}

export default function TeamAttendancePage() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'auto' | 'biometric'>('today');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>('');
  
  // Default timing settings
  const [defaultTimings, setDefaultTimings] = useState<DefaultTimingSettings>({
    checkInTime: '09:00',
    checkOutTime: '18:00',
    lateThresholdMinutes: 15,
    halfDayHours: 4
  });
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingTimings, setEditingTimings] = useState<DefaultTimingSettings>({
    checkInTime: '09:00',
    checkOutTime: '18:00',
    lateThresholdMinutes: 15,
    halfDayHours: 4
  });
  
  // Custom status and method states
  const [showCustomStatus, setShowCustomStatus] = useState(false);
  const [customStatus, setCustomStatus] = useState('');
  const [showCustomStatusEdit, setShowCustomStatusEdit] = useState(false);
  const [customStatusEdit, setCustomStatusEdit] = useState('');
  const [showCustomMethod, setShowCustomMethod] = useState(false);
  const [customMethod, setCustomMethod] = useState('');
  
  // Biometric Integration States
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([
    { id: 'bio-1', name: 'Main Entrance Scanner', type: 'fingerprint', status: 'connected', lastSync: new Date().toISOString() },
    { id: 'bio-2', name: 'Reception Face ID', type: 'face-recognition', status: 'connected', lastSync: new Date().toISOString() },
    { id: 'bio-3', name: 'Card Reader - Floor 1', type: 'card-reader', status: 'disconnected' },
  ]);
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
  const [isBiometricDialogOpen, setIsBiometricDialogOpen] = useState(false);
  const [biometricAction, setBiometricAction] = useState<'check-in' | 'check-out'>('check-in');
  const [selectedBiometricMember, setSelectedBiometricMember] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('bio-1');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<'success' | 'failed' | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [attendanceForm, setAttendanceForm] = useState({
    status: 'present' as AttendanceRecord['status'],
    checkIn: '',
    checkOut: '',
    notes: '',
    method: 'manual' as AttendanceRecord['method']
  });

  const attendanceStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_attendance::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  const teamMembersStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_team_members::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  const timingsStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_attendance_timings::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  const biometricLogsStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_biometric_logs::${selectedWorkspace.id}` : null;
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

  // Load default timing settings
  useEffect(() => {
    if (!timingsStorageKey) return;
    try {
      const saved = localStorage.getItem(timingsStorageKey);
      if (saved) {
        const parsedTimings = JSON.parse(saved);
        setDefaultTimings(parsedTimings);
        setEditingTimings(parsedTimings);
      }
    } catch {}
  }, [timingsStorageKey]);

  // Save timing settings
  const handleSaveTimings = () => {
    setDefaultTimings(editingTimings);
    if (timingsStorageKey) {
      localStorage.setItem(timingsStorageKey, JSON.stringify(editingTimings));
    }
    toast({ title: 'Success', description: 'Default timing settings saved successfully' });
    setIsSettingsDialogOpen(false);
  };

  // Load biometric logs
  useEffect(() => {
    if (!biometricLogsStorageKey) return;
    try {
      const saved = localStorage.getItem(biometricLogsStorageKey);
      if (saved) {
        setBiometricLogs(JSON.parse(saved));
      }
    } catch {}
  }, [biometricLogsStorageKey]);

  // Biometric Scanning Simulation
  const startBiometricScan = () => {
    if (!selectedBiometricMember) {
      toast({ title: 'Error', description: 'Please select a team member', variant: 'destructive' });
      return;
    }

    const device = biometricDevices.find(d => d.id === selectedDevice);
    if (!device || device.status === 'disconnected') {
      toast({ title: 'Error', description: 'Selected device is not connected', variant: 'destructive' });
      return;
    }

    // Check if already checked in/out today
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = attendanceRecords.find(r => r.memberId === selectedBiometricMember && r.date === today);
    
    if (biometricAction === 'check-in' && existingRecord?.checkIn) {
      toast({ title: 'Already Checked In', description: 'This member has already checked in today', variant: 'destructive' });
      return;
    }
    
    if (biometricAction === 'check-out' && !existingRecord?.checkIn) {
      toast({ title: 'Not Checked In', description: 'This member needs to check in first', variant: 'destructive' });
      return;
    }
    
    if (biometricAction === 'check-out' && existingRecord?.checkOut) {
      toast({ title: 'Already Checked Out', description: 'This member has already checked out today', variant: 'destructive' });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);

    // Update device status to scanning
    setBiometricDevices(prev => prev.map(d => 
      d.id === selectedDevice ? { ...d, status: 'scanning' as const } : d
    ));

    // Simulate scanning progress
    let progress = 0;
    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        
        // Simulate 95% success rate
        const success = Math.random() > 0.05;
        setScanResult(success ? 'success' : 'failed');
        
        // Reset device status
        setBiometricDevices(prev => prev.map(d => 
          d.id === selectedDevice ? { ...d, status: 'connected' as const, lastSync: new Date().toISOString() } : d
        ));

        if (success) {
          // Process biometric attendance
          processBiometricAttendance();
        } else {
          toast({ title: 'Scan Failed', description: 'Biometric verification failed. Please try again.', variant: 'destructive' });
          setTimeout(() => {
            setIsScanning(false);
            setScanResult(null);
            setScanProgress(0);
          }, 2000);
        }
      }
      setScanProgress(progress);
    }, 150);
  };

  const processBiometricAttendance = () => {
    const member = teamMembers.find(m => m.id === selectedBiometricMember);
    const device = biometricDevices.find(d => d.id === selectedDevice);
    if (!member || !device) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Create biometric log
    const newLog: BiometricLog = {
      id: `bio-log-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      timestamp: now.toISOString(),
      action: biometricAction,
      deviceId: device.id,
      deviceName: device.name,
      verified: true
    };
    
    const updatedLogs = [...biometricLogs, newLog];
    setBiometricLogs(updatedLogs);
    if (biometricLogsStorageKey) {
      localStorage.setItem(biometricLogsStorageKey, JSON.stringify(updatedLogs));
    }

    // Update attendance record
    if (biometricAction === 'check-in') {
      // Determine if late
      const [defH, defM] = defaultTimings.checkInTime.split(':').map(Number);
      const [curH, curM] = currentTime.split(':').map(Number);
      const lateMinutes = ((curH * 60 + curM) - (defH * 60 + defM));
      const isLate = lateMinutes > defaultTimings.lateThresholdMinutes;

      const newRecord: AttendanceRecord = {
        id: `${Date.now()}-${member.id}`,
        memberId: member.id,
        memberName: member.name,
        date: today,
        checkIn: currentTime,
        checkOut: '',
        status: isLate ? 'late' : 'present',
        method: 'biometric',
        location: device.name,
        notes: `Verified via ${device.type === 'fingerprint' ? 'Fingerprint' : device.type === 'face-recognition' ? 'Face Recognition' : device.type === 'card-reader' ? 'Card' : 'Iris'} Scanner`,
        workHours: 0
      };

      const updated = [...attendanceRecords, newRecord];
      setAttendanceRecords(updated);
      if (attendanceStorageKey) {
        localStorage.setItem(attendanceStorageKey, JSON.stringify(updated));
      }

      toast({ 
        title: '✓ Check-In Successful', 
        description: `${member.name} checked in at ${currentTime} via ${device.name}` 
      });
    } else {
      // Check-out: Update existing record
      const existingRecord = attendanceRecords.find(r => r.memberId === member.id && r.date === today);
      if (existingRecord) {
        const [h1, m1] = existingRecord.checkIn.split(':').map(Number);
        const [h2, m2] = currentTime.split(':').map(Number);
        const workHours = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;

        const updatedRecord = {
          ...existingRecord,
          checkOut: currentTime,
          workHours: workHours,
          notes: `${existingRecord.notes || ''} | Checked out via ${device.name}`.trim()
        };

        const updated = attendanceRecords.map(r => r.id === existingRecord.id ? updatedRecord : r);
        setAttendanceRecords(updated);
        if (attendanceStorageKey) {
          localStorage.setItem(attendanceStorageKey, JSON.stringify(updated));
        }

        toast({ 
          title: '✓ Check-Out Successful', 
          description: `${member.name} checked out at ${currentTime}. Total: ${workHours.toFixed(1)} hrs` 
        });
      }
    }

    // Close dialog after short delay
    setTimeout(() => {
      setIsBiometricDialogOpen(false);
      setIsScanning(false);
      setScanResult(null);
      setScanProgress(0);
      setSelectedBiometricMember('');
    }, 1500);
  };

  const cancelScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsScanning(false);
    setScanProgress(0);
    setScanResult(null);
    setBiometricDevices(prev => prev.map(d => 
      d.id === selectedDevice ? { ...d, status: 'connected' as const } : d
    ));
  };

  const toggleDeviceConnection = (deviceId: string) => {
    setBiometricDevices(prev => prev.map(d => 
      d.id === deviceId ? { 
        ...d, 
        status: d.status === 'connected' ? 'disconnected' : 'connected',
        lastSync: d.status === 'disconnected' ? new Date().toISOString() : d.lastSync
      } : d
    ));
    
    const device = biometricDevices.find(d => d.id === deviceId);
    if (device) {
      toast({ 
        title: device.status === 'connected' ? 'Device Disconnected' : 'Device Connected',
        description: `${device.name} is now ${device.status === 'connected' ? 'offline' : 'online'}`
      });
    }
  };

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

    // Use custom status if provided
    const finalStatus = showCustomStatus && customStatus.trim() 
      ? customStatus.trim().toLowerCase().replace(/\s+/g, '-')
      : attendanceForm.status;

    // Use custom method if provided
    const finalMethod = showCustomMethod && customMethod.trim()
      ? customMethod.trim().toLowerCase().replace(/\s+/g, '-')
      : attendanceForm.method;

    const newRecord: AttendanceRecord = {
      id: `${Date.now()}-${selectedMember}`,
      memberId: selectedMember,
      memberName: member.name,
      date: selectedDate,
      checkIn: attendanceForm.checkIn || defaultTimings.checkInTime,
      checkOut: attendanceForm.checkOut || '',
      status: finalStatus,
      method: finalMethod,
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
    setAttendanceForm({ status: 'present', checkIn: '', checkOut: '', notes: '', method: 'manual' });
    setSelectedMember('');
    setShowCustomStatus(false);
    setCustomStatus('');
    setShowCustomMethod(false);
    setCustomMethod('');
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord({ ...record });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;

    // Use custom status if provided in edit
    if (showCustomStatusEdit && customStatusEdit.trim()) {
      editingRecord.status = customStatusEdit.trim().toLowerCase().replace(/\s+/g, '-');
    }

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
    setShowCustomStatusEdit(false);
    setCustomStatusEdit('');
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
              onClick={() => {
                setEditingTimings(defaultTimings);
                setIsSettingsDialogOpen(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <Settings size={18} />
              Default Timings
            </Button>
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
            <TabsTrigger value="biometric" className="gap-1">
              <Fingerprint className="h-4 w-4" />
              Biometric
            </TabsTrigger>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => setActiveTab('biometric')}
                    >
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

          {/* Biometric Integration Tab */}
          <TabsContent value="biometric">
            <div className="space-y-6">
              {/* Biometric Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setBiometricAction('check-in');
                    setIsBiometricDialogOpen(true);
                  }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <LogIn className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-700">Biometric Check-In</h3>
                        <p className="text-sm text-gray-600">Scan fingerprint or face to check in</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setBiometricAction('check-out');
                    setIsBiometricDialogOpen(true);
                  }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <LogOut className="h-8 w-8 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-red-700">Biometric Check-Out</h3>
                        <p className="text-sm text-gray-600">Scan fingerprint or face to check out</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Connected Devices */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-purple-600" />
                      Connected Biometric Devices
                    </CardTitle>
                    <Badge variant="outline" className="gap-1">
                      <Activity className="h-3 w-3" />
                      {biometricDevices.filter(d => d.status === 'connected').length} Online
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {biometricDevices.map(device => (
                      <div 
                        key={device.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          device.status === 'connected' ? 'border-green-200 bg-green-50/50' :
                          device.status === 'scanning' ? 'border-blue-200 bg-blue-50/50' :
                          'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            device.status === 'connected' ? 'bg-green-100' :
                            device.status === 'scanning' ? 'bg-blue-100 animate-pulse' :
                            'bg-gray-100'
                          }`}>
                            {device.type === 'fingerprint' && <Fingerprint className={`h-6 w-6 ${device.status === 'connected' ? 'text-green-600' : device.status === 'scanning' ? 'text-blue-600' : 'text-gray-400'}`} />}
                            {device.type === 'face-recognition' && <UserCheck className={`h-6 w-6 ${device.status === 'connected' ? 'text-green-600' : device.status === 'scanning' ? 'text-blue-600' : 'text-gray-400'}`} />}
                            {device.type === 'card-reader' && <Scan className={`h-6 w-6 ${device.status === 'connected' ? 'text-green-600' : device.status === 'scanning' ? 'text-blue-600' : 'text-gray-400'}`} />}
                            {device.type === 'iris-scanner' && <Activity className={`h-6 w-6 ${device.status === 'connected' ? 'text-green-600' : device.status === 'scanning' ? 'text-blue-600' : 'text-gray-400'}`} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{device.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="capitalize">{device.type.replace('-', ' ')}</span>
                              {device.lastSync && (
                                <span>• Last sync: {new Date(device.lastSync).toLocaleTimeString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${
                            device.status === 'connected' ? 'bg-green-100 text-green-800' :
                            device.status === 'scanning' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {device.status === 'connected' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {device.status === 'scanning' && <Activity className="h-3 w-3 mr-1 animate-pulse" />}
                            {device.status === 'disconnected' && <XCircle className="h-3 w-3 mr-1" />}
                            {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDeviceConnection(device.id)}
                            disabled={device.status === 'scanning'}
                          >
                            {device.status === 'connected' ? 'Disconnect' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Biometric Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Recent Biometric Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {biometricLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Fingerprint className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No biometric activity recorded yet</p>
                      <p className="text-sm">Use biometric check-in/check-out to see activity here</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {biometricLogs.slice().reverse().slice(0, 20).map(log => (
                        <div 
                          key={log.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            log.action === 'check-in' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              log.action === 'check-in' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {log.action === 'check-in' ? 
                                <LogIn className="h-5 w-5 text-green-600" /> : 
                                <LogOut className="h-5 w-5 text-red-600" />
                              }
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{log.memberName}</div>
                              <div className="text-xs text-gray-500">
                                {log.deviceName} • {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Badge className={log.action === 'check-in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {log.action === 'check-in' ? 'Check In' : 'Check Out'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Biometric Stats for Today */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Biometric Check-ins Today</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {biometricLogs.filter(l => l.action === 'check-in' && l.timestamp.startsWith(new Date().toISOString().split('T')[0])).length}
                        </p>
                      </div>
                      <Fingerprint className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Biometric Check-outs Today</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {biometricLogs.filter(l => l.action === 'check-out' && l.timestamp.startsWith(new Date().toISOString().split('T')[0])).length}
                        </p>
                      </div>
                      <LogOut className="h-8 w-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Devices Online</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {biometricDevices.filter(d => d.status === 'connected').length} / {biometricDevices.length}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Mark Attendance Dialog */}
        <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>Manually mark attendance for team members</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Default Timings Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 font-medium text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  Default Office Timings
                </div>
                <div className="text-xs text-blue-600">
                  Check-in: {defaultTimings.checkInTime} | Check-out: {defaultTimings.checkOutTime} | Late after: {defaultTimings.lateThresholdMinutes} min
                </div>
              </div>

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
                {!showCustomStatus ? (
                  <select
                    value={attendanceForm.status}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomStatus(true);
                      } else {
                        setAttendanceForm({ ...attendanceForm, status: e.target.value as any });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                    <option value="leave">On Leave</option>
                    <option value="work-from-home">Work From Home</option>
                    <option value="sick-leave">Sick Leave</option>
                    <option value="casual-leave">Casual Leave</option>
                    <option value="custom">+ Custom Status</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom status..."
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomStatus(false);
                        setCustomStatus('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tracking Method</Label>
                {!showCustomMethod ? (
                  <select
                    value={attendanceForm.method}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomMethod(true);
                      } else {
                        setAttendanceForm({ ...attendanceForm, method: e.target.value as any });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="biometric">Biometric</option>
                    <option value="mobile">Mobile App</option>
                    <option value="auto">Auto (System)</option>
                    <option value="card-swipe">Card Swipe</option>
                    <option value="face-recognition">Face Recognition</option>
                    <option value="custom">+ Custom Method</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom method..."
                      value={customMethod}
                      onChange={(e) => setCustomMethod(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomMethod(false);
                        setCustomMethod('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check In Time</Label>
                  <Input
                    type="time"
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                    placeholder={defaultTimings.checkInTime}
                  />
                  <p className="text-xs text-gray-500">Default: {defaultTimings.checkInTime}</p>
                </div>
                <div className="space-y-2">
                  <Label>Check Out Time</Label>
                  <Input
                    type="time"
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                    placeholder={defaultTimings.checkOutTime}
                  />
                  <p className="text-xs text-gray-500">Default: {defaultTimings.checkOutTime}</p>
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
              <Button variant="outline" onClick={() => {
                setIsMarkAttendanceOpen(false);
                setShowCustomStatus(false);
                setCustomStatus('');
                setShowCustomMethod(false);
                setCustomMethod('');
              }}>
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
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setShowCustomStatusEdit(false);
              setCustomStatusEdit('');
            }
          }}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Attendance</DialogTitle>
                <DialogDescription>Update attendance record for {editingRecord.memberName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Default Timings Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 font-medium text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Default Office Timings
                  </div>
                  <div className="text-xs text-blue-600">
                    Check-in: {defaultTimings.checkInTime} | Check-out: {defaultTimings.checkOutTime}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  {!showCustomStatusEdit ? (
                    <select
                      value={editingRecord.status}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setShowCustomStatusEdit(true);
                        } else {
                          setEditingRecord({ ...editingRecord, status: e.target.value as any });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half-day">Half Day</option>
                      <option value="late">Late</option>
                      <option value="leave">On Leave</option>
                      <option value="work-from-home">Work From Home</option>
                      <option value="sick-leave">Sick Leave</option>
                      <option value="casual-leave">Casual Leave</option>
                      <option value="custom">+ Custom Status</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom status..."
                        value={customStatusEdit}
                        onChange={(e) => setCustomStatusEdit(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomStatusEdit(false);
                          setCustomStatusEdit('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Check In</Label>
                    <Input
                      type="time"
                      value={editingRecord.checkIn}
                      onChange={(e) => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Default: {defaultTimings.checkInTime}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Check Out</Label>
                    <Input
                      type="time"
                      value={editingRecord.checkOut}
                      onChange={(e) => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Default: {defaultTimings.checkOutTime}</p>
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
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setShowCustomStatusEdit(false);
                  setCustomStatusEdit('');
                }}>
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

        {/* Default Timings Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Default Timing Settings
              </DialogTitle>
              <DialogDescription>
                Set default check-in and check-out timings for all employees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Check-In Time *</Label>
                  <Input
                    type="time"
                    value={editingTimings.checkInTime}
                    onChange={(e) => setEditingTimings({ ...editingTimings, checkInTime: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">When employees should check in</p>
                </div>
                <div className="space-y-2">
                  <Label>Default Check-Out Time *</Label>
                  <Input
                    type="time"
                    value={editingTimings.checkOutTime}
                    onChange={(e) => setEditingTimings({ ...editingTimings, checkOutTime: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">When employees should check out</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Late Threshold (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={editingTimings.lateThresholdMinutes}
                    onChange={(e) => setEditingTimings({ ...editingTimings, lateThresholdMinutes: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">Mark as late after these minutes</p>
                </div>
                <div className="space-y-2">
                  <Label>Half Day Hours</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={editingTimings.halfDayHours}
                    onChange={(e) => setEditingTimings({ ...editingTimings, halfDayHours: parseInt(e.target.value) || 4 })}
                  />
                  <p className="text-xs text-gray-500">Working hours for half day</p>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <strong>Note:</strong> These settings will apply as defaults for all employees. Individual records can still be edited with different timings.
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTimings} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Biometric Scanning Dialog */}
        <Dialog open={isBiometricDialogOpen} onOpenChange={(open) => {
          if (!isScanning) {
            setIsBiometricDialogOpen(open);
            if (!open) {
              setSelectedBiometricMember('');
              setScanResult(null);
              setScanProgress(0);
            }
          }
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fingerprint className={`h-5 w-5 ${biometricAction === 'check-in' ? 'text-green-600' : 'text-red-600'}`} />
                Biometric {biometricAction === 'check-in' ? 'Check-In' : 'Check-Out'}
              </DialogTitle>
              <DialogDescription>
                {isScanning 
                  ? 'Scanning in progress. Please wait...'
                  : `Select employee and device to ${biometricAction === 'check-in' ? 'check in' : 'check out'}`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {!isScanning ? (
                <>
                  {/* Employee Selection */}
                  <div className="space-y-2">
                    <Label>Select Employee *</Label>
                    <select
                      value={selectedBiometricMember}
                      onChange={(e) => setSelectedBiometricMember(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose an employee</option>
                      {teamMembers.map(member => {
                        const today = new Date().toISOString().split('T')[0];
                        const record = attendanceRecords.find(r => r.memberId === member.id && r.date === today);
                        const canCheckIn = biometricAction === 'check-in' && !record?.checkIn;
                        const canCheckOut = biometricAction === 'check-out' && record?.checkIn && !record?.checkOut;
                        const isDisabled = biometricAction === 'check-in' ? !canCheckIn && record?.checkIn : !canCheckOut;
                        
                        return (
                          <option 
                            key={member.id} 
                            value={member.id}
                            disabled={isDisabled}
                          >
                            {member.name} - {member.role}
                            {record?.checkIn && biometricAction === 'check-in' ? ' (Already checked in)' : ''}
                            {!record?.checkIn && biometricAction === 'check-out' ? ' (Not checked in yet)' : ''}
                            {record?.checkOut && biometricAction === 'check-out' ? ' (Already checked out)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Device Selection */}
                  <div className="space-y-2">
                    <Label>Select Biometric Device *</Label>
                    <div className="space-y-2">
                      {biometricDevices.map(device => (
                        <div 
                          key={device.id}
                          onClick={() => device.status === 'connected' && setSelectedDevice(device.id)}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedDevice === device.id && device.status === 'connected'
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : device.status === 'connected'
                                ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              device.status === 'connected' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {device.type === 'fingerprint' && <Fingerprint className={`h-5 w-5 ${device.status === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />}
                              {device.type === 'face-recognition' && <UserCheck className={`h-5 w-5 ${device.status === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />}
                              {device.type === 'card-reader' && <Scan className={`h-5 w-5 ${device.status === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />}
                              {device.type === 'iris-scanner' && <Activity className={`h-5 w-5 ${device.status === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{device.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{device.type.replace('-', ' ')}</div>
                            </div>
                          </div>
                          <Badge className={device.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                            {device.status === 'connected' ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Fingerprint className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <strong>Instructions:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li>Select an employee from the dropdown</li>
                          <li>Choose an online biometric device</li>
                          <li>Click "Start Scan" to begin verification</li>
                          <li>The employee's attendance will be recorded automatically</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Scanning Animation */
                <div className="flex flex-col items-center py-8">
                  <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                    scanResult === 'success' ? 'bg-green-100' :
                    scanResult === 'failed' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    {scanResult === null && (
                      <>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-30"></div>
                        <div className="absolute inset-2 rounded-full border-4 border-blue-400 animate-pulse"></div>
                      </>
                    )}
                    {scanResult === 'success' ? (
                      <CheckCircle2 className="h-16 w-16 text-green-600" />
                    ) : scanResult === 'failed' ? (
                      <XCircle className="h-16 w-16 text-red-600" />
                    ) : (
                      <Fingerprint className="h-16 w-16 text-blue-600 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="mt-6 w-full max-w-xs">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {scanResult === 'success' ? 'Verified!' :
                         scanResult === 'failed' ? 'Verification Failed' :
                         'Scanning...'}
                      </span>
                      <span className="text-blue-600 font-medium">{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          scanResult === 'success' ? 'bg-green-500' :
                          scanResult === 'failed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {scanResult === null && (
                    <p className="mt-4 text-sm text-gray-500 animate-pulse">
                      Place your finger on the scanner...
                    </p>
                  )}
                  
                  {scanResult === 'success' && (
                    <p className="mt-4 text-sm text-green-600 font-medium">
                      ✓ {biometricAction === 'check-in' ? 'Check-in' : 'Check-out'} recorded successfully!
                    </p>
                  )}
                  
                  {scanResult === 'failed' && (
                    <p className="mt-4 text-sm text-red-600">
                      Fingerprint not recognized. Please try again.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              {!isScanning ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsBiometricDialogOpen(false);
                    setSelectedBiometricMember('');
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={startBiometricScan}
                    disabled={!selectedBiometricMember || !biometricDevices.find(d => d.id === selectedDevice && d.status === 'connected')}
                    className={biometricAction === 'check-in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    Start Scan
                  </Button>
                </>
              ) : scanResult === null ? (
                <Button variant="outline" onClick={cancelScan}>
                  Cancel Scan
                </Button>
              ) : scanResult === 'failed' ? (
                <Button onClick={() => {
                  setScanResult(null);
                  setScanProgress(0);
                  setIsScanning(false);
                }} className="bg-blue-600 hover:bg-blue-700">
                  Try Again
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
