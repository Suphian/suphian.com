import { useState, useRef, useEffect, memo } from 'react';
import { SkeletonLoader } from './ui/skeleton-loader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  sizes?: string;
  width?: number;
  height?: number;
  priority?: 'high' | 'low' | 'auto';
  webpSrc?: string;
  srcSet?: string;
  webpSrcSet?: string;
  lazy?: boolean;
}

const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  skeletonClassName = '',
  sizes,
  width,
  height,
  priority = 'low',
  webpSrc,
  srcSet,
  webpSrcSet,
  lazy = true
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className="relative overflow-hidden">
      {!isLoaded && !hasError && (
        <SkeletonLoader 
          variant="image" 
          className={`absolute inset-0 ${skeletonClassName}`} 
        />
      )}
      
      {webpSrc ? (
        <picture>
          <source 
            type="image/webp" 
            srcSet={isInView ? (webpSrcSet || webpSrc) : undefined}
            sizes={sizes}
          />
          <img
            ref={imgRef}
            src={isInView ? src : undefined}
            srcSet={isInView ? srcSet : undefined}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority === 'high' ? 'eager' : 'lazy'}
            decoding="async"
            sizes={sizes}
            width={width}
            height={height}
            fetchPriority={priority}
            crossOrigin="anonymous"
          />
        </picture>
      ) : (
        <img
          ref={imgRef}
          src={isInView ? src : undefined}
          srcSet={isInView ? srcSet : undefined}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority === 'high' ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          width={width}
          height={height}
          fetchPriority={priority}
          crossOrigin="anonymous"
        />
      )}
      
      {hasError && (
        <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;