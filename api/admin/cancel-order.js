import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: 'Invalid order data.' });
  }
  // If no email provided, nothing to send — return success silently
  if (!order.customerEmail || order.customerEmail.trim() === '') {
    return res.status(200).json({ success: true, skipped: 'No customer email provided.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'zeerowear4@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  const htmlBody = `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f5f0; padding: 24px; border-radius: 12px;">
      <div style="background: #2C3E6B; padding: 20px 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #F0A832; margin: 0; font-size: 22px; letter-spacing: 1px;">❌ Order Cancelled</h1>
        <p style="color: #E8EDF5; margin: 6px 0 0; font-size: 13px;">Order Ref: <strong>${order.id}</strong></p>
      </div>
      <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2C3E6B;">Hi, ${order.customerName}</h2>
        <p>We are sorry to inform you that your order <strong>${order.id}</strong> has been cancelled.</p>
        <p>If you believe this was a mistake, or if you have any questions, please reply to this email or contact our support team.</p>
        
        <p style="margin-top: 20px; font-size: 13px; color: #666;">We hope to serve you again in the future!</p>
      </div>
    </div>
  `;

  try {
    if (process.env.EMAIL_APP_PASSWORD) {
      await transporter.sendMail({
        from: '"Zeero Wear" <zeerowear4@gmail.com>',
        to: order.customerEmail,
        subject: `Your Order [${order.id}] has been Cancelled — Zeero Wear`,
        html: htmlBody,
      });
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'No EMAIL_APP_PASSWORD found.' });
    }
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    res.status(500).json({ error: 'Failed to send cancellation email.' });
  }
}
