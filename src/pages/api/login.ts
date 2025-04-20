import type { APIRoute } from 'astro';

export const prerender = false; // Mark this route as server-rendered

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();
    const dbPath = formData.get('dbPath')?.toString();

    // --- Authentication Logic ---
    // Replace with your actual authentication mechanism
    // This example uses environment variables for simplicity
    const expectedUser = import.meta.env.ADMIN_USER || 'guest'
    const expectedPassword = import.meta.env.ADMIN_PASSWORD || 'guest';

    if (!expectedUser || !expectedPassword) {
      console.error("ADMIN_USER or ADMIN_PASSWORD environment variables not set.");
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error.' }), { status: 500 });
    }

    if (username === expectedUser && password === expectedPassword) {
      // --- Session Management ---
      // Authentication successful. Store necessary info (like dbPath) securely.
      // Using a simple cookie here for demonstration. Use a more robust session mechanism in production.
      cookies.set('session', JSON.stringify({ loggedIn: true, dbPath: dbPath || '/sqlite/data.db' }), {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 24,
      });

      // Return success response (or redirect directly)
      // Returning JSON allows the frontend to handle the redirect
       return new Response(JSON.stringify({ success: true, message: 'Login successful.' }), { status: 200 });
      // Alternatively, redirect server-side:
      // return redirect('/admin', 302);
    } else {
      // Authentication failed
      return new Response(JSON.stringify({ success: false, message: 'Invalid username or password.' }), { status: 401 });
    }
  } catch (error) {
    console.error("Login API error:", error);
    return new Response(JSON.stringify({ success: false, message: 'An unexpected error occurred.' }), { status: 500 });
  }
};

// Optional: Add a GET handler if needed, e.g., to check session status
// export const GET: APIRoute = ({ cookies }) => { ... };