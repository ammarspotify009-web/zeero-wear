import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use('/api/xpay/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zeerowear4@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD || '' // The user will need to provide this in .env
  }
});

// Store OTPs temporarily in memory for verification
const otps = new Map();

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency, customer, orderRef } = req.body;
  
  if (!amount || !currency || !customer) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    amount: amount,
    currency: currency,
    payment_method_types: "card",
    customer: customer,
    shipping: {
      address1: "N/A",
      city: "N/A",
      country: "PK",
      province: "N/A",
      zip: "00000"
    },
    metadata: {
      order_reference: orderRef || ""
    }
  };

  const hmacSecret = process.env.XPAY_API_SIGNATURE_SECRET;
  const secretKey = process.env.XPAY_SECRET_KEY;
  const accountId = process.env.XPAY_ACCOUNT_ID;
  const baseUrl = process.env.XPAY_BASE_URL || "https://xstak-pay-stg.xstak.com";

  if (!hmacSecret || !secretKey || !accountId) {
    return res.status(500).json({ error: 'Payment gateway configuration missing' });
  }

  const signature = crypto
    .createHmac("SHA256", hmacSecret)
    .update(JSON.stringify(payload))
    .digest("hex");

  try {
    const response = await fetch(`${baseUrl}/public/v1/payment/intent`, {
      method: 'POST',
      headers: {
        'x-api-key': secretKey,
        'Content-Type': 'application/json',
        'x-signature': signature,
        'x-account-id': accountId,
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error from XPay:", data);
      return res.status(response.status).json({ error: 'Failed to create payment intent', details: data });
    }

    res.json({
      encryptionKey: data.data?.encryptionKey,
      clientSecret: data.data?.pi_client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/xpay/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.XPAY_WEBHOOK_SIGNATURE_SECRET;
    const incomingSignature = req.headers['x-signature'];

    if (!incomingSignature) {
      return res.status(401).send('No signature provided');
    }

    // Verify signature
    const payloadBuffer = req.body; 
    if (!Buffer.isBuffer(payloadBuffer)) {
      return res.status(400).send('Webhook error: Raw body not found');
    }

    const calculatedSignature = crypto
      .createHmac('SHA256', webhookSecret)
      .update(payloadBuffer)
      .digest('hex');

    if (calculatedSignature !== incomingSignature) {
      console.error('Webhook signature mismatch');
      return res.status(401).send('Invalid signature');
    }

    // Parse the payload
    const event = JSON.parse(payloadBuffer.toString('utf8'));
    
    // Idempotency check & update status
    const eventType = event.event_type || event.type;
    const orderRef = event.data?.metadata?.order_reference;
    const paymentStatus = event.data?.status || event.status;

    if (orderRef) {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderRef)
        .single();

      if (fetchError) {
        console.error('Error fetching order for webhook:', fetchError);
      } else if (order) {
        // Idempotency check:
        if (order.status === 'Approved' || order.status === 'Cancelled') {
          console.log(`Order ${orderRef} is already ${order.status}. Skipping webhook event.`);
          return res.status(200).send('OK (already processed)');
        }

        let newStatus = 'Pending';
        if (eventType?.includes('succeed') || paymentStatus?.toLowerCase() === 'succeeded' || paymentStatus?.toLowerCase() === 'paid') {
          newStatus = 'Approved';
        } else if (eventType?.includes('failed') || paymentStatus?.toLowerCase() === 'failed' || paymentStatus?.toLowerCase() === 'declined') {
          newStatus = 'Cancelled';
        }

        if (newStatus !== 'Pending') {
          await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderRef);
          console.log(`Order ${orderRef} updated to ${newStatus} via XPay webhook.`);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// B2 image upload proxy (avoids CORS by doing upload server-side)
app.post('/api/upload', async (req, res) => {
  const { fileName, contentType, data } = req.body;
  if (!fileName || !data) {
    return res.status(400).json({ error: 'fileName and data are required' });
  }

  const s3Client = new S3Client({
    endpoint: process.env.VITE_B2_ENDPOINT,
    region: process.env.VITE_B2_REGION || 'us-west-005',
    credentials: {
      accessKeyId: process.env.VITE_B2_KEY_ID,
      secretAccessKey: process.env.VITE_B2_APP_KEY,
    },
    forcePathStyle: true,
  });

  try {
    const buffer = Buffer.from(data, 'base64');
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.VITE_B2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType || 'image/jpeg',
    }));
    const publicUrl = `https://images.zeerowear.com/file/${process.env.VITE_B2_BUCKET_NAME}/${fileName}`;
    
    // Cache warm-up: Cloudflare cache ko turant populate karne ke liye
    fetch(publicUrl).then(() => {
      console.log(`Cache warmed up: ${publicUrl}`);
    }).catch((err) => {
      console.error(`Cache warm-up failed for ${publicUrl}:`, err.message);
    });

    res.status(200).json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('B2 Upload Error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const mailOptions = {
    from: 'zeerowear4@gmail.com',
    to: 'zeerowear4@gmail.com',
    subject: `New Contact Form Submission from ${name}`,
    text: `
      Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Message:
      ${message}
    `
  };

  try {
    if (process.env.EMAIL_APP_PASSWORD) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log('Skipping email send. No EMAIL_APP_PASSWORD found in .env');
      console.log('Mail payload:', mailOptions);
    }
    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

app.post('/api/order', async (req, res) => {
  const { customerName, phone, email, address, paymentMethod, items, subtotal, deliveryFee, total, notes, orderText } = req.body;

  if (!customerName || !phone || !address || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required order fields.' });
  }

  const orderRef = `ZW-${Date.now().toString(36).toUpperCase()}`;

  const htmlBody = `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f5f0; padding: 24px; border-radius: 12px;">
      <div style="background: #2C3E6B; padding: 20px 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #F0A832; margin: 0; font-size: 22px; letter-spacing: 1px;">🛍️ New Order — Zeero Wear</h1>
        <p style="color: #E8EDF5; margin: 6px 0 0; font-size: 13px;">Order Ref: <strong>${orderRef}</strong></p>
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
    if (process.env.EMAIL_APP_PASSWORD) {
      // 1. Send Notification to Admin
      await transporter.sendMail({
        from: '"Zeero Wear" <zeerowear4@gmail.com>',
        to: 'zeerowear4@gmail.com',
        subject: `[ADMIN] 🛍️ New Order [${orderRef}] — ${customerName} — Rs. ${total?.toLocaleString()}`,
        text: orderText,
        html: htmlBody,
      });

      // Send Confirmation to Customer
      // (Customer email removed from checkout; now sent on admin approval)
    } else {
      console.log('⚠️  No EMAIL_APP_PASSWORD found — skipping email send.');
      console.log('Order details:\n', orderText);
    }
    res.status(200).json({ success: true, orderRef });
  } catch (error) {
    console.error('Error sending order email:', error);
    res.status(500).json({ error: 'Failed to send order confirmation.' });
  }
});

app.post('/api/admin/approve-order', async (req, res) => {
  const { order } = req.body;
  if (!order || !order.id || !order.customerEmail) {
    return res.status(400).json({ error: 'Invalid order data or missing customer email.' });
  }

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
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'zeerowear' && password === 'zeerowear@786') {
    res.status(200).json({ success: true, token: 'fake-jwt-token-123' });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

app.post('/api/admin/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (username !== 'zeerowear') {
    return res.status(404).json({ error: 'User not found' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(username, { otp, expires: Date.now() + 10 * 60 * 1000 }); // 10 minutes

  const mailOptions = {
    from: 'zeerowear4@gmail.com',
    to: 'zeerowear4@gmail.com', // Sending OTP to the admin's email
    subject: 'Admin Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
  };

  try {
    if (process.env.EMAIL_APP_PASSWORD) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log('Skipping email send. No EMAIL_APP_PASSWORD found in .env');
      console.log('OTP generated:', otp);
    }
    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

app.post('/api/admin/verify-otp', (req, res) => {
  const { username, otp } = req.body;
  const storedOtpData = otps.get(username);

  if (!storedOtpData) {
    return res.status(400).json({ error: 'No OTP requested.' });
  }

  if (Date.now() > storedOtpData.expires) {
    otps.delete(username);
    return res.status(400).json({ error: 'OTP expired.' });
  }

  if (storedOtpData.otp === otp) {
    otps.delete(username);
    res.status(200).json({ success: true, message: 'OTP verified. (Note: Password change not fully implemented yet for hardcoded creds).' });
  } else {
    res.status(400).json({ error: 'Invalid OTP.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
