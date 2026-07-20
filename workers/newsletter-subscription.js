/**
 * Email Octopus Newsletter Subscription Worker
 *
 * This Worker handles newsletter subscriptions via the Email Octopus API v2.
 * Copy this code into your Cloudflare Worker in the admin panel.
 *
 * Environment Variables to set in Cloudflare:
 * - EMAILOCTOPUS_API_KEY: Your Email Octopus API key
 * - EMAILOCTOPUS_LIST_ID: Your Email Octopus list ID
 * - CORS_ORIGIN: Allowed origin for CORS (e.g., https://giveback.guide)
 * - ALLOW_LOCALHOST: Set to 'true' to allow requests from localhost:4321 (for testing)
 */

const EMAILOCTOPUS_API_BASE = 'https://api.emailoctopus.com';

// CORS headers helper
const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
});

// Success response
const successResponse = (data, origin) => new Response(
  JSON.stringify({ success: true, ...data }),
  {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  }
);

// Error response
const errorResponse = (message, status = 400, origin) => new Response(
  JSON.stringify({ success: false, error: message }),
  {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  }
);

// Create subscriber in Email Octopus
async function createSubscriber(email, metadata = {}, apiKey, listId) {
  const url = `${EMAILOCTOPUS_API_BASE}/lists/${listId}/contacts`;

  const body = {
    email_address: email,
  };

  // Add source as a tag for tracking
  const sourceTag = metadata.source || 'website';
  body.tags = [`source:${sourceTag}`];

  // Add optional name field if provided
  if (metadata.firstName) {
    body.fields = {
      FirstName: metadata.firstName,
    };
  }

  // Force subscribed status for onboarding (user already verified via Supabase magic link)
  if (sourceTag === 'onboarding') {
    body.status = 'subscribed';
  }
  // Otherwise, omit status so Email Octopus respects the list's double opt-in setting

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle specific Email Octopus error cases
    if (response.status === 409) {
      throw new Error('Already subscribed');
    }
    if (response.status === 422) {
      throw new Error(data.error?.message || 'Invalid email address');
    }
    throw new Error(data.error?.message || 'Failed to create subscription');
  }

  return data;
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    // Determine allowed origins based on environment
    const allowedOrigins = [env.CORS_ORIGIN || 'https://giveback.guide'];

    // Allow localhost for testing if ALLOW_LOCALHOST is set to 'true'
    if (env.ALLOW_LOCALHOST === 'true') {
      allowedOrigins.push('http://localhost:4321', 'http://127.0.0.1:4321');
    }

    const requestOrigin = request.headers.get('Origin');
    // Use request origin if it's in allowed list, otherwise use first allowed origin
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405, origin);
    }

    // Verify environment variables are set
    const apiKey = env.EMAILOCTOPUS_API_KEY;
    const listId = env.EMAILOCTOPUS_LIST_ID;

    if (!apiKey || !listId) {
      console.error('Missing environment variables');
      return errorResponse('Server configuration error', 500, origin);
    }

    try {
      // Parse request body
      const body = await request.json();
      const { email, name, source, action = 'subscribe' } = body;

      // Validate email
      if (!email || typeof email !== 'string') {
        return errorResponse('Email address is required', 400, origin);
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse('Invalid email address format', 400, origin);
      }

      // Handle different actions
      if (action === 'subscribe') {
        const metadata = {
          source: source || 'footer',
          firstName: name,
        };

        // Create subscriber in Email Octopus
        const subscriber = await createSubscriber(email, metadata, apiKey, listId);

        return successResponse({
          message: 'Successfully subscribed',
          subscriberId: subscriber.id,
        }, origin);

      } else if (action === 'unsubscribe') {
        // Note: Email Octopus handles unsubscribes via email preference center
        return successResponse({
          message: 'Unsubscribe via email preference center',
        }, origin);

      } else {
        return errorResponse('Invalid action', 400, origin);
      }

    } catch (error) {
      console.error('Subscription error:', error);

      // Handle known error cases
      if (error.message === 'Already subscribed') {
        return successResponse({
          message: 'You are already subscribed to The Problem with Travel',
          alreadySubscribed: true,
        }, origin);
      }

      return errorResponse(
        error.message || 'An error occurred while processing your subscription',
        500,
        origin
      );
    }
  },
};
