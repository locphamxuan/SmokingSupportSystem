const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { sql } = require('../db');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject('Failed to create access token: ' + err);
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      accessToken,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  return transporter;
};

const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Mã OTP để Xác Minh Tài Khoản',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>Xác Minh Tài Khoản</h2>
        <p>Cảm ơn bạn đã đăng ký. Vui lòng sử dụng mã OTP sau để xác minh tài khoản của bạn:</p>
        <h1 style="margin: 20px; font-size: 3em; letter-spacing: 5px; color: #4CAF50;">${otp}</h1>
        <p>Mã OTP này có hiệu lực trong 10 phút.</p>
        <hr/>
        <p style="font-size: 0.9em; color: #777;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };

  try {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending OTP email to ${to}:`, error);
    throw new Error('Failed to send OTP email');
  }
};

// Enhanced notification email service with Vietnamese content
const sendNotificationEmail = async (to, subject, message, type = 'general') => {
  const getVietnameseEmailTemplate = (subject, message, type) => {
    let headerColor = '#4CAF50';
    let icon = '📢';
    let greeting = 'Xin chào!';
    
    switch (type) {
      case 'achievement':
        headerColor = '#FF9800';
        icon = '🏆';
        greeting = 'Chúc mừng bạn!';
        break;
      case 'daily':
        headerColor = '#2196F3';
        icon = '🌅';
        greeting = 'Chào buổi sáng!';
        break;
      case 'weekly':
        headerColor = '#9C27B0';
        icon = '📅';
        greeting = 'Báo cáo tuần của bạn!';
        break;
      case 'motivation':
        headerColor = '#F44336';
        icon = '💪';
        greeting = 'Đừng bỏ cuộc!';
        break;
      case 'money_milestone':
        headerColor = '#4CAF50';
        icon = '💰';
        greeting = 'Tuyệt vời!';
        break;
    }

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid ${headerColor};">
            <h1 style="color: ${headerColor}; margin: 0; font-size: 28px; font-weight: bold;">
              ${icon} SmokingSupport
            </h1>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Hệ thống hỗ trợ cai thuốc lá</p>
          </div>
          
          <!-- Greeting -->
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: ${headerColor}; margin: 0; font-size: 22px;">${greeting}</h2>
          </div>
          
          <!-- Main Content -->
          <div style="background: linear-gradient(135deg, ${headerColor}15, ${headerColor}05); border-left: 4px solid ${headerColor}; padding: 25px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">${subject}</h3>
            <div style="color: #555; font-size: 16px; line-height: 1.8;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <!-- Call to Action -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" 
               style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd); color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 10px ${headerColor}40;">
              🚀 Mở ứng dụng SmokingSupport
            </a>
          </div>
          
          <!-- Encouragement -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="color: #666; margin: 0; font-style: italic; font-size: 15px;">
              💙 "Mỗi ngày không thuốc là một chiến thắng. Bạn đang làm rất tốt!"
            </p>
          </div>
          
          <!-- Footer -->
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 5px 0;">📧 Email này được gửi tự động từ hệ thống SmokingSupport</p>
            <p style="margin: 5px 0;">🏥 Hỗ trợ cai thuốc lá an toàn và hiệu quả</p>
            <p style="margin: 5px 0;">© 2025 SmokingSupport - Vì một Việt Nam không khói thuốc</p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #aaa;">
              Nếu bạn không muốn nhận email này, vui lòng liên hệ hỗ trợ.
            </p>
          </div>
        </div>
      </div>
    `;
  };

  const mailOptions = {
    from: `"SmokingSupport" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🏥 SmokingSupport - ${subject}`,
    html: getVietnameseEmailTemplate(subject, message, type)
  };

  try {
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email thông báo đã gửi đến ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Lỗi gửi email đến ${to}:`, error);
    throw error;
  }
};

// Send unified notification (both in-app and email)
const sendUnifiedNotification = async (userId, message, type = 'general', emailSubject = null) => {
  try {
    // Get user email and info
    const userResult = await sql.query`
      SELECT Email, Username FROM Users WHERE Id = ${userId}
    `;
    
    if (userResult.recordset.length === 0) {
      throw new Error(`Không tìm thấy người dùng với ID ${userId}`);
    }
    
    const user = userResult.recordset[0];
    
    // Send in-app notification
    const { createNotification } = require('../controllers/notificationController');
    await createNotification(userId, message, type);
    
    // Send email notification with Vietnamese subject
    const subject = emailSubject || getVietnameseSubject(type);
    await sendNotificationEmail(user.Email, subject, message, type);
    
    console.log(`✅ Thông báo đã gửi đến người dùng ${userId} (${user.Username}): ${message}`);
    
    return { success: true, message: 'Đã gửi thông báo qua app và email' };
  } catch (error) {
    console.error('❌ Lỗi gửi thông báo:', error);
    throw error;
  }
};

// Send to multiple users
const sendBulkUnifiedNotification = async (userIds, message, type = 'general', emailSubject = null) => {
  const results = [];
  
  for (const userId of userIds) {
    try {
      await sendUnifiedNotification(userId, message, type, emailSubject);
      results.push({ userId, success: true });
    } catch (error) {
      console.error(`❌ Không thể gửi thông báo đến người dùng ${userId}:`, error);
      results.push({ userId, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`📊 Đã gửi thông báo đến ${successCount}/${userIds.length} người dùng`);
  
  return results;
};

// Get Vietnamese email subject based on notification type
const getVietnameseSubject = (type) => {
  switch (type) {
    case 'achievement':
      return 'Chúc mừng thành tích mới của bạn!';
    case 'daily':
      return 'Thông báo động viên hàng ngày';
    case 'weekly':
      return 'Báo cáo tiến độ tuần';
    case 'motivation':
      return 'Tin nhắn động viên';
    case 'money_milestone':
      return 'Chúc mừng mốc tiết kiệm mới!';
    default:
      return 'Thông báo từ SmokingSupport';
  }
};

module.exports = { 
  sendOTPEmail, 
  sendNotificationEmail,
  sendUnifiedNotification,
  sendBulkUnifiedNotification 
};