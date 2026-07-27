import React from 'react';

/**
 * Wraps React.lazy to handle chunk loading errors gracefully in production.
 * If a dynamic import fails (e.g. because a new deployment has replaced older chunk hashes on the server),
 * this utility will save a retry state and force-reload the page to retrieve the latest build assets.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      try {
        const hasRetried = window.sessionStorage.getItem('chunk-retry-done');
        if (!hasRetried) {
          window.sessionStorage.setItem('chunk-retry-done', 'true');
          window.location.reload();
          // Return a pending promise to prevent rendering crash before the reload initiates
          return new Promise(() => {});
        }
      } catch (storageError) {
        // Fallback reload if sessionStorage is disabled/blocked
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}
