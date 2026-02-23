import { NextRequest, NextResponse } from 'next/server'

const ACCESS_PASSWORD = 'TuJestMeso2026'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow gate page, API routes, and static assets
  if (
    pathname === '/gate' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  // Check for access cookie
  const accessCookie = request.cookies.get('meso_access')
  if (accessCookie?.value === ACCESS_PASSWORD) {
    return NextResponse.next()
  }

  // Redirect to gate
  const gateUrl = new URL('/gate', request.url)
  return NextResponse.redirect(gateUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
