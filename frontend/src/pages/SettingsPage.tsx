import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { roleLabels, getInitials } from '../lib/utils';
import { LogOut, User, Shield, Mail } from 'lucide-react';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const profile = user?.profile as any;

  return (
    <div>
      <PageHeader title="Settings" description="Your account details and session" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">{user ? getInitials(user.email) : 'U'}</span>
              </div>
              <div>
                <p className="text-white font-medium">{user?.email}</p>
                <p className="text-charcoal-400 text-sm">{user ? roleLabels[user.role] : ''}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-charcoal-800 bg-charcoal-950 px-3 py-2.5">
                <Mail className="w-4 h-4 text-charcoal-500" />
                <div>
                  <p className="text-xs text-charcoal-500">Email</p>
                  <p className="text-sm text-white">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-charcoal-800 bg-charcoal-950 px-3 py-2.5">
                <Shield className="w-4 h-4 text-charcoal-500" />
                <div>
                  <p className="text-xs text-charcoal-500">Role</p>
                  <p className="text-sm text-white">{user ? roleLabels[user.role] : ''}</p>
                </div>
              </div>
              {profile?.studentNumber && (
                <div className="flex items-center gap-3 rounded-lg border border-charcoal-800 bg-charcoal-950 px-3 py-2.5">
                  <User className="w-4 h-4 text-charcoal-500" />
                  <div>
                    <p className="text-xs text-charcoal-500">Student Number</p>
                    <p className="text-sm text-white">{profile.studentNumber}</p>
                  </div>
                </div>
              )}
              {profile?.employeeId && (
                <div className="flex items-center gap-3 rounded-lg border border-charcoal-800 bg-charcoal-950 px-3 py-2.5">
                  <User className="w-4 h-4 text-charcoal-500" />
                  <div>
                    <p className="text-xs text-charcoal-500">Employee ID</p>
                    <p className="text-sm text-white">{profile.employeeId}</p>
                  </div>
                </div>
              )}
              {profile?.department?.name && (
                <div className="flex items-center gap-3 rounded-lg border border-charcoal-800 bg-charcoal-950 px-3 py-2.5">
                  <User className="w-4 h-4 text-charcoal-500" />
                  <div>
                    <p className="text-xs text-charcoal-500">Department</p>
                    <p className="text-sm text-white">{profile.department.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-charcoal-400 mb-4">
              Signing out clears your session cookie on this device.
            </p>
            <Button variant="danger" onClick={logout}>
              <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
