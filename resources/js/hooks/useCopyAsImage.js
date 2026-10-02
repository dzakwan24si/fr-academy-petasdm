import { useRef, useState } from 'react';
import { toBlob, toPng } from 'html-to-image';

export function useCopyAsImage({ title = 'export', onBeforeCapture = null, onAfterCapture = null } = {}) {
    const ref = useRef(null);
    const [isCopying, setIsCopying] = useState(false);
    const [status, setStatus] = useState(''); // 'copied', 'downloaded', ''

    const handleCopy = async () => {
        if (!ref.current) return;
        
        setIsCopying(true);
        setStatus('');
        
        // Optional pre-capture operations (like expanding scrollable elements)
        if (onBeforeCapture) {
            await onBeforeCapture(ref.current);
            // wait a tiny bit for DOM changes to render
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }

        // Filter out the button container
        const filter = (node) => {
            return !(node.classList && node.classList.contains('hide-from-export'));
        };
        
        try {
            const blob = await toBlob(ref.current, { backgroundColor: '#ffffff', filter });
            
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([
                        new window.ClipboardItem({ 'image/png': blob })
                    ]);
                    setStatus('copied');
                } catch (err) {
                    throw err; // Fallback to download
                }
            } else {
                throw new Error('Clipboard API not supported'); // Fallback to download
            }
        } catch (error) {
            console.warn('Failed to copy to clipboard, falling back to download', error);
            try {
                const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff', filter });
                const link = document.createElement('a');
                link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                link.href = dataUrl;
                link.click();
                setStatus('downloaded');
            } catch (dlError) {
                console.error('Failed to download image', dlError);
            }
        } finally {
            if (onAfterCapture) {
                await onAfterCapture(ref.current);
            }
            setIsCopying(false);
            setTimeout(() => setStatus(''), 2500);
        }
    };

    return { ref, isCopying, status, handleCopy };
}
