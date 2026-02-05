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
 * Consultation Booked Email
 * @param {string} ticketNumber - Consultation ticket number
 * @param {string} type - Consultation type (CA/LAWYER)
 * @returns {object} Email template
 */
exports.consultationBookedEmail = (ticketNumber, type) => {
  return {
    subject: 'Consultation Booking Confirmed',
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
            <p>Your ${type} consultation has been successfully booked.</p>
            <div class="ticket">
              <p>Your Ticket Number:</p>
              <p class="ticket-number">${ticketNumber}</p>
            </div>
            <p>Please save this ticket number for future reference.</p>
            <p>Our team will contact you shortly to schedule your consultation.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} United Fillings. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `Your ${type} consultation booking is confirmed. Ticket Number: ${ticketNumber}`,
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
