// This script will dynamically remove any Vite error overlays
// and prevent them from being added in the future

// Remove existing overlays
function removeViteOverlays() {
  // Select all elements that might be error overlays
  const overlays = document.querySelectorAll('[data-vite-dev-overlay], .vite-error-overlay, .__vite-error-overlay, .__vite-browser-overlay');
  
  // Remove each overlay
  overlays.forEach(overlay => {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  });
}

// Create a mutation observer to detect and remove new overlays
function createOverlayObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        removeViteOverlays();
      }
    }
  });

  // Start observing the document body for added nodes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial cleanup
  removeViteOverlays();
  
  return observer;
}

// Initialize when the DOM is loaded
const initRemover = () => {
  removeViteOverlays();
  const observer = createOverlayObserver();
  
  // Cleanup function
  return () => {
    observer.disconnect();
  };
};

export default initRemover;