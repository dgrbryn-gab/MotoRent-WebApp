import { useState } from 'react';
import { AdminUser, Page } from '../../App';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Eye, EyeOff, Shield, ArrowLeft, Bike, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

interface AdminLoginPageProps {
  navigate: (page: Page) => void;
  adminLogin: (adminData: AdminUser) => void;
}

export function AdminLoginPage({ navigate, adminLogin }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting admin login with:', email);
      const adminData = await authService.adminSignIn({ email, password });
      console.log('✅ Admin login successful:', adminData);
      toast.success('Admin login successful!');
      adminLogin(adminData);
    } catch (error: any) {
      console.error('❌ Admin login failed:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Main Site */}
        <div className="mb-6">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to main site</span>
          </button>
        </div>

        <Card className="shadow-xl border-0 bg-card">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 cursor-pointer" onClick={() => navigate('landing')}>
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Bike className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-heading font-bold text-primary">
                MotoRent
              </span>
            </div>
            
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-heading">Admin Login</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Access the MotoRent Dumaguete admin panel
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-destructive/20 bg-destructive/5">
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@motorent.com"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-primary hover:shadow-lg btn-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in to Admin Panel'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}