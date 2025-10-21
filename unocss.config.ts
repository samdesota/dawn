import { defineConfig } from "@unocss/vite";
import { presetMini } from "@unocss/preset-mini";
import { presetWind4 } from "@unocss/preset-wind4";

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      // Custom black color - softer than pure black
      black: '#0a0a0a',
      white: '#ffffff',
      // Custom gray palette matching piano key colors
      gray: {
        50: '#f8f9fa',   // Light gray (triad light)
        100: '#f1f3f4',  // Very light gray
        200: '#e9ecef',  // Medium light gray (pentatonic light)
        300: '#dee2e6',  // Medium gray (scale light)
        400: '#ced4da',  // Darker gray (chromatic light)
        500: '#adb5bd',  // Mid gray
        600: '#6c757d',  // Dark mid gray
        700: '#495057',  // Darker gray
        800: '#404040',  // Lighter gray (chromatic dark)
        850: '#333333',  // Medium dark gray (scale dark)
        900: '#2a2a2a',  // Slightly lighter charcoal (pentatonic dark)
        950: '#1c1c1c',  // Dark charcoal (triad dark)
      }
    }
  }
});
