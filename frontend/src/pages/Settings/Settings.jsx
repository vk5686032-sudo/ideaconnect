import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Camera, Loader2, Save, Trash2, AlertTriangle, Lock, User as UserIcon, LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import useAuthStore from '../../store/authSlice';
import userApi from '../../api/user.api';
import authApi from '../../api/auth.api';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const fileInputRef = useRef(null);

  // Avatar
  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return userApi.updateAvatar(formData);
    },
    onSuccess: (response) => {
      if (response?.data?.data) updateUser(response.data.data);
      toast.success('Avatar updated');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to upload avatar'),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }
    avatarMutation.mutate(file);
  };

  // Change password
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: (data) => userApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to change password'),
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    setPasswordError('');
    changePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const deleteAccountMutation = useMutation({
    mutationFn: () => userApi.deleteAccount({ password: deletePassword }),
    onSuccess: () => {
      toast.success('Your account has been deleted');
      logout();
      navigate('/');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete account'),
  });

  const handleDeleteAccount = () => {
    if (!deletePassword) return;
    deleteAccountMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <BackButton />
        </div>
        <Link to="/profile" className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-2">
          <UserIcon className="w-4 h-4" /> View Profile
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {/* Avatar */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-600" /> Profile Photo
        </h2>
        <p className="text-sm text-gray-500 mb-4">JPG or PNG, up to 5MB.</p>
        <div className="flex items-center gap-4">
          {user.avatar?.url ? (
            <img src={user.avatar.url} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary-600" />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarMutation.isPending}
            className="btn-outline flex items-center gap-2 disabled:opacity-50"
          >
            {avatarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Upload new photo
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-600" /> Change Password
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          After changing your password you'll stay logged in on this device.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            className="input-field"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="New password (min 6 characters)"
            className="input-field"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="input-field"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            required
          />
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>

      {/* Sessions */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-primary-600" /> Sessions
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Sign out of this account on every device (up to 5 active sessions are kept).
        </p>
        <button
          onClick={async () => {
            try {
              await authApi.logoutAll();
              toast.success('Logged out from all devices');
            } catch {
              toast.error('Failed to revoke sessions');
            }
          }}
          className="btn-outline"
        >
          Log out everywhere
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200 bg-red-50/50">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-sm text-red-600/80 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        ) : (
          <div className="bg-white border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              Enter your password to confirm:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="input-field flex-1"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || deleteAccountMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 whitespace-nowrap flex items-center gap-2"
              >
                {deleteAccountMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
