import { createContext } from 'react';

export interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const UIContext = createContext<UIState>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
});
