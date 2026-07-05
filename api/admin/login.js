export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    res.status(200).json({ success: true, token: 'fake-jwt-token-123' });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
}
