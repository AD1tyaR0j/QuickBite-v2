import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => !!window.Capacitor;

export const haptics = {
  // Light vibration (e.g. simple tap feedback)
  light: async () => {
    if (isNative()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        console.warn('Haptics failed:', e);
      }
    }
  },

  // Medium vibration (e.g. toggle actions or item additions)
  medium: async () => {
    if (isNative()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {
        console.warn('Haptics failed:', e);
      }
    }
  },

  // Success notification vibration (e.g. order complete or check out)
  success: async () => {
    if (isNative()) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch (e) {
        console.warn('Haptics failed:', e);
      }
    }
  },

  // Warning vibration
  warning: async () => {
    if (isNative()) {
      try {
        await Haptics.notification({ type: NotificationType.Warning });
      } catch (e) {
        console.warn('Haptics failed:', e);
      }
    }
  },

  // Error vibration (e.g. validation error or network failure)
  error: async () => {
    if (isNative()) {
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch (e) {
        console.warn('Haptics failed:', e);
      }
    }
  },

  // Selection vibration (e.g. tab changes, category selection)
  selection: async () => {
    if (isNative()) {
      try {
        await Haptics.selectionStart();
      } catch (e) {
        console.warn('Haptics failed:', e);
      }
    }
  }
};
