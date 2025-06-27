import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

const publicRoutes = ['/', '/login', '/signup', '/forgetpassword'];
const adminRoutes = ['/admin'];
const userRoutes = ['/user'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
  }

  if (publicRoutes.includes(pathname)) {
    if (user && (pathname === '/login' || pathname === '/signup')) {
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (user.role === 'user') {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/admin')) {
    if (user.role !== 'admin') {
      if (user.role === 'user') {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
      }
    }
  }

  if (pathname.startsWith('/user')) {
    if (user.role !== 'user') {
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
      }
    }
  }

  if (pathname.startsWith('/restaurant')) {
    if (user.role !== 'restaurant') {
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};