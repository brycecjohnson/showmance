import { useState, useCallback, useEffect } from 'react';
import './PosterImage.css';

interface PosterImageProps {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
  draggable?: boolean;
}

export function PosterImage({ src, alt, className = '', lazy = false, draggable }: PosterImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setErrored(true), []);

  if (errored) {
    return (
      <div className={`poster-image poster-image--fallback ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`poster-image ${className}`}>
      {!loaded && <div className="poster-image__shimmer" />}
      <img
        src={src}
        alt={alt}
        loading={lazy ? 'lazy' : undefined}
        draggable={draggable}
        onLoad={handleLoad}
        onError={handleError}
        className={`poster-image__img ${loaded ? 'poster-image__img--loaded' : ''}`}
      />
    </div>
  );
}
