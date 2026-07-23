import { isBrowser } from '@/lib/utils';
import { useEffect } from 'react';

/**
 * Style adjustment patch.
 */
const useAdjustStyle = () => {
  /**
   * Prevent callout images from overflowing their parent container.
   */
  const adjustCalloutImg = () => {
    const updates: HTMLElement[] = []
    const callOuts = document.querySelectorAll('.notion-callout-text');
    callOuts.forEach((callout) => {
      if (!(callout instanceof HTMLElement)) return
      const images = callout.querySelectorAll('figure.notion-asset-wrapper.notion-asset-wrapper-image > div');
      const calloutWidth = callout.offsetWidth;
      images.forEach((container) => {
        if (!(container instanceof HTMLElement)) return
        const imageWidth = container.offsetWidth;
        if (imageWidth + 50 > calloutWidth) {
          updates.push(container);
        }
      });
    });
    requestAnimationFrame(() => {
      updates.forEach(container => container.style.setProperty('width', '100%'));
    });
  };

  useEffect(() => {
    if (!isBrowser) {
      return
    }

    let resizeTimer: number | undefined;
    const scheduleAdjust = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(adjustCalloutImg, 120);
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(adjustCalloutImg, { timeout: 2000 });
    } else {
      window.setTimeout(adjustCalloutImg, 1000);
    }
    window.addEventListener('resize', scheduleAdjust);
    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleAdjust);
    };
  }, []);
};

export default useAdjustStyle;
