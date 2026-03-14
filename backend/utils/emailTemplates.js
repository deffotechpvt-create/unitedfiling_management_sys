/**
 * Email Templates for Brevo
 */

/**
 * Welcome Email Template
 * @param {string} name - User name
 * @returns {object} Email template
 */
exports.welcomeEmail = (name) => {
  return {
    subject: 'Welcome to United Fillings Platform',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to United Fillings!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for joining United Fillings Compliance Platform.</p>
            <p>We're excited to help you manage your compliance requirements efficiently.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} United Fillings. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `Welcome to United Fillings, ${name}! Thank you for joining our platform.`,
  };
};

/**
 * Consultation Booked Email (USER Payment Confirmation)
 * @param {string} userName - User name
 * @param {string} type - Consultation type
 * @param {string} date - Preferred date
 * @param {string} paymentId - Razorpay Payment ID
 * @returns {object} Email template
 */
exports.consultationBookedEmail = (userName, type, date, paymentId) => {
  return {
    subject: 'Consultation Booked Successfully ✅ - United Fillings',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .ticket { background-color: #fff; border: 2px dashed #2196F3; padding: 15px; margin: 20px 0; text-align: center; }
          .ticket-number { font-size: 24px; font-weight: bold; color: #2196F3; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your consultation has been booked and payment received.</p>
            <ul>
              <li><strong>Consultation:</strong> ${type}</li>
              <li><strong>Preferred Date:</strong> ${date}</li>
              <li><strong>Amount Paid:</strong> ₹1,000</li>
              <li><strong>Payment ID:</strong> ${paymentId}</li>
            </ul>
            <p>Our expert will contact you within 24 hours.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} United Fillings. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `Hi ${userName}, Your consultation has been booked and payment received. Amount Paid: ₹1,000. Payment ID: ${paymentId}. Our expert will contact you within 24 hours.`,
  };
};

/**
 * ADMIN New Consultation Notification
 * @param {string} userName - User name
 * @param {string} userEmail - User email
 * @param {string} title - Consultation type
 * @param {string} description - Notes
 * @param {string} date - Preferred date
 * @returns {object} Email template
 */
exports.adminConsultationNotificationEmail = (userName, userEmail, title, description, date) => {
  return {
    subject: 'New Paid Consultation Request 💼 - United Fillings',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">New Paid Consultation Request</h2>
          <ul>
            <li><strong>Client:</strong> ${userName} (${userEmail})</li>
            <li><strong>Consultation:</strong> ${title}</li>
            <li><strong>Description:</strong> ${description || 'N/A'}</li>
            <li><strong>Preferred Date:</strong> ${date}</li>
            <li><strong>Payment Confirmed:</strong> ₹1,000</li>
          </ul>
          <p>Please confirm and contact the client.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `New Paid Consultation Request from ${userName} (${userEmail}). Type: ${title}. Date: ${date}. Payment Confirmed: ₹1,000.`
  };
};

/**
 * Client Assigned to Admin Email
 * @param {string} adminName - Admin name
 * @param {string} clientName - Client name
 * @returns {object} Email template
 */
exports.clientAssignedEmail = (adminName, clientName) => {
  return {
    subject: 'New Client Assigned',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Client Assignment</h1>
          </div>
          <div class="content">
            <p>Hello ${adminName},</p>
            <p>A new client <strong>${clientName}</strong> has been assigned to you.</p>
            <p>Please log in to your dashboard to view client details and pending tasks.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} United Fillings. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `Hello ${adminName}, a new client ${clientName} has been assigned to you.`,
  };
};

/**
 * OTP Email Template
 * @param {string} name - User name
 * @param {string} otp - OTP code
 * @returns {object} Email template
 */
exports.otpEmail = (name, otp) => {
  return {
    subject: 'Verification Code for Consultation Booking',
    htmlContent: `
    < !DOCTYPE html >
      <html>
        <head>
          <style>
            body {font - family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container {max - width: 600px; margin: 0 auto; padding: 20px; }
            .header {background - color: #673AB7; color: white; padding: 20px; text-align: center; }
            .content {padding: 20px; background-color: #f9f9f9; text-align: center; }
            .otp-code {font - size: 32px; font-weight: bold; color: #673AB7; letter-spacing: 5px; margin: 20px 0; }
            .footer {text - align: center; padding: 20px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verification Code</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Your verification code for booking a consultation is:</p>
              <div class="otp-code">${otp}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} United Fillings. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
  `,
    textContent: `Hello ${name}, your verification code for booking a consultation is: ${otp}. This code will expire in 10 minutes.`,
  };
};

/**
 * Consultation Scheduled Email
 * @param {string} name - User name
 * @param {string} type - Consultation type
 * @param {string} date - Scheduled date
 * @param {string} time - Scheduled time
 * @returns {object} Email template
 */
exports.consultationScheduledEmail = (name, type, date, time) => {
  return {
    subject: 'Consultation Scheduled Successfully',
    htmlContent: `
    < !DOCTYPE html >
      <html>
        <head>
          <style>
            body {font - family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container {max - width: 600px; margin: 0 auto; padding: 20px; }
            .header {background - color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content {padding: 20px; background-color: #f9f9f9; }
            .details {background - color: #fff; padding: 15px; border-left: 5px solid #4CAF50; margin: 20px 0; }
            .footer {text - align: center; padding: 20px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Consultation Scheduled!</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Your ${type} consultation has been scheduled successfully.</p>
              <div class="details">
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
              </div>
              <p>Our expert will join you at the scheduled time.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} United Fillings. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
  `,
    textContent: `Hello ${name}, your ${type} consultation has been scheduled for ${date} at ${time}.`,
  };
};

/**
 * Password Reset Email Template
 * @param {string} name - User name
 * @param {string} resetLink - Password reset link
 * @returns {object} Email template
 */
exports.passwordResetEmail = (name, resetLink) => {
  return {
    subject: 'Password Reset Request - United Fillings',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #f44336; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click on the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <p>The link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} United Fillings. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `Hi ${name}, Please reset your password by clicking this link: ${resetLink}. If you did not request this, ignore this email. The link will expire in 1 hour.`,
  };
};

