
/**
 * Utility for browser haptic feedback (vibration API).
 * Used to provide tactile feedback on industrial-style UI interactions.
 */
export const haptics = {
    /**
      * Very short, subtle tap. Best for standard button presses.
      */
    light: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    },

    /**
      * Slightly firmer tap. Good for toggles or selection changes.
      */
    medium: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20);
        }
    },

    /**
      * Strong vibration. Use for critical actions or errors.
      */
    heavy: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 50, 30]);
        }
    },

    /**
      * Success pattern (double tap).
      */
    success: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([10, 30, 10]);
        }
    },

    /**
      * Error pattern (long vibration).
      */
    error: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 100, 50, 100, 50]);
        }
    },

    /**
      * Warning pattern.
      */
    warning: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
};
