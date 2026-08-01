import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Vercel: bodyParser is disabled for this route via vercel.json config
// so req.body will be a Buffer (raw body) — needed for HMAC verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.XPAY_WEBHOOK_SIGNATURE_SECRET;
    const incomingSignature = req.headers['x-signature'];

    if (!incomingSignature) {
      return res.status(401).send('No signature provided');
    }

    // Collect raw body chunks
    const rawBody = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    if (!rawBody || rawBody.length === 0) {
      return res.status(400).send('Webhook error: Empty body');
    }

    // Verify HMAC signature
    const calculatedSignature = crypto
      .createHmac('SHA256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (calculatedSignature !== incomingSignature) {
      console.error('Webhook signature mismatch');
      return res.status(401).send('Invalid signature');
    }

    // Parse the payload
    const event = JSON.parse(rawBody.toString('utf8'));

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const eventType = event.event_type || event.type;
    const orderRef = event.data?.metadata?.order_reference;
    const paymentStatus = event.data?.status || event.status;

    console.log(`XPay Webhook received: event=${eventType}, orderRef=${orderRef}, status=${paymentStatus}`);

    if (orderRef) {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderRef)
        .single();

      if (fetchError) {
        console.error('Error fetching order for webhook:', fetchError);
      } else if (order) {
        // Idempotency check
        if (order.status === 'Approved' || order.status === 'Cancelled') {
          console.log(`Order ${orderRef} already ${order.status}. Skipping.`);
          return res.status(200).send('OK (already processed)');
        }

        let newStatus = null;
        if (eventType?.includes('succeed') || paymentStatus?.toLowerCase() === 'succeeded' || paymentStatus?.toLowerCase() === 'paid') {
          newStatus = 'Approved';
        } else if (eventType?.includes('fail') || paymentStatus?.toLowerCase() === 'failed' || paymentStatus?.toLowerCase() === 'declined') {
          newStatus = 'Cancelled';
        }

        if (newStatus) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: newStatus,
              payment_status: newStatus === 'Approved' ? 'paid' : 'failed'
            })
            .eq('id', orderRef);

          if (updateError) {
            console.error('Supabase update error:', updateError);
          } else {
            console.log(`Order ${orderRef} updated to ${newStatus} via XPay webhook.`);
          }
        } else {
          console.log(`Unhandled event type: ${eventType}, status: ${paymentStatus} — no Supabase update.`);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook handler failed');
  }
}
