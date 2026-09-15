import React from 'react';
import './EyelidsOverlay.css';

interface EyelidsOverlayProps {
    isClosing: boolean;
}

export const EyelidsOverlay: React.FC<EyelidsOverlayProps> = ({ isClosing }) => {
    return (
        <div className={`eyelids-container ${isClosing ? 'eyelids-closed eyelids-active' : ''}`}>
            <div className="eyelid-top" />
            <div className="eyelid-bottom" />
        </div>
    );
};