import { useState, useRef, useEffect } from 'react';
import { SkeletonLoader } from './ui/skeleton-loader';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  placeholder?: string;
  sizes?: string;
  width?: number;
  height?: number;
  priority?: 'high' | 'low' | 'auto';
}

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  skeletonClassName = '',
  placeholder,
  sizes,
  width,
  height,
  priority = 'low'
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden">
      {!isLoaded && (
        <SkeletonLoader 
          variant="image" 
          className={`absolute inset-0 ${skeletonClassName}`} 
        />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        loading={priority === 'high' ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        width={width}
        height={height}
        {...(priority ? ({ fetchPriority: priority } as any) : {})}
      />
    </div>
  );
};

export default LazyImage;