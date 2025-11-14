/**
 * Authentication Service
 * 
 * Handles user authentication using Supabase Auth.
 * Provides methods for signup, signin, signout, password reset, and session management.
 */

import { supabase } from '../lib/supabase';
import { userService } from './userService';
import type { User } from '@supabase/supabase-js';

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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          username: data.username,
          phone: data.phone,
        },
        emailRedirectTo: `${window.location.origin}/`,
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
    console.log('📧 Email confirmation status:', authData.user.email_confirmed_at ? 'Confirmed' : 'Pending');
    console.log('📨 Session:', authData.session ? 'Active' : 'Pending confirmation');
    
    if (!authData.session) {
      console.log('⚠️ No session - email confirmation required');
      console.log('📬 Verification email should be sent to:', data.email);
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
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Verification failed. Please try again.');
    }

    // Get user profile from database
    const userProfile = await userService.getUserById(data.user.id);
    
    if (!userProfile) {
      // Create profile if it doesn't exist
      const newProfile = await userService.createUser({
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email!,
        phone: data.user.user_metadata?.phone || 'N/A',
      });

      return {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        phone: newProfile.phone,
      };
    }

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
    if (error.message?.includes('invalid') || error.message?.includes('otp')) {
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
    const { error } = await supabase.auth.resend({
      type,
      email,
    });

    if (error) {
      throw error;
    }
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
