import React from 'react';
import { useTranslation } from 'react-i18next';
import { toggleGameFullscreen } from '../utils/fullscreen';
import './FullscreenButton.css';

interface FullscreenButtonProps {
    isFullscreen: boolean;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ isFullscreen }) => {
    const { t } = useTranslation();
    const label = t(isFullscreen ? 'scene_ui.fullscreenExit' : 'scene_ui.fullscreenEnter');

    return (
        <button
            className="fullscreen-toggle"
            type="button"
            onClick={() => void toggleGameFullscreen()}
            aria-label={label}
            title={`${label} (F11)`}
        >
            {isFullscreen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
                </svg>
            )}
        </button>
    );
};
