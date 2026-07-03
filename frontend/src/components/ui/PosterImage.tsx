import { useState, useCallback, useRef, useEffect } from 'react';
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [prevSrc, setPrevSrc] = useState(src);

  // Track src changes and reset state
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setErrored(false);
  }

  // Handle images that load from cache (complete before onLoad fires)
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  });

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setErrored(true), []);

  if (errored) {
    return (
      <div className={`poster-image poster-image--fallback ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
          <path d="M7 2v8a2 2 0 002 2v10M7 2v4M11 2v4M4 2v4a3 3 0 003 3" />
          <path d="M17 2c-1.7 0-3 2-3 5v4h3v11M17 2v20" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`poster-image ${className}`}>
      {!loaded && <div className="poster-image__shimmer" />}
      <img
        ref={imgRef}
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
