import { defineConfig } from "@unocss/vite";
import { presetMini } from "@unocss/preset-mini";
import { presetWind4 } from "@unocss/preset-wind4";

export default defineConfig({
  presets: [presetWind4()],
});
