import React, { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from "react";

const LazyContactSheet = lazy(() =>
  import("@/features/contact/components/ContactSheet").catch(
    () => new Promise<void>((r) => setTimeout(r, 1500)).then(
      () => import("@/features/contact/components/ContactSheet")
    )
  )
);

interface ContactSheetContextValue {
  openContactSheet: (source?: string) => void;
}

const ContactSheetContext = createContext<ContactSheetContextValue | null>(null);

// Single app-level ContactSheet instance. Navbar and the landing page used to
// mount independent copies with separate open state; this also defers the
// contact chunk until the sheet is first opened instead of loading it on mount.
export const ContactSheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const openContactSheet = useCallback((source?: string) => {
    void import("@/features/contact/components/ContactSheet");
    setHasOpened(true);
    setOpen(true);
    void window.trackEvent?.("open_contact_sheet", {
      page: window.location.pathname,
      label: "Open ContactSheet",
      source: source ?? "unknown",
    });
  }, []);

  const value = useMemo(() => ({ openContactSheet }), [openContactSheet]);

  return (
    <ContactSheetContext.Provider value={value}>
      {children}
      {hasOpened && (
        <Suspense fallback={null}>
          <LazyContactSheet open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </ContactSheetContext.Provider>
  );
};

export const useContactSheet = (): ContactSheetContextValue => {
  const ctx = useContext(ContactSheetContext);
  if (!ctx) throw new Error("useContactSheet must be used within ContactSheetProvider");
  return ctx;
};
