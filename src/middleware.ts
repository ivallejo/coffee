import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    const { pathname } = request.nextUrl;

    // Public routes
    const publicRoutes = ['/login', '/'];

    // 1. Protected routes check
    if (!session && !publicRoutes.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(url);
    }

    // 2. Auth page redirect check (if already logged in)
    if (session && pathname === '/login') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        const url = request.nextUrl.clone();
        if (profile?.role === 'admin') {
            url.pathname = '/admin';
        } else {
            url.pathname = '/pos';
        }
        return NextResponse.redirect(url);
    }

    // 3. Role-based access control
    if (session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_active')
            .eq('id', session.user.id)
            .single();

        const userRole = profile?.role;
        const isActive = profile?.is_active;

        if (isActive === false) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('error', 'account_disabled');
            await supabase.auth.signOut();
            return NextResponse.redirect(url);
        }

        const adminRoutes = ['/admin', '/products', '/inventory', '/sales', '/users', '/loyalty'];
        const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

        if (userRole === 'cashier' && isAdminRoute) {
            const url = request.nextUrl.clone();
            url.pathname = '/pos';
            return NextResponse.redirect(url);
        }

        if (userRole === 'admin' && pathname === '/') {
            const url = request.nextUrl.clone();
            url.pathname = '/admin';
            return NextResponse.redirect(url);
        }

        if (userRole === 'cashier' && pathname === '/') {
            const url = request.nextUrl.clone();
            url.pathname = '/pos';
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
