// Legacy pages API route replaced by app router implementation.
// Keep this lightweight handler to avoid duplicate route errors while preserving history.
export default function handler(req, res) {
  res.status(410).json({ error: 'deprecated', message: 'Use /app/api/auth/register (app router) instead of this pages route' });
}
