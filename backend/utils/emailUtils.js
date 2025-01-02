const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();

const createTransporter = () => {
	return nodemailer.createTransport({
		service: "Gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
		tls: {
			rejectUnauthorized: false,
		},
	});
};

const sendEmail = async (email, subject, htmlContent) => {
	try {
		const transporter = createTransporter();
		const mailOptions = {
			from: `"BLITZ" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: subject,
			html: htmlContent,
		};

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.error("Error sending email:", error);
				throw new Error("Error in sending email");
			} else {
				console.log("Email sent:", info.response);
			}
		});
	} catch (error) {
		console.error("Email sending error: ", error);
		throw new Error("Error in sending email");
	}
};
const sendOTPEmail = async (email, otp) => {
    const currentYear = new Date().getFullYear();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your BLITZ Account</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
          body, h1, h2, h3, p {
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f7fa;
          }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" ss="min-width:100%;background-color:#f4f7fa;padding:20px;">
          <tr>
            <td align="center" style="padding:20px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding:40px 20px;background:linear-gradient(135deg, #6e8efb, #a777e3);">
                    <h1 style="font-size:28px;font-weight:600;color:#ffffff;margin:0;">
                      BLITZ
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding:40px 30px;">
                    <h2 style="font-size:24px;color:#333;margin-bottom:20px;text-align:center;">Verify Your Account</h2>
                    <p style="font-size:16px;color:#666;margin-bottom:30px;text-align:center;">
                      Welcome to BLITZ! We're thrilled to have you join our community of learners. To get started, please verify your account using the code below.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
                      <tr>
                        <td align="center">
                          <div style="background-color:#f0f4f8;border-radius:8px;padding:20px;display:inline-block;">
                            <h3 style="font-size:32px;font-weight:600;color:#6e8efb;letter-spacing:5px;margin:0;">
                              ${otp}
                            </h3>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size:14px;color:#888;text-align:center;margin-bottom:20px;">
                      This code will expire in 2 minutes. For your security, please don't share it with anyone.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="#" style="display:inline-block;background-color:#6e8efb;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:25px;font-size:16px;font-weight:600;transition:background-color 0.3s ease;">
                            Verify Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f0f4f8;padding:30px 20px;text-align:center;">
                    <p style="font-size:14px;color:#888;margin-bottom:10px;">
                      If you didn't request this verification, please ignore this email.
                    </p>
                    <p style="font-size:14px;color:#888;">
                      Need help? Contact us at <a href="mailto:ravivishnu929@gmail.com" style="color:#6e8efb;text-decoration:none;">ravivishnu929@gmail.com</a>
                    </p>
                    <p style="font-size:12px;color:#888;margin-top:20px;">
                      © ${currentYear} BLITZ. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  
    const subject = "🔑 Verify Your ECOMMERCE Account";
    await sendEmail(email, subject, htmlContent);
  };
  
  
const sendWelcomeMail = async (email) => {
	const subject = "Welcome to BLITZ";
	sendEmail(email, subject);
};

const sendPasswordResetEmail = async (email, resetLink) => {
    console.log(resetLink);
    
	const htmlContent = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #fff;">
    <div style="text-align: center; margin-bottom: 30px; position: relative;">
        <h1 style="font-size: 48px; font-weight: bold; margin: 0;">
             <span style="color: #FF5722;">Blitz</span>
        </h1>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #ff5722; font-size: 28px; margin: 0;">
            Password Reset Request 
        </h2>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">
            Don't worry, we'll help you get back on track! 
        </p>
    </div>

    <div style="border: 2px border-radius: 15px; padding: 25px; margin-bottom: 25px; background: linear-gradient(to bottom, #fff, #fcfcfc);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
            We received a request to reset your password for your EduEden account. 
            Your security is our top priority! 
        </p>
        
        <!-- Action Button Section -->
        <div style=" border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <p style="margin-bottom: 20px; font-size: 16px; color: #444;">
                Click the button below to securely reset your password:
            </p>
            
            <a href="${resetLink}" style="background-color: #FF5722; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block; margin: 10px 0; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 87, 34, 0.2); transition: all 0.3s ease;">
                Reset Password 🔐
            </a>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                ⏰ For security, this link expires in 60 minutes
            </p>
        </div>
    </div>
    <div style="margin-top: 30px; padding: 20px; border-top: 2px dashed #eee; text-align: center; background-color: #fafafa; border-radius: 12px;">
        <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
            Need assistance? We're here to help! 
        </p>
        <a href="mailto:support@edueden.in" style="color: #ff5722; text-decoration: none; font-weight: 500; font-size: 16px;">
            support@blits.in
        </a>
    </div>

    <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888; margin: 0;">
            © ${new Date().getFullYear()} EduEden. All rights reserved. 
            <br>
            <span style="color: #FF5722;">✦</span> Empowering Education <span style="color: #FF5722;">✦</span>
        </p>
    </div>
</div>
   `;

	const subject = "🔑 Reset Your BLITZ Password";
	await sendEmail(email, subject, htmlContent);
};

module.exports = {
	sendOTPEmail,
	sendWelcomeMail,
	sendPasswordResetEmail,
};