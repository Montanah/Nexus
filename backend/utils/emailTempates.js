// utils/emailTemplates.js
module.exports = {
  paymentReceived: (amount, transactionId) => ({
    subject: `Payment of $${amount} Received`,
    text: `Your payment of $${amount} has been received.\nTransaction ID: ${transactionId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Payment Received</h2>
        <p>Your payment of <strong>$${amount}</strong> has been successfully processed.</p>
        <p>Transaction ID: <code>${transactionId}</code></p>
        <p>Thank you for using our escrow service!</p>
      </div>
    `
  }),
  disputeNotification: (reason, disputeId) => ({
    subject: `Dispute Opened: ${reason.substring(0, 30)}...`,
    text: `A dispute has been opened:\nReason: ${reason}\nDispute ID: ${disputeId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Dispute Notification</h2>
        <p>A dispute has been opened regarding your transaction.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Dispute ID: ${disputeId}</p>
        <a href="${process.env.APP_URL}/disputes/${disputeId}" 
           style="display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">
          View Dispute
        </a>
      </div>
    `
  }),

  welcomeUser: (userName, verificationCode) => ({
    subject: `🌟 Welcome to NEXUS, ${userName}! Verify Your Account`,
    text: `
      Welcome to NEXUS - Global Delivery Reimagined

      Hi ${userName},
      
      Thank you for joining NEXUS! To get started, please verify your account with this code:
      Verification Code: ${verificationCode}
      (Expires in 10 minutes)

      Need help? Contact support@nexus.com

      The NEXUS Team
    `,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #6C5CE7; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌟 Welcome to NEXUS!</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #6C5CE7;">Hi ${userName},</h2>
          
          <p>Thank you for joining <strong>NEXUS</strong> - Global Delivery Reimagined!</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #6C5CE7; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Verification Code:</h3>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #6C5CE7;">
              ${verificationCode}
            </div>
            <p><small>(Expires in 10 minutes)</small></p>
          </div>
          
          <h3 style="color: #6C5CE7;">What's next?</h3>
          <ol>
            <li>Complete your profile</li>
            <li>Verify your account</li>
            <li>Start using the platform</li>
          </ol>
          
          <a href="https://nexus.example.com/getting-started" 
             style="display: inline-block; padding: 12px 24px; background: #6C5CE7; color: white; 
                    text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Get Started Guide
          </a>
          
          <p>Need help? <a href="mailto:support@nexus.com">Contact our support team</a></p>
          
          <p>Best regards,<br>The NEXUS Team</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} NEXUS. All rights reserved.</p>
        </div>
      </div>
    `
  })
};