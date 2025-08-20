// Paste this whole file exactly
const fetch = require('node-fetch');

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.APPWRITE_PROJECT;
const ML_API_KEY = process.env.MAILERLITE_API_KEY;

const ML_BASE = 'https://api.mailerlite.com/api/v2';

async function verifyJwtAndGetUser(jwt) {
  const resp = await fetch(`${APPWRITE_ENDPOINT}/v1/account`, {
    headers: {
      'X-Appwrite-JWT': jwt,
      'X-Appwrite-Project': APPWRITE_PROJECT,
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Invalid Appwrite JWT (${resp.status}) ${txt}`);
  }
  return resp.json();
}

async function subscribeEmail(email) {
  const resp = await fetch(`${ML_BASE}/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MailerLite-ApiKey': ML_API_KEY,
    },
    body: JSON.stringify({ email }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Mailerlite subscribe failed (${resp.status}): ${txt}`);
  }
  return resp.json();
}

async function findSubscriberByEmail(email) {
  const resp = await fetch(`${ML_BASE}/subscribers/${encodeURIComponent(email)}`, {
    headers: { 'X-MailerLite-ApiKey': ML_API_KEY },
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function unsubscribeById(id) {
  const resp = await fetch(`${ML_BASE}/subscribers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-MailerLite-ApiKey': ML_API_KEY },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Mailerlite unsubscribe failed (${resp.status}): ${txt}`);
  }
  return true;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { action, jwt } = req.body || {};
    if (!action || !jwt) return res.status(400).json({ error: 'Missing action or jwt' });

    const user = await verifyJwtAndGetUser(jwt);
    const email = user?.email;
    if (!email) return res.status(400).json({ error: 'User has no email' });

    if (action === 'subscribe') {
      const mlResp = await subscribeEmail(email);
      return res.json({ ok: true, mailerlite: mlResp });
    } else if (action === 'unsubscribe') {
      const sub = await findSubscriberByEmail(email);
      if (sub && sub.id) {
        await unsubscribeById(sub.id);
        return res.json({ ok: true });
      } else {
        return res.json({ ok: true, note: 'subscriber not found' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};