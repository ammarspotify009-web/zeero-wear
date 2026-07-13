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
        <h1 style="color: #F0A832; margin: 0; font-size: 22px; letter-spacing: 1px;">✅ Order Confirmed!</h1>
        <p style="color: #E8EDF5; margin: 6px 0 0; font-size: 13px;">Order Ref: <strong>${order.id}</strong></p>
      </div>
      <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2C3E6B;">Great news, ${order.customerName}!</h2>
        <p>Your order has been officially confirmed by our team and is now being processed for delivery. Here are your final details:</p>
        
        <h3 style="color: #2C3E6B; border-bottom: 2px solid #E8EDF5; padding-bottom: 8px; margin-top: 20px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #E8EDF5;">
              <th style="padding: 8px; text-align: left; font-size: 12px;">Item</th>
              <th style="padding: 8px; text-align: center; font-size: 12px;">Qty</th>
              <th style="padding: 8px; text-align: right; font-size: 12px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 8px; font-size: 13px;">${item.name} <br/><small>Size: ${item.size}</small></td>
                <td style="padding: 8px; text-align: center; font-size: 13px;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; font-size: 13px;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 16px; text-align: right;">
          <p style="margin: 4px 0; font-size: 13px;">Subtotal: <strong>Rs. ${order.subtotal?.toLocaleString()}</strong></p>
          <p style="margin: 4px 0; font-size: 13px;">Delivery: <strong>${order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee?.toLocaleString()}`}</strong></p>
          <p style="margin: 8px 0; font-size: 16px; color: #2C3E6B;">Total: <strong>Rs. ${order.totalAmount?.toLocaleString()}</strong></p>
        </div>
        
        <p style="margin-top: 20px; font-size: 13px; color: #666;">We will contact you at <strong>${order.customerPhone}</strong> when your order is out for delivery to <strong>${order.customerAddress}</strong>.</p>
      </div>
    </div>
  `;

  try {
    if (process.env.EMAIL_APP_PASSWORD) {
      await transporter.sendMail({
        from: '"Zeero Wear" <zeerowear4@gmail.com>',
        to: order.customerEmail,
        subject: `Your Order [${order.id}] has been Confirmed! — Zeero Wear`,
        html: htmlBody,
      });
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'No EMAIL_APP_PASSWORD found.' });
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ error: 'Failed to send confirmation email.' });
  }
}
