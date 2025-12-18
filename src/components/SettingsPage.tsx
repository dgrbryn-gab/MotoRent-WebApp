import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Moon, Sun, Type } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import type { User as UserType } from '../App';

interface SettingsPageProps {
  user: UserType;
  setUser: (user: UserType) => void;
  logout: () => void;
}

interface AppPreferences {
  theme: 'dark' | 'light';
  fontSize: 'small' | 'normal' | 'large';
  highContrast: boolean;
  reduceMotion: boolean;
}

export function SettingsPage({ user, setUser, logout }: SettingsPageProps) {
  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // App preferences
  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'dark',
    fontSize: 'normal',
    highContrast: false,
    reduceMotion: false,
  });

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('appPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, []);

  const savePreference = (key: keyof AppPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('appPreferences', JSON.stringify(updated));
    
    // Apply theme change immediately
    if (key === 'theme') {
      applyTheme(value);
      toast.success(`Theme changed to ${value}`);
    } else if (key === 'fontSize') {
      applyFontSize(value);
      toast.success(`Font size changed to ${value}`);
    } else if (key === 'highContrast') {
      applyHighContrast(value);
      toast.success(`High contrast ${value ? 'enabled' : 'disabled'}`);
    } else if (key === 'reduceMotion') {
      applyReduceMotion(value);
      toast.success(`Reduce motion ${value ? 'enabled' : 'disabled'}`);
    }
  };

  const applyTheme = (theme: 'dark' | 'light') => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.remove('light');
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
  };

  const applyFontSize = (size: 'small' | 'normal' | 'large') => {
    const html = document.documentElement;
    html.classList.remove('text-sm-size', 'text-lg-size');
    if (size === 'small') {
      html.classList.add('text-sm-size');
    } else if (size === 'large') {
      html.classList.add('text-lg-size');
    }
  };

  const applyHighContrast = (enabled: boolean) => {
    const html = document.documentElement;
    if (enabled) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
  };

  const applyReduceMotion = (enabled: boolean) => {
    const html = document.documentElement;
    if (enabled) {
      html.classList.add('reduce-motion');
    } else {
      html.classList.remove('reduce-motion');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl text-primary mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5" />
              App Preferences
            </CardTitle>
            <CardDescription>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Theme
              </Label>
              <Select value={preferences.theme} onValueChange={(value: any) => savePreference('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Font Size
              </Label>
              <Select value={preferences.fontSize} onValueChange={(value: any) => savePreference('fontSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Accessibility Options */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-semibold text-sm">Accessibility</h4>
              
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">High Contrast Mode</p>
                  <p className="text-xs text-muted-foreground">Increases color contrast for better readability</p>
                </div>
                <Button
                  variant={preferences.highContrast ? "default" : "outline"}
                  size="sm"
                  onClick={() => savePreference('highContrast', !preferences.highContrast)}
                >
                  {preferences.highContrast ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reduce Motion</p>
                  <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                </div>
                <Button
                  variant={preferences.reduceMotion ? "default" : "outline"}
                  size="sm"
                  onClick={() => savePreference('reduceMotion', !preferences.reduceMotion)}
                >
                  {preferences.reduceMotion ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
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
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
