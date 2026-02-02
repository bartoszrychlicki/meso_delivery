import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/menu'

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to error page or login with error
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_error', requestUrl.origin)
      )
    }

    // Handle different callback types
    if (type === 'recovery') {
      // Password recovery - redirect to reset password page
      return NextResponse.redirect(
        new URL('/reset-password', requestUrl.origin)
      )
    }

    if (type === 'signup' || type === 'email_change') {
      // Email verification for signup or email change
      const user = data.user

      if (user && !user.is_anonymous) {
        // User confirmed email - this converts anonymous to permanent
        // The trigger should handle the customer table update

        // Call the conversion function to add bonus points
        // This is a backup in case the user was anonymous before
        try {
          await supabase.rpc('convert_anonymous_to_permanent', {
            p_user_id: user.id,
            p_email: user.email,
          })
        } catch (e) {
          // Function might not exist yet or user was already permanent
          console.log('Conversion RPC call (might be expected to fail):', e)
        }

        return NextResponse.redirect(
          new URL('/menu?welcome=true', requestUrl.origin)
        )
      }
    }

    // Default: redirect to the next page or menu
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code provided - redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
