import jwt from 'jsonwebtoken';

const JWT_SECRET = import.meta.env.JWT_SECRET || 'your_default_secret_key'; // Use the same secret as in login.ts

export const verifyToken = (request: Request): { loggedIn: boolean; dbPath?: string } | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.split(' ')[1]; // Assuming 'Bearer TOKEN' format

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { loggedIn: boolean; dbPath?: string };
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

// You might want to define a type for your authenticated API context
// export type AuthenticatedAPIRoute = APIRoute & { locals: { user: { loggedIn: boolean; dbPath: string } } };