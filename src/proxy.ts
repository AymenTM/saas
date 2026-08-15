import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['en', 'fr'] as const
const DEFAULT_LOCALE = 'fr'

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']
// Routes that require no locale prefix (like /subscription/[token])
const LOCALE_FREE_ROUTES = ['/subscription']

function getLocale(request: NextRequest): string {
  // 1. Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && LOCALES.includes(cookieLocale as (typeof LOCALES)[number])) {
    return cookieLocale
  }

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get('accept-language')
  if (acceptLang) {
    const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
    if (preferred && LOCALES.includes(preferred as (typeof LOCALES)[number])) {
      return preferred
    }
  }

  return DEFAULT_LOCALE
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Skip locale-free routes (e.g. /subscription/[token] — public QR page)
  if (LOCALE_FREE_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!pathnameHasLocale) {
    const locale = getLocale(request)
    const newUrl = request.nextUrl.clone()
    newUrl.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(newUrl)
  }

  // Extract locale from pathname for auth checks
  const locale = LOCALES.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  ) ?? DEFAULT_LOCALE

  // Strip locale prefix to check route
  const strippedPath = pathname.replace(`/${locale}`, '') || '/'

  // Public auth routes — allow without session
  if (PUBLIC_ROUTES.some((route) => strippedPath.startsWith(route))) {
    return NextResponse.next()
  }

  // Root redirect
  if (strippedPath === '/') {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  // For all other routes — auth is enforced client-side via AuthContext
  // (Firebase session tokens are client-side; server-side verification
  //  requires session cookies which are set separately)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
