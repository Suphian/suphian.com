import { createContext } from 'react';

// The app's one UI context (contact sheet, toasts). It lives on its
// own so every copy of UIProvider.jsx that dev hot reload creates shares this
// object; keep this file tiny and stable.
export const UIContext = createContext(null);
