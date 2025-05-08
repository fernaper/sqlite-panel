import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete('sqlite-panel-session', {
    path: '/',
  });

  return redirect('/login', 302);
};