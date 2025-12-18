import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Loader2, Save, User, Mail, Phone, MapPin, Calendar, FileText, Camera, Lock, Upload } from 'lucide-react';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { userService } from '../services/userService';
import { documentService } from '../services/documentService';
import { authService } from '../services/authService';
import type { User } from '../App';

interface EditProfilePageProps {
  user: User;
  setUser: (user: User) => void;
}

export function EditProfilePage({ user, setUser }: EditProfilePageProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    birthday: user.birthday || '',
    license_number: user.license_number || ''
  });
  const [editedUser, setEditedUser] = useState(user);
  const [loading, setLoading] = useState(false);
  
  // Profile picture upload
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  
  // Driver's license upload
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  
  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setEditedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      birthday: user.birthday || '',
      license_number: user.license_number || ''
    });
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setLoading(true);
      
      // Upload profile picture if a new file was selected
      let profilePictureUrl = editedUser.profile_picture_url;
      if (profilePicFile) {
        try {
          setUploadingProfilePic(true);
          const picturePath = await documentService.uploadFile(
            profilePicFile,
            user.id,
            'profile-picture'
          );
          profilePictureUrl = documentService.getPublicUrl(picturePath);
          toast.success('Profile picture uploaded successfully!');
        } catch (uploadError: any) {
          console.error('Failed to upload profile picture:', uploadError);
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
          const documentPath = await documentService.uploadFile(
            licenseFile,
            user.id,
            'driver-license'
          );
          driverLicenseUrl = documentService.getPublicUrl(documentPath);
          toast.success('Driver\'s license uploaded successfully!');
        } catch (uploadError: any) {
          console.error('Failed to upload driver\'s license:', uploadError);
          toast.error('Failed to upload driver\'s license: ' + uploadError.message);
        } finally {
          setUploadingLicense(false);
        }
      }

      const updatedUser = await userService.updateUser(user.id, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        birthday: formData.birthday,
        license_number: formData.license_number,
        driver_license_url: driverLicenseUrl,
        profile_picture_url: profilePictureUrl,
      });

      setUser(updatedUser as User);
      setEditedUser(updatedUser as User);
      setProfilePicFile(null);
      setLicenseFile(null);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl text-primary mb-2">Edit Profile</h1>
        <p className="text-muted-foreground">Update your personal information and preferences</p>
      </div>

      {/* Profile Picture */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Change your profile picture</CardDescription>
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
              className="absolute -bottom-1 -right-1 bg-primary text-white p-2.5 rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow-lg border-4 border-background"
            >
              <Camera className="w-5 h-5" />
            </label>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Click the camera icon to upload a new profile picture (JPG or PNG, max 5MB)
            </p>
            {profilePicFile && (
              <p className="text-sm text-green-600 mt-1">
                Ready to upload: {profilePicFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  disabled={loading}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email (Cannot be changed)
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted/50"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +63 9XX XXX XXXX"
                  disabled={loading}
                />
              </div>

              {/* Birthday */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Birthday
                </label>
                <Input
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Address - Full width */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <Textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your residential address"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver's License */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Driver's License
            </CardTitle>
            <CardDescription>Update your license information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                License Number
              </label>
              <Input
                name="license_number"
                type="text"
                value={formData.license_number}
                onChange={handleChange}
                placeholder="e.g., F10-0800-00G00"
                disabled={loading}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>License Document</Label>
              {editedUser.driver_license_url && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg"
            disabled={loading || uploadingLicense || uploadingProfilePic}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
