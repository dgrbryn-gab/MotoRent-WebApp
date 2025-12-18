import { useState } from 'react';
import { Mail, Lock, User, Phone, Bike, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { OTPVerification } from './OTPVerification';
import type { Page, User as UserType } from '../App';
import './AuthPage.css';

interface AuthPageProps {
  navigate: (page: Page) => void;
  login: (user: UserType) => void;
  adminLogin: (adminData: { id: string; name: string; email: string; role: 'admin' | 'super-admin'; lastLogin: string }) => void;
}

export function AuthPage({ navigate, login, adminLogin }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Login form state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sign up form state
  const [signupFormData, setSignupFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrUsername || !password) {
      toast.error('Please enter your email/username and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const authUser = await authService.signIn({ email: emailOrUsername, password });
      
      if (authUser.isAdmin) {
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
        const appUser: UserType = {
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

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupFormData({
      ...signupFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleOTPVerified = (user: UserType) => {
    login(user);
    navigate('home');
  };

  const handleOTPBack = () => {
    setShowOTPVerification(false);
    setSignupEmail('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupFormData.fullName || !signupFormData.username || !signupFormData.email || !signupFormData.phone || !signupFormData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.signUp({
        fullName: signupFormData.fullName,
        username: signupFormData.username,
        email: signupFormData.email,
        phone: signupFormData.phone,
        password: signupFormData.password
      });

      if (result.success && result.email) {
        setSignupEmail(result.email);
        setShowOTPVerification(true);
        toast.success('Account created! Please verify your email.');
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
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

  if (showOTPVerification) {
    return (
      <OTPVerification 
        email={signupEmail}
        onVerified={handleOTPVerified}
        onBack={handleOTPBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center overflow-hidden relative">
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-red-400 rounded-bl-3xl opacity-90 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-400 rounded-tr-3xl opacity-90 -z-10"></div>

      <div className="flex w-full h-screen max-h-screen lg:max-h-[100vh] flex-col lg:flex-row">
        {/* Left Panel - Login */}
        <div className="w-full lg:w-1/2 bg-teal-500 flex flex-col items-center justify-center p-6 lg:p-8 lg:min-h-screen">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12 cursor-pointer" onClick={() => navigate('landing')}>
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Bike className="w-6 h-6 text-teal-500" />
              </div>
              <span className="text-xl font-bold text-white">MotoRent</span>
            </div>

            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">Welcome Back!</h1>
              <p className="text-teal-100 mb-8 text-sm lg:text-base">To keep connected with us please login with your personal info</p>
              
              <form onSubmit={handleLogin} className="space-y-4 text-left mb-8">
                <div>
                  <Input
                    type="text"
                    placeholder="Email or Username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                  />
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-teal-500 hover:bg-gray-100 font-semibold mt-6 rounded-full py-3"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      SIGNING IN...
                    </>
                  ) : (
                    'SIGN IN'
                  )}
                </Button>
              </form>

              <Button
                type="button"
                variant="ghost"
                className="text-white/80 hover:text-white text-sm w-full"
                onClick={() => setShowResetDialog(true)}
              >
                Forgot Password?
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Sign Up */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-6 lg:p-8 lg:min-h-screen overflow-y-auto lg:overflow-y-visible">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-teal-500 mb-2">Create Account</h1>
              <p className="text-gray-600 text-sm mb-6">Join our community today</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  name="fullName"
                  value={signupFormData.fullName}
                  onChange={handleSignupChange}
                  disabled={isLoading}
                  required
                  className="bg-gray-100 border-0 focus:bg-gray-200"
                />
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={signupFormData.username}
                  onChange={handleSignupChange}
                  disabled={isLoading}
                  required
                  className="bg-gray-100 border-0 focus:bg-gray-200"
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={signupFormData.email}
                  onChange={handleSignupChange}
                  disabled={isLoading}
                  required
                  className="bg-gray-100 border-0 focus:bg-gray-200"
                />
              </div>

              <div>
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  name="phone"
                  value={signupFormData.phone}
                  onChange={handleSignupChange}
                  disabled={isLoading}
                  required
                  className="bg-gray-100 border-0 focus:bg-gray-200"
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  name="password"
                  value={signupFormData.password}
                  onChange={handleSignupChange}
                  disabled={isLoading}
                  required
                  className="bg-gray-100 border-0 focus:bg-gray-200"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-full mt-6 py-3"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  'SIGN UP'
                )}
              </Button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-6">
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="text-teal-500 font-semibold hover:text-teal-600">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>

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
