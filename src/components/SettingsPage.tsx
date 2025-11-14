import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, X, Lock, Trash2, Upload, FileText, Calendar, MapPin, Camera, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { documentService } from '../services/documentService';
import type { User as UserType } from '../App';

interface SettingsPageProps {
  user: UserType;
  setUser: (user: UserType) => void;
  logout: () => void;
}

export function SettingsPage({ user, setUser, logout }: SettingsPageProps) {
  const [editedUser, setEditedUser] = useState(user);
  const [saving, setSaving] = useState(false);
  
  // Driver's license upload
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  
  // Profile picture upload
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  
  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync edited user with prop changes
  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Starting profile save...');
      
      // Check if email was changed
      const emailChanged = editedUser.email !== user.email;
      
      if (emailChanged) {
        console.log('📧 Email changed, updating auth...');
        await authService.updateEmail(editedUser.email);
        toast.info('Verification email sent to your new address. Please check your inbox.');
      }
      
      // Upload profile picture if a new file was selected
      let profilePictureUrl = editedUser.profile_picture_url;
      if (profilePicFile) {
        try {
          setUploadingProfilePic(true);
          console.log('📸 Uploading profile picture...');
          
          const picturePath = await documentService.uploadFile(
            profilePicFile,
            user.id,
            'profile-picture'
          );
          profilePictureUrl = documentService.getPublicUrl(picturePath);
          console.log('✅ Profile picture public URL:', profilePictureUrl);
          toast.success('Profile picture uploaded successfully!');
        } catch (uploadError: any) {
          console.error('❌ Failed to upload profile picture:', uploadError);
          toast.error('Failed to upload profile picture: ' + uploadError.message);
        } finally {
          setUploadingProfilePic(false);
        }
      }
      
      // Upload driver's license if a new file was selected
      let driverLicenseUrl = editedUser.driver_license_url;
      if (licenseFile) {
        try {
          setUploadingLicense(true);
          console.log('📄 Uploading driver\'s license...');
          
          const documentPath = await documentService.uploadFile(
            licenseFile,
            user.id,
            'driver-license'
          );
          driverLicenseUrl = documentService.getPublicUrl(documentPath);
          console.log('✅ Driver\'s license public URL:', driverLicenseUrl);
          toast.success('Driver\'s license uploaded successfully!');
        } catch (uploadError: any) {
          console.error('❌ Failed to upload driver\'s license:', uploadError);
          toast.error('Failed to upload driver\'s license: ' + uploadError.message);
        } finally {
          setUploadingLicense(false);
        }
      }
      
      // Update user in database
      console.log('💾 Updating user in database...');
      const updateData = {
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        birthday: editedUser.birthday,
        address: editedUser.address,
        driver_license_url: driverLicenseUrl,
        license_number: editedUser.license_number,
        profile_picture_url: profilePictureUrl,
      };
      
      await userService.updateUser(user.id, updateData);
      console.log('✅ User updated in database');
      
      // Update local state
      const updatedUser = { 
        ...editedUser, 
        driver_license_url: driverLicenseUrl,
        profile_picture_url: profilePictureUrl 
      };
      setUser(updatedUser);
      setEditedUser(updatedUser);
      setLicenseFile(null);
      setProfilePicFile(null);
      
      if (emailChanged) {
        toast.success('Profile updated! Please verify your new email address to complete the change.');
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      toast.error('Failed to update profile: ' + (error.message || 'Unknown error'));
      setEditedUser(user);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserType, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or PDF file');
        return;
      }
      setLicenseFile(file);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error('Please upload a JPG or PNG file');
        return;
      }
      setProfilePicFile(file);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setEditedUser(prev => ({ ...prev, profile_picture_url: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.updatePassword(currentPassword, newPassword);
      toast.success('Password updated successfully!');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      console.log('🗑️ Starting account deletion...');
      
      // Delete user's uploaded files from storage
      try {
        const { data: files } = await supabase.storage
          .from('documents')
          .list(`${user.id}`);
        
        if (files && files.length > 0) {
          const filePaths = files.map(file => `${user.id}/${file.name}`);
          await supabase.storage.from('documents').remove(filePaths);
          console.log('✅ Deleted user files from storage');
        }
      } catch (storageError) {
        console.warn('⚠️ Could not delete storage files:', storageError);
      }
      
      // Delete user from database
      await userService.deleteUser(user.id);
      console.log('✅ Deleted user from database');
      
      // Delete user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) {
        console.error('❌ Failed to delete auth user:', authError);
      } else {
        console.log('✅ Deleted user from Supabase Auth');
      }
      
      await authService.signOut();
      toast.success('Account deleted successfully');
      logout();
    } catch (error: any) {
      console.error('❌ Failed to delete account:', error);
      toast.error('Failed to delete account: ' + (error.message || 'Unknown error'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary mb-2">Account Settings</h1>
          <p className="text-muted-foreground font-body">Update your account information and preferences</p>
        </div>

        {/* Profile Picture */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="font-heading">Profile Picture</CardTitle>
            <CardDescription className="font-body">Change your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {editedUser.profile_picture_url ? (
                  <>
                    <AvatarImage 
                      src={editedUser.profile_picture_url} 
                      alt={editedUser.name}
                    />
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {getInitials(editedUser.name)}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {getInitials(editedUser.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <input
                type="file"
                id="profile-pic-upload"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
              <label
                htmlFor="profile-pic-upload"
                className="absolute -bottom-1 -right-1 bg-primary text-white p-2.5 rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow-lg border-4 border-white"
              >
                <Camera className="w-5 h-5" />
              </label>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-body">
                Click the camera icon to upload a new profile picture (JPG or PNG, max 5MB)
              </p>
              {profilePicFile && (
                <p className="text-sm text-success mt-1 font-body">
                  Ready to upload: {profilePicFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="font-heading">Personal Information</CardTitle>
            <CardDescription className="font-body">Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="name"
                  value={editedUser.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={editedUser.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Date of Birth</Label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="birthday"
                  type="date"
                  value={editedUser.birthday || ''}
                  onChange={(e) => handleInputChange('birthday', e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Complete Address</Label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="address"
                  type="text"
                  value={editedUser.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street, Barangay, City, Province"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver's License */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center font-heading">
              <FileText className="w-5 h-5 mr-2" />
              Driver's License
            </CardTitle>
            <CardDescription className="font-body">Update your license information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-number">License Number</Label>
              <Input
                id="license-number"
                type="text"
                value={editedUser.license_number || ''}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                placeholder="N01-12-345678"
                className="font-mono"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>License Document</Label>
              {editedUser.driver_license_url && (
                <div className="p-3 bg-success/10 border border-success/20 rounded-md mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium">Current License Uploaded</span>
                  </div>
                </div>
              )}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  id="license-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleLicenseFileChange}
                  className="hidden"
                />
                <label htmlFor="license-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {licenseFile ? licenseFile.name : (editedUser.driver_license_url ? 'Replace Driver\'s License' : 'Upload Driver\'s License')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, or PDF (max 5MB)
                  </p>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center font-heading">
              <Lock className="w-5 h-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription className="font-body">Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(true)}
              className="btn-hover"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving || uploadingLicense || uploadingProfilePic}
            className="btn-hover"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border-destructive/50 card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive font-heading">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="font-body">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-body font-semibold">Delete Account</h3>
              <p className="text-sm text-muted-foreground font-body">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="btn-hover"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Change Password</DialogTitle>
            <DialogDescription className="font-body">
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              disabled={changingPassword}
              className="btn-hover"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="btn-hover"
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This action cannot be undone. This will permanently delete your account and remove all your data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profile information</li>
                <li>Uploaded documents</li>
                <li>Reservation history</li>
                <li>Transaction records</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="btn-hover font-body">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 btn-hover font-body"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
