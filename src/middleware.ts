import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/api(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const authObj = await auth();

  if (
    authObj.userId
    && !authObj.orgId
    && req.nextUrl.pathname.includes('/dashboard')
    && !req.nextUrl.pathname.endsWith('/organization-selection')
  ) {
    const orgSelection = new URL(
      '/onboarding/organization-selection',
      req.url,
    );

    return NextResponse.redirect(orgSelection);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'], // Also exclude tunnelRoute used in Sentry from the matcher
};
