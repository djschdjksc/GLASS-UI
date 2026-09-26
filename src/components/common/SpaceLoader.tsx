import React from 'react';

interface SpaceLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export const SpaceLoader: React.FC<SpaceLoaderProps> = ({ text, fullScreen = true }) => {
  return (
    <div className={`space-loader-wrapper ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="space-loader-inner">
        <div className="space-loader">
          <span><span /><span /><span /><span /></span>
          <div className="space-base">
            <span />
            <div className="space-face" />
          </div>
        </div>
        <div className="space-longfazers">
          <span /><span /><span /><span />
        </div>
      </div>
      {text && <div className="space-loader-text">{text}</div>}
    </div>
  );
};
