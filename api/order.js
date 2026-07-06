import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, phone, email, address, paymentMethod, items, subtotal, deliveryFee, total, notes, orderText, orderRef } = req.body;

  if (!customerName || !phone || !address || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required order fields.' });
  }

  const finalOrderRef = orderRef || `ZW-${Date.now().toString(36).toUpperCase()}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'zeerowear4@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  const adminHtmlBody = `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f5f0; padding: 24px; border-radius: 12px;">
      <div style="background: #2C3E6B; padding: 20px 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #F0A832; margin: 0; font-size: 22px; letter-spacing: 1px;">🛍️ New Order — Zeero Wear</h1>
        <p style="color: #E8EDF5; margin: 6px 0 0; font-size: 13px;">Order Ref: <strong>${finalOrderRef}</strong></p>
      </div>
      <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px;">
        <h3 style="color: #2C3E6B; border-bottom: 2px solid #E8EDF5; padding-bottom: 8px;">Customer Details</h3>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Payment:</strong> ${paymentMethod}</p>

        <h3 style="color: #2C3E6B; border-bottom: 2px solid #E8EDF5; padding-bottom: 8px; margin-top: 20px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #E8EDF5;">
              <th style="padding: 8px; text-align: left; font-size: 12px;">Item</th>
              <th style="padding: 8px; text-align: center; font-size: 12px;">Size</th>
              <th style="padding: 8px; text-align: center; font-size: 12px;">Qty</th>
              <th style="padding: 8px; text-align: right; font-size: 12px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 8px; font-size: 13px;">${item.name}</td>
                <td style="padding: 8px; text-align: center; font-size: 13px;">${item.size}</td>
                <td style="padding: 8px; text-align: center; font-size: 13px;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; font-size: 13px;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 16px; text-align: right;">
          <p style="margin: 4px 0; font-size: 13px;">Subtotal: <strong>Rs. ${subtotal?.toLocaleString()}</strong></p>
          <p style="margin: 4px 0; font-size: 13px;">Delivery: <strong>${deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee?.toLocaleString()}`}</strong></p>
          <p style="margin: 8px 0; font-size: 16px; color: #2C3E6B;">Total: <strong>Rs. ${total?.toLocaleString()}</strong></p>
        </div>

        ${notes ? `<div style="margin-top: 16px; background: #f8f5f0; padding: 12px; border-radius: 8px;"><strong>Customer Note:</strong><br/>${notes}</div>` : ''}
      </div>
    </div>
  `;

  try {
    if (!process.env.EMAIL_APP_PASSWORD) {
      console.log('No EMAIL_APP_PASSWORD found, skipping emails');
      return res.status(200).json({ success: true, orderRef: finalOrderRef, warning: 'No email password' });
    }

    // 1. Send Notification to Admin
    await transporter.sendMail({
      from: '"Zeero Wear" <zeerowear4@gmail.com>',
      to: 'zeerowear4@gmail.com',
      subject: `[ADMIN] 🛍️ New Order [${finalOrderRef}] — ${customerName} — Rs. ${total?.toLocaleString()}`,
      text: orderText || 'New Order Received.',
      html: adminHtmlBody,
    });

    // 2. Send Confirmation to Customer
    if (email && email.trim() !== '') {
      const customerHtmlBody = `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f5f0; padding: 24px; border-radius: 12px;">
          <div style="background: #2C3E6B; padding: 20px 24px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #F0A832; margin: 0; font-size: 22px; letter-spacing: 1px;">🎉 Order Placed Successfully!</h1>
            <p style="color: #E8EDF5; margin: 6px 0 0; font-size: 13px;">Order Ref: <strong>${finalOrderRef}</strong></p>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2C3E6B;">Thank you for your order, ${customerName}!</h2>
            <p>We have received your order and are getting it ready. You will receive another email once your order is confirmed and processed for delivery.</p>
            
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
                ${items.map(item => `
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 8px; font-size: 13px;">${item.name} <br/><small>Size: ${item.size}</small></td>
                    <td style="padding: 8px; text-align: center; font-size: 13px;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; font-size: 13px;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 16px; text-align: right;">
              <p style="margin: 4px 0; font-size: 13px;">Subtotal: <strong>Rs. ${subtotal?.toLocaleString()}</strong></p>
              <p style="margin: 4px 0; font-size: 13px;">Delivery: <strong>${deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee?.toLocaleString()}`}</strong></p>
              <p style="margin: 8px 0; font-size: 16px; color: #2C3E6B;">Total: <strong>Rs. ${total?.toLocaleString()}</strong></p>
            </div>
            
            <p style="margin-top: 20px; font-size: 13px; color: #666;">We will contact you at <strong>${phone}</strong> for delivery to <strong>${address}</strong>.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"Zeero Wear" <zeerowear4@gmail.com>',
        to: email,
        subject: `Order Received [${finalOrderRef}] — Zeero Wear`,
        html: customerHtmlBody,
      });
    }

    res.status(200).json({ success: true, orderRef: finalOrderRef });
  } catch (error) {
    console.error('Error sending order email:', error);
    res.status(500).json({ error: 'Failed to send order confirmation.' });
  }
}
