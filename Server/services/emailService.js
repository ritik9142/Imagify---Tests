import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail app password
  }
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.BACKEND_URL}/api/user/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Remage Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
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
          .button {
            display: inline-block;
            padding: 12px 20px;
            margin: 20px 0;
            background-color: #008080;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
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
          <img src="https://d3v5mrcg9cc5a5.cloudfront.net/i6i1k1%2Fpreview%2F65577654%2Fmain_large.png?response-content-disposition=inline%3Bfilename%3D%22main_large.png%22%3B&response-content-type=image%2Fpng&Expires=1742775625&Signature=JDdncXh5bZEamscX-5DJAQ0q9isLqWTItPAayVtCNmOUQw84Y~2cPe9zIIfEcG34PIXoUBOe8WT7hv2MyzpdMAtixa6sGB5C6EBzFVms78tvqCB9XBHZBqomLRdn0jep3RTU1ar5DZDgCpiUGMYNbp3NZ4BwwDWYf-JQHBqdMcDxgWVH67VZr4ytsr~BGRn18EtgHugvEqEQAYvzZEmBnSXc~XuRfbUZ8NURU1v3QHdKv1tgCmx84vGV9kdkLLvK6B5aFucADCYmYthF1MQf9NvFn28uvhfVg2otrJaXFAT~pvrRG31f7JLl9DtSLkhHSWFc10xhYdVdmrdvQY7RGg__&Key-Pair-Id=APKAJT5WQLLEOADKLHBQ" alt="Computer man" style="width:100px;height:100px;">
            <h1>Welcome to Remage</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for registering with Remage! Please verify your email address by clicking the button below:</p>
            <p><a class="button" href="${verificationUrl}">Verify Email</a></p>
            <p>This link will expire in 1 hour. If you did not create an account, please ignore this email.</p>
            <p>Click on Below Image for Tutorial.</p>
            <p>Best regards,<br>The Remage Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Remage. All rights reserved.</p>
            <img src="https://d2x4uvp6kxufyv.cloudfront.net/w0ktj1%2Fpreview%2F65577368%2Fmain_large.gif?response-content-disposition=inline%3Bfilename%3D%22main_large.gif%22%3B&response-content-type=image%2Fgif&Expires=1742775399&Signature=eTuBhZYZIJX3ib5qSuAm8FURuHiXxK05VvrHh6upXZlAsgu0APxMgUXmxe~hmOw3YewAr-H0VbBZ86lcw6TnPKQ3MjRxxTyAISrLZ-xcAbu3TpeHUgI~LR1Sj8cOWMuMa7hPBQZGWcCUckbto08cMwvytwPv9t63y3fpH5NcJWfPxe-Uy3GRrQNRcPArnOBsZIMzMr5hTN9hfFvdFLOWzRuNpnuPWxOHvJ5jqpuOPhHbZ9764v~NaZoscsgSZ04MgOu5AIaQ~O4q37O0vr5dnKcdWkFAXjt-4WEaNRfZB9DnE49qf60YduISXG4OjL-B8eypG5T7VzFckdym8tjhyA__&Key-Pair-Id=APKAJT5WQLLEOADKLHBQ" >
          </div>
        </div>
      </body>
      </html>
    `
  });
};
