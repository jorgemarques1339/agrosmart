import confetti from 'canvas-confetti';

/**
 * MD3-inspired color palette for AgroSmart
 */
const COLORS = [
    '#22c55e', // Emerald (Success/Nature)
    '#4f46e5', // Indigo (Technology/Trust)
    '#f59e0b', // Amber (Sun/Warning)
    '#0ea5e9', // Sky (Water)
    '#ffffff'  // White (Tonal highlight)
];

/**
 * Triggers a "Success" confetti blast from the center.
 * Best used for marking tasks as complete.
 */
export const triggerSuccessConfetti = () => {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: COLORS,
        disableForReducedMotion: true
    });
};

/**
 * Triggers a "Pride" side-cannon effect.
 * Best used for concluding long work sessions (Check-in).
 */
export const triggerSessionCompleteConfetti = () => {
    const end = Date.now() + (1 * 1000);

    const frame = () => {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: COLORS
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: COLORS
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    frame();
};
