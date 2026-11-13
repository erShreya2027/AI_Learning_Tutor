import React, { useEffect, useState } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ username: '', email: '', profileImage: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        const profileData = data?.data || data || {};
        setProfile({
          username: profileData.username || user?.username || '',
          email: profileData.email || user?.email || '',
          profileImage: profileData.profileImage || '',
        });
      } catch (error) {
        toast.error(error.message || 'Failed to load profile');
      }
    };

    fetchProfile();
  }, [user?.email, user?.username]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authService.updateProfile(profile);
      const updated = response?.data || response || profile;
      updateUser(updated);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please provide current and new password');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <User className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Profile</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{profile.username || 'Your profile'}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Account settings</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Security</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Current password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>

            <button onClick={handlePasswordChange} disabled={passwordLoading} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              <Lock className="h-4 w-4" />
              {passwordLoading ? 'Updating...' : 'Change password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;