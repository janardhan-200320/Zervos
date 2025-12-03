import { useEffect, useState, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Users, Mail, Phone, Calendar, MoreVertical, UserPlus, Briefcase, MapPin, Clock, Shield, CheckCircle2, User, Edit, FileText, CreditCard, Upload, Camera, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  appointmentsCount: number;
  availability: string;
  hasAssignments?: boolean;
  profilePicture?: string;
  idType?: string;
  idNumber?: string;
  customWorkHoursStart?: string;
  customWorkHoursEnd?: string;
  customWorkDays?: string[];
}

interface Session {
  id: string;
  name: string;
  assignedSalespersons?: string[];
}

export default function TeamMembersPage() {
  const { selectedWorkspace } = useWorkspace();
  const [company, setCompany] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom field states
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [showCustomIdType, setShowCustomIdType] = useState(false);
  const [showCustomWorkHours, setShowCustomWorkHours] = useState(false);
  const [editShowCustomRole, setEditShowCustomRole] = useState(false);
  const [editShowCustomDepartment, setEditShowCustomDepartment] = useState(false);
  const [editShowCustomIdType, setEditShowCustomIdType] = useState(false);
  const [editShowCustomWorkHours, setEditShowCustomWorkHours] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff',
    customRole: '',
    department: '',
    customDepartment: '',
    workAssigned: '',
    location: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    workHours: 'Mon-Fri, 9 AM - 5 PM',
    customWorkHoursStart: '09:00',
    customWorkHoursEnd: '17:00',
    customWorkDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    emergencyContact: '',
    address: '',
    skills: '',
    reportingTo: '',
    idType: '',
    customIdType: '',
    idNumber: '',
    profilePicture: '',
  });
  const [formStep, setFormStep] = useState(1);

  // Compute workspace-scoped storage keys
  const teamMembersStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_team_members::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  const sessionsStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_sales_calls::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_company');
      if (raw) setCompany(JSON.parse(raw));
    } catch {}
  }, []);

  const defaultMembers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Recruiter',
      email: 'sarah@company.com',
      phone: '+1 234 567 8900',
      appointmentsCount: 45,
      availability: 'Mon-Fri, 9 AM - 5 PM'
    },
    {
      id: '2',
      name: 'Mike Williams',
      role: 'HR Manager',
      email: 'mike@company.com',
      phone: '+1 234 567 8901',
      appointmentsCount: 32,
      availability: 'Mon-Fri, 10 AM - 6 PM'
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'Talent Acquisition',
      email: 'emily@company.com',
      phone: '+1 234 567 8902',
      appointmentsCount: 28,
      availability: 'Tue-Sat, 9 AM - 5 PM'
    },
  ];

  // Load team members when workspace changes
  useEffect(() => {
    if (!teamMembersStorageKey) {
      setTeamMembers([]);
      return;
    }
    try {
      const savedMembers = localStorage.getItem(teamMembersStorageKey);
      if (savedMembers) {
        setTeamMembers(JSON.parse(savedMembers));
      } else {
        setTeamMembers(defaultMembers);
      }
    } catch {}
  }, [teamMembersStorageKey]);

  // Load sessions when workspace changes
  useEffect(() => {
    if (!sessionsStorageKey) {
      setSessions([]);
      return;
    }
    try {
      const savedSessions = localStorage.getItem(sessionsStorageKey);
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      } else {
        setSessions([]);
      }
    } catch {}
  }, [sessionsStorageKey]);

  // Calculate appointment count for each team member based on assigned sessions
  const teamMembersWithCounts = useMemo(() => {
    return teamMembers.map(member => {
      const assignedSessionsCount = sessions.filter(session => 
        session.assignedSalespersons && session.assignedSalespersons.includes(member.id)
      ).length;
      
      return {
        ...member,
        appointmentsCount: assignedSessionsCount,
        hasAssignments: assignedSessionsCount > 0
      };
    });
  }, [teamMembers, sessions]);

  const handleCreateMember = () => {
    if (!teamMembersStorageKey) {
      return;
    }
    
    // Validation
    if (!newMember.name.trim() || !newMember.email.trim()) {
      alert('Please fill in Name and Email fields');
      return;
    }
    
    // Determine final values for custom fields
    const finalRole = showCustomRole && newMember.customRole ? newMember.customRole : newMember.role;
    const finalDepartment = showCustomDepartment && newMember.customDepartment ? newMember.customDepartment : newMember.department;
    const finalIdType = showCustomIdType && newMember.customIdType ? newMember.customIdType : newMember.idType;
    
    // Determine work hours
    let finalWorkHours = newMember.workHours;
    if (showCustomWorkHours) {
      const daysStr = newMember.customWorkDays.join(', ');
      const startTime = formatTime(newMember.customWorkHoursStart);
      const endTime = formatTime(newMember.customWorkHoursEnd);
      finalWorkHours = `${daysStr}, ${startTime} - ${endTime}`;
    }
    
    const member = {
      id: `${Date.now()}-${Math.random()}`,
      name: newMember.name.trim(),
      role: finalRole,
      email: newMember.email.trim(),
      phone: newMember.phone.trim(),
      appointmentsCount: 0,
      availability: finalWorkHours,
      department: finalDepartment,
      workAssigned: newMember.workAssigned,
      location: newMember.location,
      joiningDate: newMember.joiningDate,
      employeeId: newMember.employeeId,
      emergencyContact: newMember.emergencyContact,
      address: newMember.address,
      skills: newMember.skills,
      reportingTo: newMember.reportingTo,
      idType: finalIdType,
      idNumber: newMember.idNumber,
      profilePicture: newMember.profilePicture,
      customWorkHoursStart: showCustomWorkHours ? newMember.customWorkHoursStart : undefined,
      customWorkHoursEnd: showCustomWorkHours ? newMember.customWorkHoursEnd : undefined,
      customWorkDays: showCustomWorkHours ? newMember.customWorkDays : undefined,
    };

    const updatedMembers = [...teamMembers, member];
    persistTeamMembers(updatedMembers);
    
    setIsNewMemberOpen(false);
    setFormStep(1);
    setShowCustomRole(false);
    setShowCustomDepartment(false);
    setShowCustomIdType(false);
    setShowCustomWorkHours(false);
    setNewMember({
      name: '',
      email: '',
      phone: '',
      role: 'Staff',
      customRole: '',
      department: '',
      customDepartment: '',
      workAssigned: '',
      location: '',
      joiningDate: new Date().toISOString().split('T')[0],
      employeeId: '',
      workHours: 'Mon-Fri, 9 AM - 5 PM',
      customWorkHoursStart: '09:00',
      customWorkHoursEnd: '17:00',
      customWorkDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      emergencyContact: '',
      address: '',
      skills: '',
      reportingTo: '',
      idType: '',
      customIdType: '',
      idNumber: '',
      profilePicture: '',
    });
  };

  // Helper function to format time
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}${minutes !== '00' ? ':' + minutes : ''} ${ampm}`;
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEdit && editingMember) {
          setEditingMember({ ...editingMember, profilePicture: base64String });
        } else {
          setNewMember({ ...newMember, profilePicture: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = (isEdit = false) => {
    if (isEdit && editingMember) {
      setEditingMember({ ...editingMember, profilePicture: '' });
    } else {
      setNewMember({ ...newMember, profilePicture: '' });
    }
  };

  // Toggle work day selection
  const toggleWorkDay = (day: string, isEdit = false) => {
    if (isEdit && editingMember) {
      const currentDays = (editingMember as any).customWorkDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const newDays = currentDays.includes(day) 
        ? currentDays.filter((d: string) => d !== day)
        : [...currentDays, day];
      setEditingMember({ ...editingMember, customWorkDays: newDays } as any);
    } else {
      const newDays = newMember.customWorkDays.includes(day)
        ? newMember.customWorkDays.filter(d => d !== day)
        : [...newMember.customWorkDays, day];
      setNewMember({ ...newMember, customWorkDays: newDays });
    }
  };

  const persistTeamMembers = (items: TeamMember[]) => {
    setTeamMembers(items);
    if (teamMembersStorageKey) {
      try {
        localStorage.setItem(teamMembersStorageKey, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent('team-members-updated'));
      } catch {}
    }
    // Sync with Admin Center unified store (zervos_salespersons)
    try {
      const adminRaw = localStorage.getItem('zervos_salespersons');
      const adminList = adminRaw ? JSON.parse(adminRaw) : [];
      const byIdOrEmail = new Map<string, any>();
      for (const sp of adminList) {
        const key = (sp.id || sp.email || '').toLowerCase();
        if (key) byIdOrEmail.set(key, sp);
      }

      const roleToAdminRole = (r: string) => {
        if (r === 'Admin' || r === 'Super Admin') return r;
        return 'Staff';
      };
      const permsForRole = (role: string) => {
        const isAdmin = role === 'Admin' || role === 'Super Admin';
        const strong = (view=true) => ({ canView: view, canCreate: isAdmin, canEdit: isAdmin, canDelete: false });
        return [
          { module: 'Dashboard', ...strong(true) },
          { module: 'Appointments', ...strong(true) },
          { module: 'Customers', ...strong(true) },
          { module: 'Services', ...strong(true) },
          { module: 'Reports', ...strong(false) },
          { module: 'Settings', ...strong(isAdmin) },
          { module: 'Workflows', ...strong(isAdmin) },
          { module: 'Team', ...strong(isAdmin) },
          { module: 'Sales Calls', ...strong(true) },
          { module: 'Availability', ...strong(true) },
          { module: 'Booking Pages', ...strong(true) },
        ];
      };
      const mergePermsForRole = (existing: any[] | undefined, role: string) => {
        const tmpl = permsForRole(role);
        const map = new Map<string, any>();
        if (Array.isArray(existing)) for (const p of existing) map.set(p.module, { ...p });
        for (const t of tmpl) {
          const cur = map.get(t.module);
          if (!cur) { map.set(t.module, { ...t }); continue; }
          // Upgrade privileges to at least template for the role (e.g., Admin gets create/edit)
          map.set(t.module, {
            module: t.module,
            canView: !!(cur.canView || t.canView),
            canCreate: !!(cur.canCreate || t.canCreate),
            canEdit: !!(cur.canEdit || t.canEdit),
            canDelete: !!(cur.canDelete && t.canDelete),
          });
        }
        return Array.from(map.values());
      };

      const merged: any[] = Array.isArray(adminList) ? [...adminList] : [];
      for (const m of items) {
        const key1 = (m.id || '').toLowerCase();
        const key2 = (m.email || '').toLowerCase();
        const existing = (key1 && byIdOrEmail.get(key1)) || (key2 && byIdOrEmail.get(key2));
        const adminRole = roleToAdminRole(m.role);
        const base = existing || {};
        const updated = {
          ...base,
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone || base.phone || '',
          role: adminRole,
          workspace: base.workspace || 'bharath',
          status: base.status || 'Active',
          availability: m.availability || base.availability || 'Full Time',
          workload: base.workload || 'Low',
          profilePicture: base.profilePicture,
          permissions: mergePermsForRole(base.permissions, adminRole),
          availabilitySchedule: base.availabilitySchedule,
          timezone: base.timezone || 'Asia/Kolkata',
          totalBookings: typeof base.totalBookings === 'number' ? base.totalBookings : 0,
          averageRating: typeof base.averageRating === 'number' ? base.averageRating : 0,
          bookingLink: base.bookingLink || `/book/team/${(m.name || 'member').toLowerCase().replace(/\s+/g,'-')}-${m.id}`,
          teamViewLink: base.teamViewLink || `/team/public/${m.id}`,
          notes: base.notes || '',
        };
        // Replace or add
        const idx = merged.findIndex((sp) => sp.id === updated.id || sp.email === updated.email);
        if (idx >= 0) merged[idx] = updated; else merged.push(updated);
      }
      localStorage.setItem('zervos_salespersons', JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('team-members-updated'));
    } catch {}
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember({ ...member });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;
    const updated = teamMembers.map(m => m.id === editingMember.id ? editingMember : m);
    persistTeamMembers(updated);
    setIsEditOpen(false);
    setEditingMember(null);
  };

  const handleRemoveMember = (member: TeamMember) => {
    const updatedMembers = teamMembers.filter(m => m.id !== member.id);
    persistTeamMembers(updatedMembers);
    // Also unassign from sessions for this workspace
    try {
      if (sessionsStorageKey) {
        const raw = localStorage.getItem(sessionsStorageKey);
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr)) {
          const cleaned = arr.map((s: any) => ({
            ...s,
            assignedSalespersons: Array.isArray(s?.assignedSalespersons)
              ? s.assignedSalespersons.filter((id: any) => id !== member.id && id !== member.email)
              : s.assignedSalespersons
          }));
          localStorage.setItem(sessionsStorageKey, JSON.stringify(cleaned));
          setSessions(cleaned);
          window.dispatchEvent(new CustomEvent('sales-calls-updated', { detail: { workspaceId: selectedWorkspace?.id } }));
        }
      }
    } catch {}
    // Remove from Admin Center unified store as well
    try {
      const adminRaw = localStorage.getItem('zervos_salespersons');
      const adminList = adminRaw ? JSON.parse(adminRaw) : [];
      const cleaned = Array.isArray(adminList) ? adminList.filter((sp:any)=> sp.id !== member.id && sp.email !== member.email) : adminList;
      localStorage.setItem('zervos_salespersons', JSON.stringify(cleaned));
      window.dispatchEvent(new CustomEvent('team-members-updated'));
    } catch {}
  };

  const teamMemberLabel = company?.teamMemberLabel || 'Team Members';
  const teamMemberSingular = teamMemberLabel.endsWith('s') ? teamMemberLabel.slice(0, -1) : teamMemberLabel;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Workspace guard */}
        {!selectedWorkspace && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            Please select a workspace from the "My Space" dropdown to manage {teamMemberLabel.toLowerCase()}.
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-purple-600" size={28} />
              {teamMemberLabel}
            </h1>
            <p className="text-gray-600 mt-1">Manage your {teamMemberLabel.toLowerCase()} and their availability</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => window.location.href = '/dashboard/team-attendance'} 
              variant="outline" 
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              disabled={!selectedWorkspace}
            >
              <Calendar size={18} />
              Attendance
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard/team-reports'} 
              variant="outline" 
              className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
              disabled={!selectedWorkspace}
            >
              <FileText size={18} />
              Reports
            </Button>
            <Button onClick={() => setIsNewMemberOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700" disabled={!selectedWorkspace}>
              <UserPlus size={18} />
              Add {teamMemberSingular}
            </Button>
          </div>
        </div>

        {/* Team Members Grid */}
        {teamMembersWithCounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembersWithCounts.map((member) => (
              <div 
                key={member.id} 
                className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-all ${
                  member.hasAssignments ? 'ring-2 ring-purple-500 ring-opacity-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {member.profilePicture ? (
                      <img 
                        src={member.profilePicture} 
                        alt={member.name}
                        className={`h-12 w-12 rounded-full object-cover ${
                          member.hasAssignments ? 'ring-2 ring-purple-500' : ''
                        }`}
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-full ${
                        member.hasAssignments 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      } flex items-center justify-center text-white font-bold`}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        {member.hasAssignments && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member)}>
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{member.availability}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Assigned Sessions</span>
                    <span className={`text-lg font-semibold ${
                      member.hasAssignments ? 'text-purple-600' : 'text-gray-400'
                    }`}>
                      {member.appointmentsCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {teamMemberLabel.toLowerCase()} yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first {teamMemberSingular.toLowerCase()} to start managing assignments
            </p>
            <Button onClick={() => setIsNewMemberOpen(true)} className="gap-2">
              <UserPlus size={18} />
              Add {teamMemberSingular}
            </Button>
          </div>
        )}

        {/* Add Team Member Modal - Multi-Step Form */}
        <Dialog open={isNewMemberOpen} onOpenChange={(open) => {
          setIsNewMemberOpen(open);
          if (!open) setFormStep(1);
        }}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-purple-600" />
                Add New {teamMemberSingular}
              </DialogTitle>
              <DialogDescription>
                Complete the form to add a new team member
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6 px-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      formStep === step 
                        ? 'bg-purple-600 text-white ring-4 ring-purple-200' 
                        : formStep > step 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {formStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${
                      formStep === step ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      {step === 1 ? 'Basic Info' : step === 2 ? 'Work Details' : 'Additional'}
                    </span>
                  </div>
                  {step < 3 && (
                    <div className={`h-1 flex-1 mx-2 rounded transition-all ${
                      formStep > step ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6 py-4">
              {/* Step 1: Basic Information */}
              {formStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>
                    <p className="text-sm text-purple-700">Enter the basic details of the team member</p>
                  </div>

                  {/* Profile Picture Upload */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {newMember.profilePicture ? (
                        <div className="relative">
                          <img 
                            src={newMember.profilePicture} 
                            alt="Profile" 
                            className="h-28 w-28 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                          />
                          <button
                            onClick={() => removeProfilePicture()}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 shadow-md"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="h-28 w-28 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-4 border-dashed border-purple-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:from-purple-200 hover:to-purple-300 transition-all"
                        >
                          <Upload className="h-8 w-8 text-purple-500 mb-1" />
                          <span className="text-xs text-purple-600 font-medium">Add Photo</span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleProfilePictureUpload(e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-1">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@company.com"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                          className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        placeholder="EMP-001"
                        value={newMember.employeeId}
                        onChange={(e) => setNewMember({ ...newMember, employeeId: e.target.value })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    {/* ID Type Dropdown with Custom Option */}
                    <div className="space-y-2">
                      <Label htmlFor="idType" className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        ID Type
                      </Label>
                      {!showCustomIdType ? (
                        <select
                          id="idType"
                          value={newMember.idType}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setShowCustomIdType(true);
                              setNewMember({ ...newMember, idType: '' });
                            } else {
                              setNewMember({ ...newMember, idType: e.target.value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select ID Type</option>
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Passport">Passport</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Ration Card">Ration Card</option>
                          <option value="Employee ID Card">Employee ID Card</option>
                          <option value="Government ID">Government ID</option>
                          <option value="custom">✨ Custom ID Type...</option>
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter custom ID type"
                            value={newMember.customIdType}
                            onChange={(e) => setNewMember({ ...newMember, customIdType: e.target.value })}
                            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCustomIdType(false);
                              setNewMember({ ...newMember, customIdType: '' });
                            }}
                            className="shrink-0"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* ID Number */}
                    <div className="space-y-2">
                      <Label htmlFor="idNumber">ID Number</Label>
                      <Input
                        id="idNumber"
                        placeholder="Enter ID number"
                        value={newMember.idNumber}
                        onChange={(e) => setNewMember({ ...newMember, idNumber: e.target.value })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="joiningDate"
                          type="date"
                          value={newMember.joiningDate}
                          onChange={(e) => setNewMember({ ...newMember, joiningDate: e.target.value })}
                          className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location / Office</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          placeholder="Mumbai Office"
                          value={newMember.location}
                          onChange={(e) => setNewMember({ ...newMember, location: e.target.value })}
                          className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Full Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street, City, State, ZIP"
                        value={newMember.address}
                        onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        placeholder="Name: Jane Doe, Phone: +91 98765 43211"
                        value={newMember.emergencyContact}
                        onChange={(e) => setNewMember({ ...newMember, emergencyContact: e.target.value })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Work Details */}
              {formStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5" />
                      Work & Role Information
                    </h3>
                    <p className="text-sm text-blue-700">Define the role, department, and responsibilities</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role / Position with Custom Option */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="flex items-center gap-1">
                        Role / Position <span className="text-red-500">*</span>
                      </Label>
                      {!showCustomRole ? (
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            id="role"
                            value={newMember.role}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setShowCustomRole(true);
                                setNewMember({ ...newMember, role: '' });
                              } else {
                                setNewMember({ ...newMember, role: e.target.value });
                              }
                            }}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Team Lead">Team Lead</option>
                            <option value="Senior Staff">Senior Staff</option>
                            <option value="Junior Staff">Junior Staff</option>
                            <option value="Intern">Intern</option>
                            <option value="Consultant">Consultant</option>
                            <option value="Contractor">Contractor</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Viewer">Viewer</option>
                            <option value="custom">✨ Custom Role...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Enter custom role/position"
                              value={newMember.customRole}
                              onChange={(e) => setNewMember({ ...newMember, customRole: e.target.value })}
                              className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCustomRole(false);
                              setNewMember({ ...newMember, customRole: '', role: 'Staff' });
                            }}
                            className="shrink-0"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Department with Custom Option */}
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      {!showCustomDepartment ? (
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            id="department"
                            value={newMember.department}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setShowCustomDepartment(true);
                                setNewMember({ ...newMember, department: '' });
                              } else {
                                setNewMember({ ...newMember, department: e.target.value });
                              }
                            }}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">Select Department</option>
                            <option value="Sales">Sales</option>
                            <option value="Marketing">Marketing</option>
                            <option value="HR">Human Resources</option>
                            <option value="IT">IT & Technology</option>
                            <option value="Operations">Operations</option>
                            <option value="Customer Service">Customer Service</option>
                            <option value="Finance">Finance</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Product">Product</option>
                            <option value="Design">Design</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Quality Assurance">Quality Assurance</option>
                            <option value="Legal">Legal</option>
                            <option value="Administration">Administration</option>
                            <option value="Research">Research & Development</option>
                            <option value="custom">✨ Custom Department...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Enter custom department"
                              value={newMember.customDepartment}
                              onChange={(e) => setNewMember({ ...newMember, customDepartment: e.target.value })}
                              className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCustomDepartment(false);
                              setNewMember({ ...newMember, customDepartment: '', department: '' });
                            }}
                            className="shrink-0"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="workAssigned">Work Assigned / Responsibilities</Label>
                      <textarea
                        id="workAssigned"
                        placeholder="Describe the main responsibilities and tasks assigned to this team member..."
                        value={newMember.workAssigned}
                        onChange={(e) => setNewMember({ ...newMember, workAssigned: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    </div>

                    {/* Work Hours with Custom Option */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="workHours" className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Work Hours / Availability
                      </Label>
                      
                      {!showCustomWorkHours ? (
                        <div className="space-y-2">
                          <select
                            id="workHours"
                            value={newMember.workHours}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setShowCustomWorkHours(true);
                              } else {
                                setNewMember({ ...newMember, workHours: e.target.value });
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="Mon-Fri, 9 AM - 5 PM">Mon-Fri, 9 AM - 5 PM (Standard)</option>
                            <option value="Mon-Fri, 10 AM - 6 PM">Mon-Fri, 10 AM - 6 PM</option>
                            <option value="Mon-Fri, 8 AM - 4 PM">Mon-Fri, 8 AM - 4 PM</option>
                            <option value="Mon-Fri, 6 AM - 2 PM">Mon-Fri, 6 AM - 2 PM (Morning Shift)</option>
                            <option value="Mon-Fri, 2 PM - 10 PM">Mon-Fri, 2 PM - 10 PM (Evening Shift)</option>
                            <option value="Mon-Fri, 10 PM - 6 AM">Mon-Fri, 10 PM - 6 AM (Night Shift)</option>
                            <option value="Mon-Sat, 9 AM - 5 PM">Mon-Sat, 9 AM - 5 PM</option>
                            <option value="Mon-Sat, 10 AM - 7 PM">Mon-Sat, 10 AM - 7 PM</option>
                            <option value="Tue-Sat, 9 AM - 5 PM">Tue-Sat, 9 AM - 5 PM</option>
                            <option value="Sun-Thu, 9 AM - 5 PM">Sun-Thu, 9 AM - 5 PM</option>
                            <option value="Flexible Hours">Flexible Hours</option>
                            <option value="Shift Work">Shift Work (Rotating)</option>
                            <option value="Part Time">Part Time</option>
                            <option value="Remote - Flexible">Remote - Flexible</option>
                            <option value="custom">✨ Custom Schedule...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-blue-900">Custom Work Schedule</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowCustomWorkHours(false);
                                setNewMember({ ...newMember, workHours: 'Mon-Fri, 9 AM - 5 PM' });
                              }}
                            >
                              Use Preset
                            </Button>
                          </div>
                          
                          {/* Work Days Selection */}
                          <div className="space-y-2">
                            <Label className="text-sm">Working Days</Label>
                            <div className="flex flex-wrap gap-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleWorkDay(day)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    newMember.customWorkDays.includes(day)
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Time Selection */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startTime" className="text-sm">Start Time</Label>
                              <Input
                                id="startTime"
                                type="time"
                                value={newMember.customWorkHoursStart}
                                onChange={(e) => setNewMember({ ...newMember, customWorkHoursStart: e.target.value })}
                                className="border-gray-300 focus:border-purple-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="endTime" className="text-sm">End Time</Label>
                              <Input
                                id="endTime"
                                type="time"
                                value={newMember.customWorkHoursEnd}
                                onChange={(e) => setNewMember({ ...newMember, customWorkHoursEnd: e.target.value })}
                                className="border-gray-300 focus:border-purple-500"
                              />
                            </div>
                          </div>
                          
                          {/* Preview */}
                          <div className="bg-white border border-blue-200 rounded p-3">
                            <p className="text-xs text-gray-500 mb-1">Schedule Preview:</p>
                            <p className="text-sm font-medium text-blue-900">
                              {newMember.customWorkDays.length > 0 
                                ? `${newMember.customWorkDays.join(', ')}, ${formatTime(newMember.customWorkHoursStart)} - ${formatTime(newMember.customWorkHoursEnd)}`
                                : 'Select working days'
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reportingTo">Reporting To</Label>
                      <select
                        id="reportingTo"
                        value={newMember.reportingTo}
                        onChange={(e) => setNewMember({ ...newMember, reportingTo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Reporting Manager</option>
                        {teamMembers
                          .filter(m => m.role === 'Admin' || m.role === 'Super Admin' || m.role === 'Manager' || m.role === 'Team Lead')
                          .map(m => (
                            <option key={m.id} value={m.name}>{m.name} - {m.role}</option>
                          ))
                        }
                        <option value="Direct to Management">Direct to Management</option>
                        <option value="CEO / Founder">CEO / Founder</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Additional Details */}
              {formStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-green-900 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Additional Information
                    </h3>
                    <p className="text-sm text-green-700">Add skills and other relevant details</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills & Expertise</Label>
                      <textarea
                        id="skills"
                        placeholder="List skills, certifications, and areas of expertise (comma-separated)&#10;Example: Project Management, Communication, Technical Support, Sales"
                        value={newMember.skills}
                        onChange={(e) => setNewMember({ ...newMember, skills: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    </div>

                    {/* Summary Preview */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                      <h4 className="font-semibold text-lg text-purple-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Member Summary
                      </h4>
                      
                      {/* Profile Picture Preview */}
                      <div className="flex justify-center mb-4">
                        {newMember.profilePicture ? (
                          <img 
                            src={newMember.profilePicture} 
                            alt="Profile Preview" 
                            className="h-20 w-20 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {newMember.name ? newMember.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'TM'}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 font-medium">Name:</span>
                          <p className="text-gray-900">{newMember.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Email:</span>
                          <p className="text-gray-900">{newMember.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Phone:</span>
                          <p className="text-gray-900">{newMember.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Role:</span>
                          <p className="text-gray-900">{showCustomRole ? newMember.customRole || 'Not specified' : newMember.role}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Department:</span>
                          <p className="text-gray-900">{showCustomDepartment ? newMember.customDepartment || 'Not assigned' : newMember.department || 'Not assigned'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Location:</span>
                          <p className="text-gray-900">{newMember.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Work Hours:</span>
                          <p className="text-gray-900">
                            {showCustomWorkHours 
                              ? `${newMember.customWorkDays.join(', ')}, ${formatTime(newMember.customWorkHoursStart)} - ${formatTime(newMember.customWorkHoursEnd)}`
                              : newMember.workHours
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Joining Date:</span>
                          <p className="text-gray-900">{new Date(newMember.joiningDate).toLocaleDateString('en-GB')}</p>
                        </div>
                        {(newMember.idType || newMember.customIdType) && (
                          <div>
                            <span className="text-gray-600 font-medium">ID Type:</span>
                            <p className="text-gray-900">{showCustomIdType ? newMember.customIdType : newMember.idType}</p>
                          </div>
                        )}
                        {newMember.idNumber && (
                          <div>
                            <span className="text-gray-600 font-medium">ID Number:</span>
                            <p className="text-gray-900">{newMember.idNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between items-center gap-2 pt-4 border-t">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsNewMemberOpen(false);
                    setFormStep(1);
                  }}
                >
                  Cancel
                </Button>
              </div>
              <div className="flex gap-2">
                {formStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setFormStep(formStep - 1)}
                  >
                    Previous
                  </Button>
                )}
                {formStep < 3 ? (
                  <Button
                    onClick={() => setFormStep(formStep + 1)}
                    disabled={formStep === 1 && (!newMember.name.trim() || !newMember.email.trim())}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCreateMember}
                    disabled={!newMember.name.trim() || !newMember.email.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Member Profile Modal */}
        {selectedMember && (
          <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedMember.name}</DialogTitle>
                <DialogDescription className="text-base">{selectedMember.role}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-center">
                  {selectedMember.profilePicture ? (
                    <img 
                      src={selectedMember.profilePicture} 
                      alt={selectedMember.name}
                      className="h-28 w-28 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                      {selectedMember.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>

                {/* Personal Information */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-3">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </Label>
                      <p className="text-sm font-medium">{selectedMember.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </Label>
                      <p className="text-sm font-medium">{selectedMember.phone || 'Not provided'}</p>
                    </div>
                    {(selectedMember as any).employeeId && (
                      <div>
                        <Label className="text-xs text-gray-500">Employee ID</Label>
                        <p className="text-sm font-medium">{(selectedMember as any).employeeId}</p>
                      </div>
                    )}
                    {(selectedMember as any).idType && (
                      <div>
                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> ID Type
                        </Label>
                        <p className="text-sm font-medium">{(selectedMember as any).idType}</p>
                      </div>
                    )}
                    {(selectedMember as any).idNumber && (
                      <div>
                        <Label className="text-xs text-gray-500">ID Number</Label>
                        <p className="text-sm font-medium">{(selectedMember as any).idNumber}</p>
                      </div>
                    )}
                    {(selectedMember as any).address && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Address
                        </Label>
                        <p className="text-sm font-medium">{(selectedMember as any).address}</p>
                      </div>
                    )}
                    {(selectedMember as any).emergencyContact && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Emergency Contact</Label>
                        <p className="text-sm font-medium">{(selectedMember as any).emergencyContact}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5" />
                    Work Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Role
                      </Label>
                      <p className="text-sm font-medium">{selectedMember.role}</p>
                    </div>
                    {(selectedMember as any).department && (
                      <div>
                        <Label className="text-xs text-gray-500">Department</Label>
                        <p className="text-sm font-medium">{(selectedMember as any).department}</p>
                      </div>
                    )}
                    {(selectedMember as any).location && (
                      <div>
                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Location
                        </Label>
                        <p className="text-sm font-medium">{(selectedMember as any).location}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Work Hours
                      </Label>
                      <p className="text-sm font-medium">{selectedMember.availability}</p>
                    </div>
                    {(selectedMember as any).joiningDate && (
                      <div>
                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Joining Date
                        </Label>
                        <p className="text-sm font-medium">
                          {new Date((selectedMember as any).joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {(selectedMember as any).reportingTo && (
                      <div>
                        <Label className="text-xs text-gray-500">Reporting To</Label>
                        <p className="text-sm font-medium">{(selectedMember as any).reportingTo}</p>
                      </div>
                    )}
                    {(selectedMember as any).workAssigned && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Work Assigned</Label>
                        <p className="text-sm font-medium whitespace-pre-wrap">{(selectedMember as any).workAssigned}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills & Performance */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                    Skills & Performance
                  </h3>
                  <div className="space-y-4">
                    {(selectedMember as any).skills && (
                      <div>
                        <Label className="text-xs text-gray-500">Skills & Expertise</Label>
                        <p className="text-sm font-medium whitespace-pre-wrap">{(selectedMember as any).skills}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-gray-500">Assigned Sessions</Label>
                      <p className="text-3xl font-bold text-purple-600">{selectedMember.appointmentsCount}</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setSelectedMember(null)} className="w-full sm:w-auto">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Member Modal */}
        {isEditOpen && editingMember && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Edit className="h-6 w-6 text-blue-600" />
                  Edit Team Member Details
                </DialogTitle>
                <DialogDescription>Update team member information</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Profile Picture Upload */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    {editingMember.profilePicture ? (
                      <div className="relative">
                        <img 
                          src={editingMember.profilePicture} 
                          alt="Profile" 
                          className="h-24 w-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                        />
                        <button
                          onClick={() => removeProfilePicture(true)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editFileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 shadow-md"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => editFileInputRef.current?.click()}
                        className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-dashed border-blue-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:from-blue-200 hover:to-blue-300 transition-all"
                      >
                        <Upload className="h-6 w-6 text-blue-500 mb-1" />
                        <span className="text-xs text-blue-600 font-medium">Add Photo</span>
                      </div>
                    )}
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProfilePictureUpload(e, true)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name *</Label>
                      <Input 
                        id="edit-name"
                        value={editingMember.name} 
                        onChange={(e)=>setEditingMember({ ...editingMember, name: e.target.value })}
                        className="border-gray-300 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="edit-email"
                          value={editingMember.email} 
                          onChange={(e)=>setEditingMember({ ...editingMember, email: e.target.value })}
                          className="pl-10 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="edit-phone"
                          value={editingMember.phone} 
                          onChange={(e)=>setEditingMember({ ...editingMember, phone: e.target.value })}
                          className="pl-10 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-employeeId">Employee ID</Label>
                      <Input 
                        id="edit-employeeId"
                        value={(editingMember as any).employeeId || ''} 
                        onChange={(e)=>setEditingMember({ ...editingMember, employeeId: e.target.value } as any)}
                        className="border-gray-300 focus:border-purple-500"
                      />
                    </div>
                    
                    {/* ID Type with Custom Option */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-idType" className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4 text-gray-400" /> ID Type
                      </Label>
                      {!editShowCustomIdType ? (
                        <select
                          id="edit-idType"
                          value={(editingMember as any).idType || ''}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setEditShowCustomIdType(true);
                              setEditingMember({ ...editingMember, idType: '' } as any);
                            } else {
                              setEditingMember({ ...editingMember, idType: e.target.value } as any);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select ID Type</option>
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Passport">Passport</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Ration Card">Ration Card</option>
                          <option value="Employee ID Card">Employee ID Card</option>
                          <option value="Government ID">Government ID</option>
                          <option value="custom">✨ Custom ID Type...</option>
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter custom ID type"
                            value={(editingMember as any).idType || ''}
                            onChange={(e) => setEditingMember({ ...editingMember, idType: e.target.value } as any)}
                            className="border-gray-300 focus:border-purple-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditShowCustomIdType(false)}
                            className="shrink-0"
                          >
                            List
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-idNumber">ID Number</Label>
                      <Input 
                        id="edit-idNumber"
                        value={(editingMember as any).idNumber || ''} 
                        onChange={(e)=>setEditingMember({ ...editingMember, idNumber: e.target.value } as any)}
                        className="border-gray-300 focus:border-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-address">Full Address</Label>
                      <Input 
                        id="edit-address"
                        value={(editingMember as any).address || ''} 
                        onChange={(e)=>setEditingMember({ ...editingMember, address: e.target.value } as any)}
                        className="border-gray-300 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-emergency">Emergency Contact</Label>
                      <Input 
                        id="edit-emergency"
                        value={(editingMember as any).emergencyContact || ''} 
                        onChange={(e)=>setEditingMember({ ...editingMember, emergencyContact: e.target.value } as any)}
                        className="border-gray-300 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5" />
                    Work Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role with Custom Option */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role / Position *</Label>
                      {!editShowCustomRole ? (
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            id="edit-role"
                            value={editingMember.role}
                            onChange={(e)=>{
                              if (e.target.value === 'custom') {
                                setEditShowCustomRole(true);
                                setEditingMember({ ...editingMember, role: '' });
                              } else {
                                setEditingMember({ ...editingMember, role: e.target.value });
                              }
                            }}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Team Lead">Team Lead</option>
                            <option value="Senior Staff">Senior Staff</option>
                            <option value="Junior Staff">Junior Staff</option>
                            <option value="Intern">Intern</option>
                            <option value="Consultant">Consultant</option>
                            <option value="Contractor">Contractor</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Viewer">Viewer</option>
                            <option value="custom">✨ Custom Role...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Enter custom role"
                              value={editingMember.role}
                              onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                              className="pl-10 border-gray-300 focus:border-purple-500"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditShowCustomRole(false);
                              if (!editingMember.role) setEditingMember({ ...editingMember, role: 'Staff' });
                            }}
                            className="shrink-0"
                          >
                            List
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Department with Custom Option */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department</Label>
                      {!editShowCustomDepartment ? (
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            id="edit-department"
                            value={(editingMember as any).department || ''}
                            onChange={(e)=>{
                              if (e.target.value === 'custom') {
                                setEditShowCustomDepartment(true);
                                setEditingMember({ ...editingMember, department: '' } as any);
                              } else {
                                setEditingMember({ ...editingMember, department: e.target.value } as any);
                              }
                            }}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Department</option>
                            <option value="Sales">Sales</option>
                            <option value="Marketing">Marketing</option>
                            <option value="HR">Human Resources</option>
                            <option value="IT">IT & Technology</option>
                            <option value="Operations">Operations</option>
                            <option value="Customer Service">Customer Service</option>
                            <option value="Finance">Finance</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Product">Product</option>
                            <option value="Design">Design</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Quality Assurance">Quality Assurance</option>
                            <option value="Legal">Legal</option>
                            <option value="Administration">Administration</option>
                            <option value="Research">Research & Development</option>
                            <option value="custom">✨ Custom Department...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Enter custom department"
                              value={(editingMember as any).department || ''}
                              onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value } as any)}
                              className="pl-10 border-gray-300 focus:border-purple-500"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditShowCustomDepartment(false)}
                            className="shrink-0"
                          >
                            List
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Location / Office</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="edit-location"
                          value={(editingMember as any).location || ''} 
                          onChange={(e)=>setEditingMember({ ...editingMember, location: e.target.value } as any)}
                          className="pl-10 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    
                    {/* Work Hours with Custom Option */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-workHours">Work Hours / Availability</Label>
                      {!editShowCustomWorkHours ? (
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            id="edit-workHours"
                            value={editingMember.availability}
                            onChange={(e)=>{
                              if (e.target.value === 'custom') {
                                setEditShowCustomWorkHours(true);
                              } else {
                                setEditingMember({ ...editingMember, availability: e.target.value });
                              }
                            }}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="Mon-Fri, 9 AM - 5 PM">Mon-Fri, 9 AM - 5 PM</option>
                            <option value="Mon-Fri, 10 AM - 6 PM">Mon-Fri, 10 AM - 6 PM</option>
                            <option value="Mon-Fri, 8 AM - 4 PM">Mon-Fri, 8 AM - 4 PM</option>
                            <option value="Mon-Fri, 6 AM - 2 PM">Mon-Fri, 6 AM - 2 PM (Morning)</option>
                            <option value="Mon-Fri, 2 PM - 10 PM">Mon-Fri, 2 PM - 10 PM (Evening)</option>
                            <option value="Mon-Sat, 9 AM - 5 PM">Mon-Sat, 9 AM - 5 PM</option>
                            <option value="Flexible Hours">Flexible Hours</option>
                            <option value="Shift Work">Shift Work</option>
                            <option value="Part Time">Part Time</option>
                            <option value="custom">✨ Custom Schedule...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-blue-100 border border-blue-300 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">Custom Schedule</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditShowCustomWorkHours(false)}
                            >
                              Use Preset
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                              const currentDays = (editingMember as any).customWorkDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleWorkDay(day, true)}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                    currentDays.includes(day)
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-white text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Start</Label>
                              <Input
                                type="time"
                                value={(editingMember as any).customWorkHoursStart || '09:00'}
                                onChange={(e) => setEditingMember({ ...editingMember, customWorkHoursStart: e.target.value } as any)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">End</Label>
                              <Input
                                type="time"
                                value={(editingMember as any).customWorkHoursEnd || '17:00'}
                                onChange={(e) => setEditingMember({ ...editingMember, customWorkHoursEnd: e.target.value } as any)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-joiningDate">Joining Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="edit-joiningDate"
                          type="date"
                          value={(editingMember as any).joiningDate || ''} 
                          onChange={(e)=>setEditingMember({ ...editingMember, joiningDate: e.target.value } as any)}
                          className="pl-10 border-gray-300 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-reportingTo">Reporting To</Label>
                      <select
                        id="edit-reportingTo"
                        value={(editingMember as any).reportingTo || ''}
                        onChange={(e)=>setEditingMember({ ...editingMember, reportingTo: e.target.value } as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Reporting Manager</option>
                        {teamMembers
                          .filter(m => m.id !== editingMember.id && (m.role === 'Admin' || m.role === 'Super Admin' || m.role === 'Manager' || m.role === 'Team Lead'))
                          .map(m => (
                            <option key={m.id} value={m.name}>{m.name} - {m.role}</option>
                          ))
                        }
                        <option value="Direct to Management">Direct to Management</option>
                        <option value="CEO / Founder">CEO / Founder</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-workAssigned">Work Assigned / Responsibilities</Label>
                      <textarea
                        id="edit-workAssigned"
                        value={(editingMember as any).workAssigned || ''}
                        onChange={(e)=>setEditingMember({ ...editingMember, workAssigned: e.target.value } as any)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5" />
                    Skills & Expertise
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="edit-skills">Skills & Expertise</Label>
                    <textarea
                      id="edit-skills"
                      value={(editingMember as any).skills || ''}
                      onChange={(e)=>setEditingMember({ ...editingMember, skills: e.target.value } as any)}
                      rows={3}
                      placeholder="List skills, certifications, and areas of expertise"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={()=>{
                  setIsEditOpen(false);
                  setEditShowCustomRole(false);
                  setEditShowCustomDepartment(false);
                  setEditShowCustomIdType(false);
                  setEditShowCustomWorkHours(false);
                }}>Cancel</Button>
                <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
