import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  // With JWTs, logout is primarily client-side (discarding the token).
  // This endpoint can simply confirm the logout request was received.
  return new Response(JSON.stringify({
    success: true,
    message: 'Logout successful.',
  }), { status: 200 });
};