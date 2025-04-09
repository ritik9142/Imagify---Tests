import nodemailer from 'nodemailer';

// Helper function to generate a random verification code
// Requirements: at least 6 characters with uppercase, lowercase, numbers, and special characters.
const generateVerificationCode = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '!@#$%^&*';
  const allChars = upper + lower + numbers + specials;
  let code = '';
  
  // Ensure at least one character from each category is included
  code += upper[Math.floor(Math.random() * upper.length)];
  code += lower[Math.floor(Math.random() * lower.length)];
  code += numbers[Math.floor(Math.random() * numbers.length)];
  code += specials[Math.floor(Math.random() * specials.length)];
  
  // Fill the rest to meet a minimum of 6 characters
  for (let i = 4; i < 6; i++) {
    code += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Optionally shuffle the characters so that the fixed positions are randomized
  code = code.split('').sort(() => Math.random() - 0.5).join('');
  return code;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail app password
  }
});

export const sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Verification Code for Krutishu',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Verification Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border: 1px solid #e1e1e1;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #008080;
            padding: 20px;
            text-align: center;
            color: #ffffff;
          }
          .content {
            padding: 20px;
            color: #333333;
          }
          .code {
            font-size: 24px;
            font-weight: bold;
            color: #008080;
            letter-spacing: 2px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            font-size: 12px;
            text-align: center;
            color: #777777;
            padding: 10px;
            border-top: 1px solid #e1e1e1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            
            <h1>Welcome to Krutishu</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for registering with Krutishu! Please use the verification code below to verify your email address:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 1 hour. If you did not create an account, please ignore this email.</p>
            <p>For a tutorial, please click the image below.</p>
            <p>Best regards,<br>The Krutishu Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Krutishu. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  });
};

export { generateVerificationCode };
