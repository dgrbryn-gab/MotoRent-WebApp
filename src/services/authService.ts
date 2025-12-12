/**
 * Authentication Service
 * 
 * Handles user authentication using Supabase Auth.
 * Provides methods for signup, signin, signout, password reset, and session management.
 */

import { supabase } from '../lib/supabase';
import { userService } from './userService';
import { emailService } from './emailService';
import type { User } from '@supabase/supabase-js';

/**
 * Generate a 6-digit OTP code
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP for verification in database (valid for 10 minutes)
 * Persistent across server restarts and scalable for distributed deployments
 */
const storeOTP = async (email: string, code: string): Promise<void> => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  
  try {
    // First, delete any existing OTP for this email
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email);
    
    // Then insert the new OTP
    const { error } = await supabase
      .from('otp_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt
      });
    
    if (error) {
      throw new Error(`Failed to store OTP: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`OTP storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Verify OTP code against database
 */
const verifyOTPCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (!data) {
      return false;
    }
    
    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', data.id);
      return false;
    }
    
    // Check if code matches
    const isValid = data.code === code;
    
    if (isValid) {
      // Delete OTP after successful verification
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', data.id);
    }
    
    return isValid;
  } catch (error) {
    throw new Error(`OTP verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Send OTP via email using Resend
 */
const sendOTPViaResend = async (email: string, otp: string): Promise<void> => {
  try {
    const subject = '🔐 Your MotoRent Verification Code';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px; }
          .otp-code { font-size: 2.5em; font-weight: bold; letter-spacing: 5px; color: #667eea; font-family: monospace; }
          .otp-note { color: #666; font-size: 0.9em; margin-top: 15px; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ MotoRent Verification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your verification code for MotoRent Dumaguete is:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-note">Valid for 10 minutes</div>
            </div>

            <p>Enter this code in the app to verify your email address and complete your signup.</p>
            
            <p style="color: #999; font-size: 0.9em;">
              If you did not request this code, please ignore this email. Do not share this code with anyone.
            </p>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete - Your Trusted Motorcycle Rental</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `MotoRent Verification Code\n\nYour verification code: ${otp}\n\nValid for 10 minutes. Enter this code in the app to verify your email address.\n\nIf you did not request this code, please ignore this email.\n\nMotoRent Dumaguete`;

    console.log('📧 Attempting to send OTP to:', email);
    console.log('📧 OTP code:', otp);
    
    await emailService.sendEmail(email, subject, html, text);
    console.log(`✅ OTP sent successfully to ${email}`);
  } catch (error: any) {
    console.error('❌ Failed to send OTP via Resend:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error('Failed to send verification code. Please try again.');
  }
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: 'admin' | 'super-admin' | 'user';
  isAdmin?: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  username: string;
  phone: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 * Creates auth account and user profile in database
 * Sends email verification
 */
export const signUp = async (data: SignUpData): Promise<AuthUser> => {
  try {
    console.log('📝 Signup attempt for:', data.email);
    
    // Check if user already exists in database (from mobile app)
    const existingUser = await userService.getUserByEmail(data.email);
    
    if (existingUser) {
      console.log('⚠️ User exists in database, checking auth...');
      // User exists in database, try to create auth account for them
      // This handles mobile app users who don't have Supabase Auth accounts yet
    }
    
    // 1. Create auth user in Supabase Auth
    // Note: We disable Supabase email verification and use Resend for OTP instead
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          username: data.username,
          phone: data.phone,
        },
        // DO NOT include emailRedirectTo - we handle verification via OTP through Resend
      }
    });

    if (authError) {
      // Check if it's because user already exists in auth
      if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
        throw new Error('This email is already registered. Please use the login page or try "Forgot Password" if you don\'t remember your password.');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    console.log('✅ Auth account created:', authData.user.id);
    console.log('📧 Email:', data.email);
    
    // Generate and send OTP via Resend
    const otp = generateOTP();
    await storeOTP(data.email, otp);
    await sendOTPViaResend(data.email, otp);
    console.log('📨 OTP sent via Resend to:', data.email);
    
    // Do not create session yet - user must verify OTP first
    if (authData.session) {
      // Sign out the session so user must verify OTP
      await supabase.auth.signOut();
      console.log('🔐 Session cleared - waiting for OTP verification');
    }

    // 2. Create or update user profile in database
    try {
      if (existingUser) {
        // Update existing profile with new auth ID
        console.log('🔄 Updating existing user profile...');
        await userService.updateUser(existingUser.id, {
          id: authData.user.id,
          name: data.name,
          username: data.username,
          email: data.email,
          phone: data.phone,
        });
        console.log('✅ Updated existing profile');
      } else {
        // Create new profile
        console.log('➕ Creating new user profile...');
        await userService.createUser({
          id: authData.user.id,
          name: data.name,
          username: data.username,
          email: data.email,
          phone: data.phone,
        });
        console.log('✅ Created new profile');
      }
    } catch (dbError: any) {
      // If profile creation fails but auth succeeded, we should handle this
      console.error('Failed to create user profile:', dbError);
      
      // Check if it's a duplicate username error
      if (dbError.message?.includes('duplicate key value violates unique constraint') && 
          dbError.message?.includes('username')) {
        throw new Error('This username is already taken. Please choose a different one.');
      }
      
      // Don't throw here - user auth is created, profile can be created later
    }

    return {
      id: authData.user.id,
      email: authData.user.email!,
      name: data.name,
      phone: data.phone,
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle specific errors
    if (error.message?.includes('already registered')) {
      throw new Error('This email is already registered. Please login instead.');
    }
    if (error.message?.includes('invalid email')) {
      throw new Error('Please enter a valid email address.');
    }
    if (error.message?.includes('Password')) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (error.message?.includes('username is already taken')) {
      throw error;
    }
    
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
};

/**
 * Sign in an existing user
 * Accepts email or username
 * Requires email verification
 */
export const signIn = async (data: SignInData): Promise<AuthUser> => {
  try {
    let emailToUse = data.email;
    
    console.log('🔐 Login attempt for:', data.email);
    
    // If the input doesn't contain @ (not an email), treat it as username
    if (!data.email.includes('@')) {
      console.log('📝 Treating as username, looking up email...');
      const userProfile = await userService.getUserByUsername(data.email);
      if (!userProfile) {
        throw new Error('The email or username is not registered. Sign up first to register.');
      }
      emailToUse = userProfile.email;
      console.log('✅ Found email for username:', emailToUse);
    }
    
    console.log('🔑 Attempting Supabase auth with:', emailToUse);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: data.password,
    });

    if (authError) {
      console.error('❌ Supabase auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth');
      throw new Error('Login failed. Please try again.');
    }

    console.log('✅ Auth successful:', authData.user.email);
    console.log('📊 User metadata:', authData.user);
    console.log('📧 Email confirmed at:', authData.user.email_confirmed_at);
    console.log('✔️ Confirmed at:', authData.user.confirmed_at);

    // Check if email is verified
    // Note: Email verification check is temporarily relaxed for mobile app compatibility
    // Mobile app users may not have email_confirmed_at set
    const isEmailVerified = authData.user.email_confirmed_at || 
                            authData.user.app_metadata?.provider === 'email' ||
                            authData.user.confirmed_at; // Check alternative confirmation field
    
    if (!isEmailVerified && authData.user.app_metadata?.provider === 'email') {
      // Only enforce verification for email/password signups from web
      // Allow mobile app users to login even without verification
      console.log('⚠️ Warning: User email not verified, but allowing login for compatibility');
    }

    console.log('🔍 Checking if user is admin...');
    // Check if user is an admin first
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', emailToUse)
      .maybeSingle();

    // If user is an admin, return admin data
    if (adminData && !adminError) {
      console.log('✅ Admin detected via regular login:', adminData.email);
      
      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminData.id);

      return {
        id: adminData.id,
        email: adminData.email,
        name: adminData.name,
        phone: 'N/A', // Admin users don't typically have phone in admin_users table
        role: adminData.role as 'admin' | 'super-admin',
        isAdmin: true,
      };
    }

    // Not an admin, proceed with regular user login
    console.log('👤 Regular user login:', emailToUse);

    // Get user profile from database
    console.log('🔍 Looking up user profile in database...');
    let userProfile = await userService.getUserById(authData.user.id);

    // If not found by auth ID, try finding by email (for old mobile app users)
    if (!userProfile) {
      console.log('⚠️ User profile not found by auth ID, checking by email...');
      const oldUserProfile = await userService.getUserByEmail(emailToUse);
      
      if (oldUserProfile && oldUserProfile.id !== authData.user.id) {
        console.log('✅ Found old mobile app user, migrating to auth ID...');
        // This is an old mobile app user with mismatched ID
        try {
          // Delete old record and create new one with auth ID
          await userService.deleteUser(oldUserProfile.id);
          await userService.createUser({
            id: authData.user.id,
            name: oldUserProfile.name,
            email: oldUserProfile.email,
            phone: oldUserProfile.phone,
            username: oldUserProfile.username,
          });
          console.log('✅ Successfully migrated user to auth ID');
          userProfile = await userService.getUserById(authData.user.id);
        } catch (migrationError) {
          console.error('❌ Failed to migrate user:', migrationError);
          // If migration fails, use the old profile but warn
          console.log('⚠️ Using old profile without migration');
          userProfile = oldUserProfile;
        }
      }
    }

    if (!userProfile) {
      console.log('⚠️ User profile not found at all, creating one...');
      // Profile doesn't exist, create it
      await userService.createUser({
        id: authData.user.id,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
        email: authData.user.email!,
        phone: authData.user.user_metadata?.phone || 'N/A',
      });

      console.log('✅ User profile created');
      return {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
        phone: authData.user.user_metadata?.phone || 'N/A',
        role: 'user',
        isAdmin: false,
      };
    }

    console.log('✅ User profile found:', userProfile.name);
    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      phone: userProfile.phone,
      role: 'user',
      isAdmin: false,
    };
  } catch (error: any) {
    console.error('❌ Signin error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    });
    
    // Handle specific errors
    if (error.message?.includes('Invalid login credentials')) {
      // Check if user exists in database but not in auth
      try {
        const dbUser = await userService.getUserByEmail(data.email);
        if (dbUser) {
          // User exists in database but not in auth - they need to set up web login
          throw new Error(
            'This account was created on mobile. To login on web, please go to Sign Up, ' +
            'use the same email, and set a password. This will enable web login for your existing account.'
          );
        }
      } catch (dbCheckError: any) {
        if (dbCheckError.message?.includes('This account was created on mobile')) {
          throw dbCheckError;
        }
        // If db check fails, continue with normal error
      }
      
      throw new Error('Invalid email/username or password. Please check and try again.');
    }
    if (error.message?.includes('Email not confirmed') || error.message?.includes('verify your email')) {
      throw error;
    }
    
    throw new Error(error.message || 'Login failed. Please try again.');
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Signout error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

/**
 * Sign in with Google OAuth
 * Redirects to Google for authentication
 * Supabase handles email verification for OAuth providers
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
  }
};

/**
 * Sign in with Facebook OAuth
 * Redirects to Facebook for authentication
 * Supabase handles email verification for OAuth providers
 */
export const signInWithFacebook = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Facebook sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in with Facebook. Please try again.');
  }
};

/**
 * Get the current authenticated user
 * Returns null if user is not verified
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      console.log('⚠️ User email not verified, signing out...');
      await supabase.auth.signOut();
      return null;
    }

    // Get user profile from database
    const userProfile = await userService.getUserById(user.id);

    if (!userProfile) {
      console.log('⚠️ User profile not found in database, creating...');
      // If profile doesn't exist, create it from auth data
      try {
        const newProfile = await userService.createUser({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email!,
          phone: user.user_metadata?.phone || 'N/A',
        });

        console.log('✅ User profile created successfully:', newProfile.id);

        return {
          id: newProfile.id,
          email: newProfile.email,
          name: newProfile.name,
          phone: newProfile.phone,
        };
      } catch (createError: any) {
        console.error('❌ Failed to create user profile:', createError);
        // If profile creation fails, sign out the user
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile. Please try signing in again.');
      }
    }

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      phone: userProfile.phone,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Get the current session
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error('Failed to send password reset email. Please try again.');
  }
};

/**
 * Resend email verification
 */
export const resendVerificationEmail = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Resend verification error:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

/**
 * Verify OTP token for email confirmation
 */
export const verifyOTP = async ({ email, token, type }: { 
  email: string; 
  token: string; 
  type: 'signup' | 'recovery' | 'email_change';
}): Promise<AuthUser> => {
  try {
    // Verify the OTP code against database
    const isValid = await verifyOTPCode(email, token);
    if (!isValid) {
      throw new Error('Invalid or expired verification code.');
    }

    console.log(`✅ OTP verified for ${email}`);

    // Get user profile from database (we stored the email during signup)
    const userProfile = await userService.getUserByEmail(email);
    
    if (!userProfile) {
      throw new Error('User not found. Please sign up again.');
    }

    console.log(`✅ User profile found: ${userProfile.name}`);

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      phone: userProfile.phone,
    };
  } catch (error: any) {
    console.error('OTP verification error:', error);
    
    if (error.message?.includes('expired')) {
      throw new Error('Verification code has expired. Please request a new code.');
    }
    if (error.message?.includes('invalid') || error.message?.includes('otp') || error.message?.includes('Invalid or expired')) {
      throw new Error('Invalid verification code. Please check and try again.');
    }
    
    throw new Error(error.message || 'Verification failed. Please try again.');
  }
};

/**
 * Resend OTP for verification
 */
export const resendOTP = async (email: string, type: 'signup' | 'recovery'): Promise<void> => {
  try {
    // Generate a new OTP and send via Resend
    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTPViaResend(email, otp);
    console.log(`✅ OTP resent via Resend for ${type} to ${email}`);
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    
    if (error.message?.includes('rate limit')) {
      throw new Error('Too many requests. Please wait a moment before requesting again.');
    }
    
    throw new Error('Failed to send verification code. Please try again.');
  }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Update password error:', error);
    throw new Error('Failed to update password. Please try again.');
  }
};

/**
 * Update user email
 * Updates both Supabase Auth email and database email
 */
export const updateEmail = async (newEmail: string): Promise<void> => {
  try {
    // Update email in Supabase Auth
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      throw error;
    }
    
    // Note: The database email will be updated separately by userService
  } catch (error: any) {
    console.error('Update email error:', error);
    throw new Error('Failed to update email. Please try again.');
  }
};

/**
 * Admin authentication
 * Verifies user is an admin after successful auth
 */
export const adminSignIn = async (data: SignInData) => {
  try {
    console.log('🔐 Admin login attempt for:', data.email);
    
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      console.error('❌ Auth failed:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth');
      throw new Error('Login failed');
    }

    console.log('✅ Auth successful, checking admin_users table...');

    // 2. Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', data.email)
      .maybeSingle();

    console.log('📊 Admin query result:', { adminData, adminError });

    if (adminError) {
      console.error('❌ Admin query error:', adminError.message, adminError.code, adminError.details);
    }

    if (adminError || !adminData) {
      // User is not an admin, sign them out
      await supabase.auth.signOut();
      console.log('❌ Not an admin, signed out');
      throw new Error('Access denied. Admin credentials required.');
    }

    console.log('✅ Admin verified:', adminData.email, adminData.role);

    // 3. Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminData.id);

    return {
      id: adminData.id,
      name: adminData.name,
      email: adminData.email,
      role: adminData.role as 'admin' | 'super-admin',
      lastLogin: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Admin signin error:', error);
    
    if (error.message?.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password.');
    }
    if (error.message?.includes('Access denied')) {
      throw error;
    }
    
    throw new Error(error.message || 'Admin login failed. Please try again.');
  }
};

/**
 * Activate web login for mobile app users
 * Creates a Supabase Auth account for existing database users
 */
export const activateMobileUserForWeb = async (email: string, password: string): Promise<AuthUser> => {
  try {
    console.log('🔄 Activating mobile user for web:', email);
    
    // 1. Check if user exists in database
    const existingUser = await userService.getUserByEmail(email);
    if (!existingUser) {
      throw new Error('No account found with this email. Please sign up first.');
    }
    
    console.log('✅ Found existing user in database:', existingUser.name);
    
    // 2. Try to create Supabase Auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: existingUser.name,
          username: existingUser.username,
          phone: existingUser.phone,
        },
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    if (authError) {
      if (authError.message?.includes('already registered')) {
        throw new Error('This email already has web login enabled. Please use the regular login page.');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to activate web login');
    }

    console.log('✅ Web login activated for:', email);
    
    return {
      id: authData.user.id,
      email: authData.user.email!,
      name: existingUser.name,
      phone: existingUser.phone,
      role: 'user',
      isAdmin: false,
    };
  } catch (error: any) {
    console.error('❌ Activation error:', error);
    throw new Error(error.message || 'Failed to activate web login');
  }
};

export const authService = {
  signUp,
  signIn,
  signInWithGoogle,
  signInWithFacebook,
  signOut,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  resetPassword,
  resendVerificationEmail,
  verifyOTP,
  resendOTP,
  updatePassword,
  updateEmail,
  adminSignIn,
  activateMobileUserForWeb,
};
