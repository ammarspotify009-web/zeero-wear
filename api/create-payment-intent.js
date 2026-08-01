import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
