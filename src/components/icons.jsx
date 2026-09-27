import React from 'react';

// Decorative inline icons; the controls that use them carry their own labels.
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const CloseIcon = () => <Svg size={16}><path d="M5 5l14 14M19 5L5 19" /></Svg>;

export const PlayIcon = () => (
  <Svg size={20}><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" /></Svg>
);

export const PauseIcon = () => (
  <Svg size={20}>
    <path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z" fill="currentColor" stroke="none" />
  </Svg>
);

export const SkipBackIcon = () => <Svg><path d="M18 6v12l-9-6zM6 6v12" /></Svg>;
export const SkipForwardIcon = () => <Svg><path d="M6 6v12l9-6zM18 6v12" /></Svg>;

export const VolumeIcon = () => (
  <Svg><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" /></Svg>
);

export const MutedIcon = () => (
  <Svg><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></Svg>
);
