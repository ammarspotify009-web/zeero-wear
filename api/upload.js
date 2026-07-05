import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Increase body size limit to 10MB for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // Allow CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName, contentType, data } = req.body;

  if (!fileName || !data) {
    return res.status(400).json({ error: 'fileName and data are required' });
  }

  const B2_KEY_ID = process.env.VITE_B2_KEY_ID;
  const B2_APP_KEY = process.env.VITE_B2_APP_KEY;
  const B2_BUCKET_NAME = process.env.VITE_B2_BUCKET_NAME;
  const B2_REGION = process.env.VITE_B2_REGION;
  const B2_ENDPOINT = process.env.VITE_B2_ENDPOINT;

  if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME || !B2_ENDPOINT) {
    return res.status(500).json({ error: 'B2 credentials not configured in environment variables.' });
  }

  try {
    const s3Client = new S3Client({
      endpoint: B2_ENDPOINT,
      region: B2_REGION || 'us-west-005',
      credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
      },
      forcePathStyle: true,
    });

    // Decode base64 data sent from the browser
    const buffer = Buffer.from(data, 'base64');

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType || 'image/jpeg',
    });

    await s3Client.send(command);

    // Use Cloudflare CDN domain instead of direct Backblaze URL
    const CLOUDFLARE_DOMAIN = process.env.VITE_CDN_DOMAIN || 'images.zeerowear.com';
    const publicUrl = `https://${CLOUDFLARE_DOMAIN}/file/${B2_BUCKET_NAME}/${fileName}`;

    res.status(200).json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('B2 Upload Error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
