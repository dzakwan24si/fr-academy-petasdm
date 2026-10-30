import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const TurnstileWidget = forwardRef(function TurnstileWidget(
    { siteKey, onVerify, onExpire, onError, theme = 'light', className = '' },
    ref
) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (widgetIdRef.current !== null && window.turnstile) {
                try {
                    window.turnstile.reset(widgetIdRef.current);
                } catch (e) {
                    console.warn('Failed to reset Turnstile widget:', e);
                }
            }
        },
    }));

    useEffect(() => {
        if (!siteKey) return;

        let isMounted = true;
        let pollTimer = null;

        const renderWidget = () => {
            if (!isMounted || !containerRef.current || !window.turnstile) return;
            if (widgetIdRef.current !== null) return;

            try {
                // Bersihkan konten kontainer jika ada sisa render sebelumnya
                containerRef.current.innerHTML = '';

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: theme,
                    callback: (token) => {
                        if (isMounted && onVerify) {
                            onVerify(token);
                        }
                    },
                    'expired-callback': () => {
                        if (isMounted && onExpire) {
                            onExpire();
                        }
                    },
                    'error-callback': (err) => {
                        console.warn('Turnstile error-callback:', err);
                        if (isMounted && onError) {
                            onError(err);
                        }
                    },
                });
            } catch (err) {
                console.error('Error rendering Cloudflare Turnstile:', err);
            }
        };

        if (typeof window !== 'undefined' && window.turnstile) {
            renderWidget();
        } else {
            // Pastikan tag script terpasang
            const scriptId = 'cf-turnstile-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            }

            // Polling setiap 50ms hingga window.turnstile siap
            let attempts = 0;
            pollTimer = setInterval(() => {
                attempts++;
                if (window.turnstile) {
                    clearInterval(pollTimer);
                    pollTimer = null;
                    renderWidget();
                } else if (attempts > 100) { // Timeout setelah 5 detik
                    clearInterval(pollTimer);
                    pollTimer = null;
                    console.warn('Cloudflare Turnstile script failed to initialize within 5 seconds.');
                }
            }, 50);
        }

        return () => {
            isMounted = false;
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
            if (widgetIdRef.current !== null && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch (e) {
                    // ignore
                }
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, theme]);

    return (
        <div className={`turnstile-wrapper ${className}`}>
            <div ref={containerRef} className="flex justify-center sm:justify-start min-h-[65px]" />
        </div>
    );
});

export default TurnstileWidget;
