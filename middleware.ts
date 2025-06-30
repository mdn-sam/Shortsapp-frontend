// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

// Set your username and password here
const USERNAME = process.env.BASIC_USER || 'mdn'
const PASSWORD = process.env.BASIC_PASS || 'sam'

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const base64 = authHeader.split(' ')[1]
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')

    if (user === USERNAME && pass === PASSWORD) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

export const config = {
  matcher: ['/', '/Projects/reel-viewer/app/page.tsx'], // protect homepage and `/reels`
}
