import { useState, useEffect } from 'react';

/**
 * Persists active tab state to sessionStorage so that refreshing the page
 * preserves the current tab. Each dashboard gets a unique key.
 * 
 * @param {string} storageKey - Unique key for sessionStorage (e.g., 'sync_student_tab')
 * @param {string} defaultTab - Default tab to use if no stored value exists
 * @returns {[string, function]} - [activeTab, setActiveTab] tuple
 */
export const useTabPersistence = (storageKey, defaultTab) => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored || defaultTab;
    } catch {
      return defaultTab;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, activeTab);
    } catch {
      // sessionStorage unavailable (e.g. private browsing), silently ignore
    }
  }, [storageKey, activeTab]);

  return [activeTab, setActiveTab];
};
