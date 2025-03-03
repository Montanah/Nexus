const nodemailer = require("nodemailer");

function sendEmail(email, subject, message) {

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

    transporter.verify((error, success) => {
        if (error) {
          console.log("Error connecting to email:", error);
        } else {
          console.log("Email server is ready to send messages!");   
        }
      });
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text: message,
      };

    transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };

  
  
  