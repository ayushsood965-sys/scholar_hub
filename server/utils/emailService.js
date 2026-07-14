const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || '169.58.12.127',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'admin@scholarhubhpu.in',
      pass: process.env.SMTP_PASS || 'Ayush1994*',
    },
    tls: {
      // Allow self-signed or unverified certificates from the local mailserver
      rejectUnauthorized: false,
    },
  });
};

/**
 * Sends a verification email to a newly registered user
 * @param {string} email User email address
 * @param {string} name User's name
 * @param {string} token Verification token
 * @param {'sync'|'track'} portal The portal they registered on
 */
const sendVerificationEmail = async (email, name, token, portal) => {
  const transporter = createTransporter();
  
  const frontendUrl = portal === 'track' 
    ? (process.env.TRACK_FRONTEND_URL || 'https://track.scholarhubhpu.in')
    : (process.env.SYNC_FRONTEND_URL || 'https://sync.scholarhubhpu.in');

  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  const portalName = portal === 'track' ? 'ScholarTrack' : 'ScholarSync';

  // Portal specific color theme
  const isTrack = portal === 'track';
  const primaryBgGradient = isTrack 
    ? 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' // Dark Teal
    : 'linear-gradient(135deg, #133A26 0%, #1A5A3B 100%)'; // Forest Green
  const btnBg = isTrack ? '#14B8A6' : '#10B981'; // Mint Teal vs Emerald Green
  const accentColor = isTrack ? '#0F766E' : '#1A5A3B';
  const cardBorderTop = isTrack ? '4px solid #14B8A6' : '4px solid #10B981';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"ScholarHub HPU" <admin@scholarhubhpu.in>',
    to: email,
    subject: `Verify Your Email Address - ${portalName}`,
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 48px 16px; margin: 0; min-height: 100%;">
        <div style="max-width: 580px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03); margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; border-top: ${cardBorderTop};">
          
          <!-- Header Banner -->
          <div style="background: ${primaryBgGradient}; padding: 36px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${portalName}</h1>
            <p style="margin: 6px 0 0; opacity: 0.9; font-size: 0.9rem; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600;">Himachal Pradesh University</p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
            <h2 style="margin-top: 0; font-size: 1.25rem; font-weight: 600; color: #0f172a;">Hello ${name},</h2>
            <p style="font-size: 0.98rem; color: #475569; margin-bottom: 24px;">
              Thank you for registering on the <strong style="color: ${accentColor};">${portalName}</strong> portal. 
              Before you can access your dashboard and get started, we need to verify your email address.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 36px 0;">
              <a href="${verificationLink}" style="background-color: ${btnBg}; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 600; font-size: 0.95rem; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15); transition: all 0.2s ease;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #cbd5e1;">
              This verification link will expire in <strong>24 hours</strong>. If you did not sign up for this account, you can safely ignore this email.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 36px 0 24px;" />
            
            <!-- Link Fallback -->
            <p style="font-size: 0.82rem; color: #94a3b8; margin: 0; word-break: break-all; text-align: center;">
              If the button doesn't work, copy and paste this URL into your web browser:<br />
              <a href="${verificationLink}" style="color: ${accentColor}; text-decoration: underline; display: block; margin-top: 8px;">${verificationLink}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 6px; font-weight: 600; color: #64748b;">&copy; 2026 ScholarHub HPU. All rights reserved.</p>
            <p style="margin: 0;">This is an automated system email. Please do not reply directly to this message.</p>
          </div>
          
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Sends a password reset email to a user
 * @param {string} email User email address
 * @param {string} name User's name
 * @param {string} token Password reset token
 * @param {'sync'|'track'} portal The portal they requested from
 */
const sendPasswordResetEmail = async (email, name, token, portal) => {
  const transporter = createTransporter();
  
  const frontendUrl = portal === 'track' 
    ? (process.env.TRACK_FRONTEND_URL || 'https://track.scholarhubhpu.in')
    : (process.env.SYNC_FRONTEND_URL || 'https://sync.scholarhubhpu.in');

  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  const portalName = portal === 'track' ? 'ScholarTrack' : 'ScholarSync';

  // Portal specific color theme
  const isTrack = portal === 'track';
  const primaryBgGradient = isTrack 
    ? 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' // Dark Teal
    : 'linear-gradient(135deg, #133A26 0%, #1A5A3B 100%)'; // Forest Green
  const btnBg = isTrack ? '#14B8A6' : '#10B981'; // Mint Teal vs Emerald Green
  const accentColor = isTrack ? '#0F766E' : '#1A5A3B';
  const cardBorderTop = isTrack ? '4px solid #14B8A6' : '4px solid #10B981';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"ScholarHub HPU" <admin@scholarhubhpu.in>',
    to: email,
    subject: `Reset Your Password - ${portalName}`,
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 48px 16px; margin: 0; min-height: 100%;">
        <div style="max-width: 580px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03); margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; border-top: ${cardBorderTop};">
          
          <!-- Header Banner -->
          <div style="background: ${primaryBgGradient}; padding: 36px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${portalName}</h1>
            <p style="margin: 6px 0 0; opacity: 0.9; font-size: 0.9rem; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600;">Himachal Pradesh University</p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
            <h2 style="margin-top: 0; font-size: 1.25rem; font-weight: 600; color: #0f172a;">Hello ${name},</h2>
            <p style="font-size: 0.98rem; color: #475569; margin-bottom: 24px;">
              We received a request to reset the password for your <strong style="color: ${accentColor};">${portalName}</strong> account. 
              Please click the button below to set a new password.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 36px 0;">
              <a href="${resetLink}" style="background-color: ${btnBg}; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 600; font-size: 0.95rem; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15); transition: all 0.2s ease;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #cbd5e1;">
              This password reset link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 36px 0 24px;" />
            
            <!-- Link Fallback -->
            <p style="font-size: 0.82rem; color: #94a3b8; margin: 0; word-break: break-all; text-align: center;">
              If the button doesn't work, copy and paste this URL into your web browser:<br />
              <a href="${resetLink}" style="color: ${accentColor}; text-decoration: underline; display: block; margin-top: 8px;">${resetLink}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 6px; font-weight: 600; color: #64748b;">&copy; 2026 ScholarHub HPU. All rights reserved.</p>
            <p style="margin: 0;">This is an automated system email. Please do not reply directly to this message.</p>
          </div>
          
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Sends a system notification email to a single recipient or a group of users
 * @param {object} notification The Notification document
 */
const sendNotificationEmail = async (notification) => {
  const User = require('../models/User');
  const transporter = createTransporter();

  // Resolve recipients
  let recipients = []; // Array of { email, name }
  
  if (notification.recipient) {
    // Individual notification
    const user = await User.findById(notification.recipient);
    if (user && user.username) {
      recipients.push({ email: user.username, name: user.name });
    }
  } else if (notification.roleScope) {
    // Group notification
    const query = { role: notification.roleScope };
    if (notification.department) {
      query.department = notification.department;
    }
    const users = await User.find(query);
    for (const u of users) {
      if (u.username) {
        recipients.push({ email: u.username, name: u.name });
      }
    }
  }

  if (recipients.length === 0) {
    console.log(`No email recipients found for notification ${notification._id}`);
    return false;
  }

  // Determine portal specific styling
  const isTrack = notification.source === 'SCHOLAR_TRACK';
  const portalName = isTrack ? 'ScholarTrack' : 'ScholarSync';
  
  const frontendUrl = isTrack 
    ? (process.env.TRACK_FRONTEND_URL || 'https://track.scholarhubhpu.in')
    : (process.env.SYNC_FRONTEND_URL || 'https://sync.scholarhubhpu.in');

  const primaryBgGradient = isTrack 
    ? 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' // Dark Teal
    : 'linear-gradient(135deg, #133A26 0%, #1A5A3B 100%)'; // Forest Green
  const btnBg = isTrack ? '#14B8A6' : '#10B981'; // Mint Teal vs Emerald Green
  const accentColor = isTrack ? '#0F766E' : '#1A5A3B';
  const cardBorderTop = isTrack ? '4px solid #14B8A6' : '4px solid #10B981';

  // Construct target link
  const targetLink = notification.link 
    ? `${frontendUrl}/${notification.link}`
    : frontendUrl;

  // Send email to each recipient
  for (const recipient of recipients) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"ScholarHub HPU" <admin@scholarhubhpu.in>',
      to: recipient.email,
      subject: `Notification: ${notification.title} - ${portalName}`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 48px 16px; margin: 0; min-height: 100%;">
          <div style="max-width: 580px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03); margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; border-top: ${cardBorderTop};">
            
            <!-- Header Banner -->
            <div style="background: ${primaryBgGradient}; padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 1.6rem; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${portalName}</h1>
              <p style="margin: 6px 0 0; opacity: 0.9; font-size: 0.85rem; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600;">Himachal Pradesh University</p>
            </div>
            
            <!-- Content Body -->
            <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
              <h2 style="margin-top: 0; font-size: 1.2rem; font-weight: 600; color: #0f172a;">Hello ${recipient.name},</h2>
              
              <div style="background-color: #f8fafc; border-left: 4px solid ${btnBg}; padding: 18px 20px; border-radius: 8px; margin: 24px 0 28px;">
                <p style="margin: 0; font-size: 0.98rem; color: #475569; line-height: 1.5;">
                  ${notification.message}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0 12px;">
                <a href="${targetLink}" style="background-color: ${btnBg}; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 600; font-size: 0.92rem; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15); transition: all 0.2s ease;">
                  View in Dashboard
                </a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 24px;" />
              
              <!-- Link Fallback -->
              <p style="font-size: 0.8rem; color: #94a3b8; margin: 0; word-break: break-all; text-align: center;">
                If the button doesn't work, copy and paste this URL into your web browser:<br />
                <a href="${targetLink}" style="color: ${accentColor}; text-decoration: underline; display: block; margin-top: 6px;">${targetLink}</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 0.72rem; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 6px; font-weight: 600; color: #64748b;">&copy; 2026 ScholarHub HPU. All rights reserved.</p>
              <p style="margin: 0;">This is an automated system email. Please do not reply directly to this message.</p>
            </div>
            
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Notification email sent to ${recipient.email} for notification ${notification._id}`);
    } catch (error) {
      console.error(`Failed to send notification email to ${recipient.email}:`, error);
    }
  }

  return true;
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
