import { lazy } from 'react';

// Lazy load heavy components to reduce initial bundle size
export const LazyContactForm = lazy(() => import('@/components/ContactForm'));
export const LazyContactSheet = lazy(() => import('@/components/ContactSheet'));
export const LazyRequestCVModal = lazy(() => import('@/components/RequestCVModal'));
export const LazyYouTubeMusicPlayer = lazy(() => import('@/components/YouTubeMusicPlayer').then(m => ({ default: m.YouTubeMusicPlayer })));
export const LazyStreamingRevenueWidget = lazy(() => import('@/components/StreamingRevenueWidget').then(m => ({ default: m.StreamingRevenueWidget })));
export const LazyComparisonTable = lazy(() => import('@/components/ComparisonTable').then(m => ({ default: m.ComparisonTable })));
export const LazyEarningsChart = lazy(() => import('@/components/EarningsChart').then(m => ({ default: m.EarningsChart })));

// Lazy load section components
export const LazyExperienceSection = lazy(() => import('@/components/sections/ExperienceSection'));
export const LazyLeadershipSection = lazy(() => import('@/components/sections/LeadershipSection'));
export const LazyContactSection = lazy(() => import('@/components/sections/ContactSection'));