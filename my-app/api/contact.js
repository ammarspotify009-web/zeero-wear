import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'zeerowear4@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px;">
      <div style="background: #222; padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px;">ZEERO WEAR</h1>
        <p style="color: #aaa; margin: 6px 0 0; font-size: 13px;">New Customer Message</p>
      </div>
      <div style="background: #fff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
        <h2 style="color: #333; font-size: 18px; margin-top: 0;">You have a new contact form submission</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px; width: 120px;">Name</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #222; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Email</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #222;">
              <a href="mailto:${email}" style="color: #c8a96e;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Phone</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #222;">${phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 14px 0 0; color: #888; font-size: 13px; vertical-align: top;">Message</td>
            <td style="padding: 14px 0 0; color: #222; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</td>
          </tr>
        </table>

        <div style="margin-top: 30px; padding: 16px; background: #f9f9f9; border-radius: 8px; text-align: center;">
          <a href="mailto:${email}" style="display: inline-block; padding: 12px 28px; background: #222; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">
            Reply to ${name}
          </a>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #bbb; text-align: center;">
          This message was sent via the contact form on zeerowear.com
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Zeero Wear Contact" <zeerowear4@gmail.com>`,
    to: 'zeerowear4@gmail.com',
    replyTo: email,
    subject: `New Message from ${name} — Zeero Wear`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
