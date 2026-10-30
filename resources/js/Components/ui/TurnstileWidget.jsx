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

        const renderWidget = () => {
            if (!isMounted || !containerRef.current || !window.turnstile) return;

            // Jika sudah ter-render, jangan render ulang
            if (widgetIdRef.current !== null) {
                return;
            }

            try {
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
                    'error-callback': () => {
                        if (isMounted && onError) {
                            onError();
                        }
                    },
                });
            } catch (err) {
                console.error('Error rendering Cloudflare Turnstile:', err);
            }
        };

        if (window.turnstile) {
            renderWidget();
        } else {
            const scriptId = 'cf-turnstile-script';
            let script = document.getElementById(scriptId);

            if (!script) {
                script = document.createElement('script');
                script.id = scriptId;
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            }

            const handleLoad = () => {
                renderWidget();
            };

            script.addEventListener('load', handleLoad);

            return () => {
                isMounted = false;
                script.removeEventListener('load', handleLoad);
                if (widgetIdRef.current !== null && window.turnstile) {
                    try {
                        window.turnstile.remove(widgetIdRef.current);
                    } catch (e) {
                        // ignore
                    }
                    widgetIdRef.current = null;
                }
            };
        }

        return () => {
            isMounted = false;
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
