import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const requestHeaders = new Headers(request.headers)

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (request.nextUrl.pathname.startsWith('/anime') && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (request.nextUrl.pathname === '/' && token) {
    return NextResponse.redirect(new URL('/anime', request.url))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/', '/anime/:path*', '/api/:path*'],
}
