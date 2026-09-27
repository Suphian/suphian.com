import { useContext } from 'react';
import { UIContext } from '../components/uiContext.js';

/** The app-level UI controls: openContact, closeContact, toast. */
export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
}
