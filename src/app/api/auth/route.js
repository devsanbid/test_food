import { NextResponse } from 'next/server';
import { registerUser, loginUser, forgotPassword, resetPassword, verifyToken } from '@/controllers/authController';
import { authenticate, createAuthResponse, clearAuthCookie } from '@/middleware/auth';

export async function POST(request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'register':
        const registerResult = await registerUser(data);
        return createAuthResponse(registerResult, registerResult.token);

      case 'login':
        const loginResult = await loginUser(data);
        return createAuthResponse(loginResult, loginResult.token);

      case 'forgot-password':
        const forgotResult = await forgotPassword(data.email);
        return NextResponse.json(forgotResult);

      case 'reset-password':
        const resetResult = await resetPassword(data.resetToken, data.newPassword);
        return createAuthResponse(resetResult, resetResult.token);

      case 'verify-token':
        const verifyResult = await verifyToken(data.token);
        return NextResponse.json(verifyResult);

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 }
    );
  }
}

export async function DELETE(request) {
  try {
    return clearAuthCookie();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}