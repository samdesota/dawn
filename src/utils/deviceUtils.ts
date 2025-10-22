/**
 * Utility functions for device detection and capabilities
 */

import { createSignal, onCleanup, onMount } from "solid-js";

/**
 * Detects if the device is a mobile phone based on screen width
 * Uses a max width of 768px to determine phone devices
 */
export function isMobilePhone(): boolean {
  return window.innerWidth <= 768 || window.innerHeight <= 768;
}

export function useMatchesMediaQuery(query: string) {
  const [matches, setMatches] = createSignal(false);
  onMount(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", (e) => setMatches(e.matches));
    onCleanup(() =>
      mediaQuery.removeEventListener("change", (e) => setMatches(e.matches))
    );
  });
  return matches;
}

/**
 * Reactive hook that tracks whether the device is mobile
 * Uses a media query for efficient and declarative responsive detection
 */
export function useIsMobile() {
  const isMobileWidth = useMatchesMediaQuery("(max-width: 768px)");
  const isMobileHeight = useMatchesMediaQuery("(max-height: 768px)");

  return () => isMobileWidth() || isMobileHeight();
}

/**
 * Detects if the device is in landscape orientation
 */
export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

/**
 * Detects if the device is in portrait orientation
 */
export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth;
}

/**
 * Requests fullscreen mode
 */
export async function enterFullscreen(element?: HTMLElement): Promise<void> {
  const targetElement = element || document.documentElement;

  try {
    if (targetElement.requestFullscreen) {
      await targetElement.requestFullscreen();
    } else if ((targetElement as any).webkitRequestFullscreen) {
      await (targetElement as any).webkitRequestFullscreen();
    } else if ((targetElement as any).mozRequestFullScreen) {
      await (targetElement as any).mozRequestFullScreen();
    } else if ((targetElement as any).msRequestFullscreen) {
      await (targetElement as any).msRequestFullscreen();
    }
  } catch (error) {
    console.warn("Failed to enter fullscreen:", error);
    throw error;
  }
}

/**
 * Exits fullscreen mode
 */
export async function exitFullscreen(): Promise<void> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  } catch (error) {
    console.warn("Failed to exit fullscreen:", error);
    throw error;
  }
}

/**
 * Locks screen orientation to landscape
 */
export async function lockToLandscape(): Promise<void> {
  try {
    // @ts-ignore
    if (screen.orientation && screen.orientation.lock) {
      // @ts-ignore
      await screen.orientation.lock("landscape");
    }
  } catch (error) {
    console.warn("Failed to lock orientation:", error);
  }
}

/**
 * Unlocks screen orientation
 */
export function unlockOrientation(): void {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (error) {
    console.warn("Failed to unlock orientation:", error);
  }
}
