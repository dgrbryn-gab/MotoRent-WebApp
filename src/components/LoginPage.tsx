import { useState } from 'react';
import { ArrowLeft, Mail, Lock, Bike, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import type { Page, User } from '../App';

interface LoginPageProps {
  navigate: (page: Page) => void;
  login: (user: User) => void;
  adminLogin: (adminData: { id: string; name: string; email: string; role: 'admin' | 'super-admin'; lastLogin: string }) => void;
}

export function LoginPage({ navigate, login, adminLogin }: LoginPageProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrUsername || !password) {
      toast.error('Please enter your email/username and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const authUser = await authService.signIn({ email: emailOrUsername, password });
      
      // Check if user is an admin
      if (authUser.isAdmin) {
        console.log('🔐 Admin detected, routing to admin dashboard');
        const adminData = {
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role as 'admin' | 'super-admin',
          lastLogin: new Date().toISOString(),
        };
        toast.success('Admin login successful!');
        adminLogin(adminData);
      } else {
        // Regular user login
        const appUser: User = {
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          phone: authUser.phone
        };
        
        toast.success('Login successful!');
        login(appUser);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsResetting(true);
    
    try {
      await authService.resetPassword(resetEmail);
      toast.success('Password reset email sent! Check your inbox.');
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-2 cursor-pointer" onClick={() => navigate('landing')}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-heading font-bold text-primary">
            MotoRent
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('landing')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl text-primary">Login</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername">Email or Username</Label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground text-sm"
                onClick={() => setShowResetDialog(true)}
              >
                Forgot Password?
              </Button>
            </div>
          </div>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => navigate('signup')}
          >
            Sign up here
          </Button>
        </div>
      </Card>

      {/* Password Reset Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-semibold">Reset Password</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowResetDialog(false);
                    setResetEmail('');
                  }}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}