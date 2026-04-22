import { useLocation } from 'react-router-dom';
import { sessionStore } from '@/components/supabase/client';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    // Read auth state directly from sessionStore (works outside providers too)
    const isAuthenticated = !!sessionStore?.isAuthenticated;
    const isAdmin = isAuthenticated && (
        sessionStore?.user?.is_admin === true ||
        (typeof sessionStore?.isAdmin === 'function' ? sessionStore.isAdmin() : false)
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0B0F0D]">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-[#223029]">404</h1>
                        <div className="h-0.5 w-16 bg-[#223029] mx-auto"></div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-[#F4F7F5]">
                            Sidan hittades inte
                        </h2>
                        <p className="text-[#B6C2BC] leading-relaxed">
                            Sidan <span className="font-medium text-[#F4F7F5]">"{pageName}"</span> finns inte i den här appen.
                        </p>
                    </div>

                    {/* Admin Note */}
                    {isAdmin && (
                        <div className="mt-8 p-4 bg-[#121715] rounded-lg border border-[#223029]">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F4743B]/20 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-[#F4743B]"></div>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-medium text-[#F4F7F5]">Admin-notis</p>
                                    <p className="text-sm text-[#B6C2BC] leading-relaxed">
                                        Sidan är inte registrerad i <code>pages.config.js</code>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#F4F7F5] bg-[#121715] border border-[#223029] rounded-lg hover:bg-[#18221E] hover:border-[#2BA84A]/30 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Till startsidan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}