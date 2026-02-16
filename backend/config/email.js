const SibApiV3Sdk = require('sib-api-v3-sdk');

// Check if Brevo is configured
if (!process.env.BREVO_API_KEY) {
  console.log('⚠️  Brevo email service not configured - Emails will be skipped');
}

let apiInstance = null;

// Only configure if API key exists
if (process.env.BREVO_API_KEY) {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  console.log('✅ Brevo email service configured');
}

/**
 * Send email using Brevo
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.htmlContent - HTML content
 * @param {string} emailData.textContent - Plain text content (optional)
 */
const sendEmail = async (emailData) => {
  // Skip if Brevo not configured
  if (!apiInstance || !process.env.BREVO_API_KEY) {
    console.log(`📧 [SKIPPED] Email to ${emailData.to}: ${emailData.subject}`);
    return { message: 'Email sending skipped - Brevo not configured' };
  }

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    };

    sendSmtpEmail.to = [{ email: emailData.to }];
    sendSmtpEmail.subject = emailData.subject;
    sendSmtpEmail.htmlContent = emailData.htmlContent;

    if (emailData.textContent) {
      sendSmtpEmail.textContent = emailData.textContent;
    }

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully:', emailData.to);
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    // Don't throw error - just log it
    return { error: error.message };
  }
};

module.exports = { sendEmail };
