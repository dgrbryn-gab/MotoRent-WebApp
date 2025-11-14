import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import type { Page, User as UserType } from '../App';

interface OTPVerificationProps {
  email: string;
  onVerified: (user: UserType) => void;
  onBack: () => void;
  navigate: (page: Page) => void;
}

export function OTPVerification({ email, onVerified, onBack, navigate }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start countdown for resend button
  useEffect(() => {
    setCountdown(60); // 60 seconds countdown
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    // Limit to single digit
    const newValue = value.slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (index === 5 && newValue && newOtp.every(digit => digit !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      // Auto-verify pasted OTP
      handleVerifyOtp(digits);
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join('');
    
    if (codeToVerify.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    
    try {
      const user = await authService.verifyOTP({
        email,
        token: codeToVerify,
        type: 'signup'
      });

      setIsVerified(true);
      toast.success('Email verified successfully! Welcome to MotoRent!');
      
      // Short delay to show success state
      setTimeout(() => {
        onVerified(user);
      }, 1500);
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      toast.error(error.message || 'Invalid verification code. Please try again.');
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    
    try {
      await authService.resendOTP(email, 'signup');
      toast.success('Verification code sent! Check your email.');
      setCountdown(60); // Reset countdown
      
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Resend OTP failed:', error);
      toast.error(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-xl">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-bold text-green-600">
              Email Verified!
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome to MotoRent. Redirecting you now...
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-primary">
            Verify Email
          </h1>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <Mail className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We've sent a 6-digit verification code to{' '}
            <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-4">
          <Label className="text-center block">Enter verification code</Label>
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-lg font-bold bg-white text-foreground border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isVerifying}
              />
            ))}
          </div>
        </div>

        {/* Verify Button */}
        <Button
          onClick={() => handleVerifyOtp()}
          className="w-full"
          size="lg"
          disabled={isVerifying || otp.some(digit => !digit)}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>

        {/* Resend */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResendOtp}
            disabled={countdown > 0 || isResending}
            className="text-primary"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Resend Code
              </>
            )}
          </Button>
        </div>

        {/* Help */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Check your spam folder if you don't see the email</p>
          <p>
            Wrong email?{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => navigate('signup')}
            >
              Sign up again
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
}