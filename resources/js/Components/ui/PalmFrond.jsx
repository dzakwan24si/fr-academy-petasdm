export const PalmFrond = ({ size = 24, className = '', strokeWidth = 1.5, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
        {...props}
    >
        {/* Garis Tengah / Midrib */}
        <line x1="12" y1="2" x2="12" y2="22" />
        {/* Anak Daun / Leaflets */}
        <path d="M12 19L5 15M12 19L19 15" />
        <path d="M12 16L3 11M12 16L21 11" />
        <path d="M12 13L2 7M12 13L22 7" />
        <path d="M12 10L3 4M12 10L21 4" />
        <path d="M12 7L5 2M12 7L19 2" />
        <path d="M12 4L8 1M12 4L16 1" />
    </svg>
);
