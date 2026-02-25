import { useState, useEffect, useCallback } from 'react';
import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

interface ParallaxOptions {
    /** The intensity of the tilt. Higher means more rotation. Default 20. */
    intensity?: number;
    /** Spring stiffness for the animation. Default 300. */
    stiffness?: number;
    /** Spring damping. Higher means less bounce. Default 30. */
    damping?: number;
}

interface ParallaxReturn {
    rotateX: MotionValue<number>;
    rotateY: MotionValue<number>;
    onMouseMove: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onMouseLeave: () => void;
}

/**
 * Hook to create fluid 3D parallax effects driven by Mouse (Desktop) or Gyroscope (Mobile).
 */
export const useParallax3D = (options: ParallaxOptions = {}): ParallaxReturn => {
    const { intensity = 20, stiffness = 300, damping = 30 } = options;

    // Raw input values [-1 to 1]
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Apply fluid spring physics
    const springConfig = { stiffness, damping };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    // Map the [-1, 1] input to degrees of rotation, inverted for natural feel
    const rotateX = useTransform(springY, [-1, 1], [intensity, -intensity]);
    const rotateY = useTransform(springX, [-1, 1], [-intensity, intensity]);

    // Track baseline for device orientation to handle initial tilt
    const [baseline, setBaseline] = useState<{ beta: number | null, gamma: number | null }>({ beta: null, gamma: null });

    // Desktop Mouse Handler
    const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();

        // Calculate relative position within the element (0 to 1)
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        // Map to [-1, 1] range relative to center
        x.set((relX - 0.5) * 2);
        y.set((relY - 0.5) * 2);
    }, [x, y]);

    const onMouseLeave = useCallback(() => {
        // Return to center
        x.set(0);
        y.set(0);
    }, [x, y]);

    // Mobile Gyroscope Handler
    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            let { beta, gamma } = e;
            if (beta === null || gamma === null) return;

            // Beta: front-to-back tilt [-180, 180]
            // Gamma: left-to-right tilt [-90, 90]

            // Establish baseline on first reading
            if (baseline.beta === null) {
                setBaseline({ beta, gamma });
                return;
            }

            // Calculate delta from baseline
            // Clamp beta delta to avoid flipping
            let deltaBeta = beta - baseline.beta;
            let deltaGamma = gamma - baseline.gamma!;

            // Clamp max tilt angles for the effect map
            const maxTilt = 45;
            deltaBeta = Math.max(-maxTilt, Math.min(maxTilt, deltaBeta));
            deltaGamma = Math.max(-maxTilt, Math.min(maxTilt, deltaGamma));

            // Map [-maxTilt, maxTilt] to [-1, 1] range for the spring, invert Y for natural feel
            x.set(deltaGamma / maxTilt);
            y.set(deltaBeta / maxTilt);
        };

        // Note: For iOS 13+, permissions might be needed. This is a basic implementation.
        if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleOrientation);
            }
        };
    }, [baseline, x, y]);

    return { rotateX, rotateY, onMouseMove, onMouseLeave };
};
