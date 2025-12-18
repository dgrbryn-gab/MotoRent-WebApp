import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Phone, Bike, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { OTPVerification } from './OTPVerification';
import type { Page, User as UserType } from '../App';

interface SignUpPageProps {
  navigate: (page: Page) => void;
  login: (user: UserType) => void;
}

export function SignUpPage({ navigate, login }: SignUpPageProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
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
    
    if (!formData.fullName || !formData.username || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    // Validate username format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        username: formData.username,
        phone: formData.phone,
      });
      
      // Show success message and switch to OTP verification
      toast.success('Account created! Please check your email for the verification code.', {
        duration: 4000,
      });
      
      // Switch to OTP verification step
      setSignupEmail(formData.email);
      setShowOTPVerification(true);
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show OTP verification if signup was successful
  if (showOTPVerification) {
    return (
      <OTPVerification
        email={signupEmail}
        onVerified={handleOTPVerified}
        onBack={handleOTPBack}
        navigate={navigate}
      />
    );
  }

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
          <h1 className="text-2xl text-primary">Sign Up</h1>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Alphanumeric and underscores only, min. 3 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
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
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => navigate('login')}
          >
            Login here
          </Button>
        </div>
      </Card>
    </div>
  );
}