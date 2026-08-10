import { create } from "zustand";

interface UIState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isCartOpen: false,
  isSearchOpen: false,
  isMobileMenuOpen: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),

  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
}));
