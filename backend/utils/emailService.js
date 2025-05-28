// utils/emailService.js
const nodemailer = require("nodemailer");
const { response } = require("../utils/responses");

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Error connecting to email service:", error.message);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

/**
 * Send email with improved error handling and logging
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Plain text message
 * @param {string} [html] - HTML version of message (optional)
 * @returns {Promise<boolean>} - Whether email was sent successfully
 */
async function sendEmailNew(email, subject, message, html) {
  try {
    if (!email || !subject || !message) {
      throw new Error("Missing required email parameters");
    }

    const mailOptions = {
      from: `"Escrow Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: message,
      html: html || message, 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    return false;
  }
}

/**
 * Send email with template support
 * @param {string} email - Recipient email
 * @param {string} templateName - Template identifier
 * @param {object} templateData - Data to populate template
 * @returns {Promise<boolean>} - Whether email was sent successfully
 */
async function sendTemplatedEmail(email, templateName, templateData) {
  const templates = {
    payment_received: {
      subject: "Payment Received - Funds in Escrow",
      text: `Hello,\n\nYour payment of $${templateData.amount} has been received and placed in escrow.\n\nTransaction ID: ${templateData.transactionId}`,
      html: `<p>Hello,</p><p>Your payment of <strong>$${templateData.amount}</strong> has been received and placed in escrow.</p><p>Transaction ID: ${templateData.transactionId}</p>`
    },
    dispute_opened: {
      subject: "Dispute Opened - Action Required",
      text: `Hello,\n\nA dispute has been opened regarding your transaction.\n\nReason: ${templateData.reason}\n\nPlease log in to respond.`,
      html: `<p>Hello,</p><p>A dispute has been opened regarding your transaction.</p><p><strong>Reason:</strong> ${templateData.reason}</p><p>Please log in to respond.</p>`
    },
    // Add more templates as needed
  };

  const template = templates[templateName];
  if (!template) {
    console.error(`Template ${templateName} not found`);
    return false;
  }

  return sendEmailNew(email, template.subject, template.text, template.html);
}

module.exports = {
  sendEmailNew,
  sendTemplatedEmail,
  transporter 
};