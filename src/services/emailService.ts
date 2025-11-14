import { supabase } from '../lib/supabase';

// Email Configuration
// You'll need to set these environment variables:
// VITE_EMAIL_SERVICE: 'resend' | 'sendgrid' | 'supabase'
// VITE_EMAIL_API_KEY: Your API key
// VITE_EMAIL_FROM: Your sender email (e.g., noreply@motorent.com)

const EMAIL_SERVICE = (import.meta as any).env?.VITE_EMAIL_SERVICE || 'console'; // default to console for dev
const EMAIL_API_KEY = (import.meta as any).env?.VITE_EMAIL_API_KEY || '';
const EMAIL_FROM = (import.meta as any).env?.VITE_EMAIL_FROM || 'noreply@motorent.com';
const APP_URL = (import.meta as any).env?.VITE_APP_URL || 'http://localhost:5173';

// Email Templates
const emailTemplates = {
  bookingConfirmation: (data: {
    userName: string;
    motorcycleName: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    reservationId: string;
  }) => ({
    subject: '🏍️ Booking Confirmation - MotoRent Dumaguete',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .total { font-size: 1.5em; color: #667eea; font-weight: bold; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ Booking Confirmed!</h1>
            <p>Thank you for choosing MotoRent Dumaguete</p>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your motorcycle rental has been confirmed! Here are your booking details:</p>
            
            <div class="card">
              <h2 style="margin-top: 0; color: #667eea;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Reservation ID:</span>
                <span class="detail-value">#${data.reservationId.slice(0, 8)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Motorcycle:</span>
                <span class="detail-value">${data.motorcycleName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span>
                <span class="detail-value">${data.startDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span>
                <span class="detail-value">${data.endDate}</span>
              </div>
              <div class="detail-row" style="border-bottom: none; margin-top: 15px;">
                <span class="detail-label">Total Amount:</span>
                <span class="total">₱${data.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Your booking is pending admin approval</li>
              <li>Please upload your driver's license and valid ID if you haven't already</li>
              <li>You'll receive another email once your booking is approved</li>
              <li>Make sure to bring your ID on pickup day</li>
            </ul>

            <center>
              <a href="${APP_URL}/reservations" class="button">View My Reservations</a>
            </center>

            <p>If you have any questions, feel free to contact us.</p>
            <p>Safe riding! 🏍️</p>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete - Your Trusted Motorcycle Rental</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Confirmed!
      
      Hi ${data.userName},
      
      Your motorcycle rental has been confirmed!
      
      Reservation ID: #${data.reservationId.slice(0, 8)}
      Motorcycle: ${data.motorcycleName}
      Start Date: ${data.startDate}
      End Date: ${data.endDate}
      Total Amount: ₱${data.totalPrice.toLocaleString()}
      
      Your booking is pending admin approval. Please upload your ID documents if you haven't already.
      
      View your reservations: ${APP_URL}/reservations
      
      Safe riding!
      MotoRent Dumaguete
    `
  }),

  bookingApproved: (data: {
    userName: string;
    motorcycleName: string;
    startDate: string;
    endDate: string;
    pickupLocation: string;
  }) => ({
    subject: '✅ Booking Approved - Ready to Ride!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Approved!</h1>
            <div class="success-badge">READY TO RIDE</div>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Great news! Your booking has been approved. You're all set to hit the road! 🎉</p>
            
            <div class="card">
              <h2 style="margin-top: 0; color: #10b981;">Rental Details</h2>
              <div class="detail-row">
                <span style="font-weight: bold;">Motorcycle:</span>
                <span>${data.motorcycleName}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold;">Pickup Date:</span>
                <span>${data.startDate}</span>
              </div>
              <div class="detail-row">
                <span style="font-weight: bold;">Return Date:</span>
                <span>${data.endDate}</span>
              </div>
              <div class="detail-row" style="border-bottom: none;">
                <span style="font-weight: bold;">Pickup Location:</span>
                <span>${data.pickupLocation}</span>
              </div>
            </div>

            <p><strong>Important Reminders:</strong></p>
            <ul>
              <li>✅ Bring your valid ID and driver's license</li>
              <li>✅ Arrive 15 minutes early for vehicle inspection</li>
              <li>✅ Check fuel level and motorcycle condition before leaving</li>
              <li>✅ Return the motorcycle on time to avoid late fees</li>
              <li>✅ Drive safely and enjoy your ride!</li>
            </ul>

            <center>
              <a href="${APP_URL}/reservations" class="button">View Booking Details</a>
            </center>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete</p>
            <p>Questions? Contact us at support@motorent.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Booking Approved!\n\nHi ${data.userName},\n\nYour booking for ${data.motorcycleName} has been approved!\nPickup: ${data.startDate}\nReturn: ${data.endDate}\nLocation: ${data.pickupLocation}\n\nRemember to bring your ID and license. Safe riding!`
  }),

  bookingRejected: (data: {
    userName: string;
    motorcycleName: string;
    reason: string;
  }) => ({
    subject: '❌ Booking Update - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fee; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Update Required</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>We regret to inform you that your booking for <strong>${data.motorcycleName}</strong> could not be approved at this time.</p>
            
            <div class="alert-box">
              <strong>Reason:</strong><br>
              ${data.reason}
            </div>

            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Review the reason above</li>
              <li>Check your uploaded documents</li>
              <li>Update your information if needed</li>
              <li>Try booking again or choose another motorcycle</li>
            </ul>

            <center>
              <a href="${APP_URL}/profile" class="button">Update My Profile</a>
            </center>

            <p>If you have questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Booking Update\n\nHi ${data.userName},\n\nYour booking for ${data.motorcycleName} was not approved.\n\nReason: ${data.reason}\n\nPlease update your information and try again.`
  }),

  documentApproved: (data: {
    userName: string;
    documentType: string;
  }) => ({
    subject: '✅ Document Verified - You\'re All Set!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .icon { font-size: 60px; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">📄✅</div>
            <h1>Document Verified!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Great news! Your <strong>${data.documentType === 'driver-license' ? 'Driver\'s License' : 'Valid ID'}</strong> has been verified and approved.</p>
            
            <p>You can now:</p>
            <ul>
              <li>✅ Make motorcycle bookings</li>
              <li>✅ Enjoy faster checkout process</li>
              <li>✅ Access all platform features</li>
            </ul>

            <center>
              <a href="${APP_URL}/motorcycles" class="button">Browse Motorcycles</a>
            </center>

            <p>Thank you for completing your verification! 🎉</p>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Document Verified!\n\nHi ${data.userName},\n\nYour ${data.documentType === 'driver-license' ? 'Driver\'s License' : 'Valid ID'} has been approved!\n\nYou can now make bookings. Happy riding!`
  }),

  documentRejected: (data: {
    userName: string;
    documentType: string;
    reason: string;
  }) => ({
    subject: '❌ Document Verification - Resubmission Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Document Needs Attention</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your <strong>${data.documentType === 'driver-license' ? 'Driver\'s License' : 'Valid ID'}</strong> requires resubmission.</p>
            
            <div class="alert-box">
              <strong>Reason for rejection:</strong><br>
              ${data.reason}
            </div>

            <p><strong>How to fix this:</strong></p>
            <ul>
              <li>Review the reason above carefully</li>
              <li>Prepare a clear, high-quality photo/scan</li>
              <li>Make sure all details are visible</li>
              <li>Upload the new document in your profile</li>
            </ul>

            <p><strong>Tips for a successful upload:</strong></p>
            <ul>
              <li>✅ Use good lighting</li>
              <li>✅ Ensure the document is not expired</li>
              <li>✅ Make sure all text is readable</li>
              <li>✅ File size under 5MB (JPG, PNG, or PDF)</li>
            </ul>

            <center>
              <a href="${APP_URL}/profile" class="button">Upload New Document</a>
            </center>

            <p>Once approved, you'll be able to make bookings right away!</p>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete</p>
            <p>Need help? Contact support@motorent.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Document Resubmission Required\n\nHi ${data.userName},\n\nYour ${data.documentType === 'driver-license' ? 'Driver\'s License' : 'Valid ID'} was not approved.\n\nReason: ${data.reason}\n\nPlease upload a new document at ${APP_URL}/profile`
  }),

  passwordReset: (data: {
    userName: string;
    resetLink: string;
  }) => ({
    subject: '🔐 Reset Your Password - MotoRent',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${data.resetLink}" class="button">Reset My Password</a>
            </center>

            <p style="color: #666; font-size: 0.9em;">Or copy this link: ${data.resetLink}</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              • This link expires in 1 hour<br>
              • If you didn't request this, please ignore this email<br>
              • Never share this link with anyone
            </div>

            <p>If you're having trouble, contact our support team.</p>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete</p>
            <p>This is an automated security email</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Password Reset Request\n\nHi ${data.userName},\n\nReset your password: ${data.resetLink}\n\nThis link expires in 1 hour.\n\nDidn't request this? Ignore this email.\n\nMotoRent Dumaguete`
  }),

  paymentReminder: (data: {
    userName: string;
    motorcycleName: string;
    amount: number;
    dueDate: string;
    reservationId: string;
  }) => ({
    subject: '💳 Payment Reminder - MotoRent Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { font-size: 2em; color: #f59e0b; font-weight: bold; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>This is a friendly reminder about your upcoming payment for your motorcycle rental.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Booking Details:</strong></p>
              <p>Motorcycle: ${data.motorcycleName}</p>
              <p>Reservation ID: #${data.reservationId.slice(0, 8)}</p>
              <p>Due Date: ${data.dueDate}</p>
              <div class="amount">₱${data.amount.toLocaleString()}</div>
            </div>

            <p><strong>Payment Methods:</strong></p>
            <ul>
              <li>💵 Cash (pay at pickup)</li>
              <li>📱 GCash (send to our number)</li>
            </ul>

            <center>
              <a href="${APP_URL}/reservations" class="button">View Reservation</a>
            </center>
          </div>
          <div class="footer">
            <p>MotoRent Dumaguete</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Payment Reminder\n\nHi ${data.userName},\n\nPayment due for ${data.motorcycleName}\nAmount: ₱${data.amount.toLocaleString()}\nDue: ${data.dueDate}\n\nView details: ${APP_URL}/reservations`
  })
};

// Email sending functions
const sendEmailViaResend = async (to: string, subject: string, html: string, text: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return response.json();
};

const sendEmailViaSendGrid = async (to: string, subject: string, html: string, text: string) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: EMAIL_FROM },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  return response.json();
};

const sendEmailViaSupabase = async (to: string, subject: string, html: string, text: string) => {
  // This requires setting up Supabase Edge Functions with an email service
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html, text }
  });

  if (error) throw error;
  return data;
};

const sendEmailViaConsole = async (to: string, subject: string, html: string, text: string) => {
  // Development mode - just log to console
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 EMAIL (Development Mode)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Plain Text:');
  console.log(text);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('HTML (truncated):');
  console.log(html.substring(0, 500) + '...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return { success: true, mode: 'console' };
};

// Main send email function
const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  try {
    switch (EMAIL_SERVICE) {
      case 'resend':
        return await sendEmailViaResend(to, subject, html, text);
      case 'sendgrid':
        return await sendEmailViaSendGrid(to, subject, html, text);
      case 'supabase':
        return await sendEmailViaSupabase(to, subject, html, text);
      case 'console':
      default:
        return await sendEmailViaConsole(to, subject, html, text);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Public API
export const emailService = {
  // Send booking confirmation email
  async sendBookingConfirmation(data: {
    userEmail: string;
    userName: string;
    motorcycleName: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    reservationId: string;
  }) {
    const template = emailTemplates.bookingConfirmation(data);
    return sendEmail(data.userEmail, template.subject, template.html, template.text);
  },

  // Send booking approved email
  async sendBookingApproved(data: {
    userEmail: string;
    userName: string;
    motorcycleName: string;
    startDate: string;
    endDate: string;
    pickupLocation: string;
  }) {
    const template = emailTemplates.bookingApproved(data);
    return sendEmail(data.userEmail, template.subject, template.html, template.text);
  },

  // Send booking rejected email
  async sendBookingRejected(data: {
    userEmail: string;
    userName: string;
    motorcycleName: string;
    reason: string;
  }) {
    const template = emailTemplates.bookingRejected(data);
    return sendEmail(data.userEmail, template.subject, template.html, template.text);
  },

  // Send document approved email
  async sendDocumentApproved(data: {
    userEmail: string;
    userName: string;
    documentType: 'driver-license' | 'valid-id';
  }) {
    const template = emailTemplates.documentApproved(data);
    return sendEmail(data.userEmail, template.subject, template.html, template.text);
  },

  // Send document rejected email
  async sendDocumentRejected(data: {
    userEmail: string;
    userName: string;
    documentType: 'driver-license' | 'valid-id';
    reason: string;
  }) {
    const template = emailTemplates.documentRejected(data);
    return sendEmail(data.userEmail, template.subject, template.html, template.text);
  },

  // Send password reset email
  async sendPasswordReset(data: {
    userEmail: string;
    userName: string;
    resetLink: string;
  }) {
    const template = emailTemplates.passwordReset(data);
    return sendEmail(data.userEmail, template.subject, template.html, template.text);
  },

  // Send payment reminder email
  async sendPaymentReminder(data: {
    userEmail: string;
    userName: string;
    motorcycleName: string;
    amount: number;
    dueDate: string;
    reservationId: string;
  }) {
    const template = emailTemplates.paymentReminder(data);
    return sendEmail(data.userEmail, template.subject, template.html, template.text);
  },

  // Test email configuration
  async testEmail(to: string) {
    return sendEmail(
      to,
      '✅ Email Test - MotoRent',
      '<h1>Email Configuration Test</h1><p>If you\'re seeing this, your email service is working correctly! 🎉</p>',
      'Email Configuration Test\n\nIf you\'re seeing this, your email service is working correctly!'
    );
  }
};
