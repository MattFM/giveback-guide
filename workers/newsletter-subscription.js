/**
 * Beehiiv Newsletter Subscription Worker
 * 
 * This Worker handles newsletter subscriptions via the Beehiiv API V2.
 * Copy this code into your Cloudflare Worker in the admin panel.
 * 
 * Environment Variables to set in Cloudflare:
 * - BEEHIIV_API_KEY: Your Beehiiv API key
 * - BEEHIIV_PUBLICATION_ID: Your Beehiiv publication ID
 * - CORS_ORIGIN: Allowed origin for CORS (e.g., https://giveback.guide)
 */

const BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2';

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

// Create subscriber in Beehiiv
async function createSubscriber(email, metadata = {}, apiKey, publicationId) {
  const url = `${BEEHIIV_API_BASE}/publications/${publicationId}/subscriptions`;
  
  const body = {
    email,
    reactivate_existing: false,
    send_welcome_email: true,
    utm_source: metadata.source || 'website',
    utm_medium: metadata.medium || 'organic',
    utm_campaign: metadata.campaign || 'general',
  };

  // Add optional fields if provided
  if (metadata.firstName) body.first_name = metadata.firstName;
  if (metadata.lastName) body.last_name = metadata.lastName;

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
    // Handle specific Beehiiv error cases
    if (response.status === 409) {
      throw new Error('Already subscribed');
    }
    if (response.status === 422) {
      throw new Error(data.message || 'Invalid email address');
    }
    throw new Error(data.message || 'Failed to create subscription');
  }

  return data;
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const origin = env.CORS_ORIGIN || request.headers.get('Origin') || '*';

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405, origin);
    }

    // Verify environment variables are set
    const apiKey = env.BEEHIIV_API_KEY;
    const publicationId = env.BEEHIIV_PUBLICATION_ID;

    if (!apiKey || !publicationId) {
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

        // Create subscriber in Beehiiv
        const subscriber = await createSubscriber(email, metadata, apiKey, publicationId);

        return successResponse({
          message: 'Successfully subscribed',
          subscriberId: subscriber.id,
        }, origin);

      } else if (action === 'unsubscribe') {
        // Note: Beehiiv handles unsubscribes via email links
        // This endpoint could be used for authenticated user management if needed
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
