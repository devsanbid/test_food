import { clearAuthCookie } from '@/middleware/auth';

export async function POST(request) {
  try {
    return clearAuthCookie();
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}