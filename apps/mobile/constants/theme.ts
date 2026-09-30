/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';



export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#687076',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    primary: '#009688', // Teal
    secondary: '#FFC107', // Amber
    tint: '#009688',
    icon: '#5F6368',
    tabIconDefault: '#5F6368',
    tabIconSelected: '#009688',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#10B981',
  },
  dark: {
    // TEXT
    text: '#E6E8EB',            // Soft white
    textSecondary: '#A3A8AE',   // Muted gray

    // BACKGROUND LEVELS
    background: '#0F1115',      // Deep slate (not pure black → looks premium)
    surface: '#1A1D21',         // Slightly raised surface

    // PRIMARY BRAND COLOR (Teal/Cyan Mix — Modern & Calm)
    primary: '#009688',         // Soft cyan teal
    tint: '#009688',

    // SECONDARY (Warm contrast — subtle)
    secondary: '#FFB547',       // Warm amber with reduced saturation

    // ICONS & STATE
    icon: '#A3A8AE',
    tabIconDefault: '#7D8389',
    tabIconSelected: '#26C6DA',

    // BORDERS / DIVIDERS
    border: '#2A2E33',          // Gentle, subtle border

    // STATUS COLORS
    error: '#E57373',           // Softer red (not neon)
    success: '#4ECB71',         // Balanced green
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
