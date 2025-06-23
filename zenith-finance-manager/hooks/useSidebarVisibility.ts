import { useState, useEffect, useCallback } from 'react';

export function useSidebarVisibility(initialState: boolean = true): [boolean, () => void] {
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedPreference = window.localStorage.getItem('sidebarVisible');
      if (storedPreference) {
        return JSON.parse(storedPreference);
      }
    }
    return initialState;
  });

  const toggleSidebarVisibility = useCallback(() => {
    setIsSidebarVisible(prevMode => !prevMode);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sidebarVisible', JSON.stringify(isSidebarVisible));
    }
  }, [isSidebarVisible]);

  return [isSidebarVisible, toggleSidebarVisibility];
}
