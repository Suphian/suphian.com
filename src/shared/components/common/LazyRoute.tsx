import { lazy, Suspense } from 'react';
import { SkeletonLoader } from '@/shared/components/ui/skeleton-loader';

// Lazy load components for better performance
export const LazyIndex = lazy(() => import('@/features/landing/pages/Index'));
export const LazyNotFound = lazy(() => import('@/pages/NotFound'));

// Wrapper component for lazy loaded routes
export const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SkeletonLoader variant="card" className="w-full max-w-4xl h-96" />
    </div>
  }>
    {children}
  </Suspense>
);