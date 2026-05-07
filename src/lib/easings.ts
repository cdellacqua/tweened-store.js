import type {Easing} from './tweened.js';

/** Linear easing: constant velocity from start to end. */
export const linear: Easing = (t) => t;

/** Quadratic ease-in: slow start, fast finish. */
export const easeInQuad: Easing = (t) => t * t;
/** Quadratic ease-out: fast start, slow finish. */
export const easeOutQuad: Easing = (t) => 1 - (1 - t) * (1 - t);
/** Quadratic ease-in-out: slow start, fast middle, slow finish. */
export const easeInOutQuad: Easing = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Cubic ease-in: slow start, fast finish (steeper than quad). */
export const easeInCubic: Easing = (t) => t * t * t;
/** Cubic ease-out: fast start, slow finish (steeper than quad). */
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
/** Cubic ease-in-out: slow start, fast middle, slow finish (steeper than quad). */
export const easeInOutCubic: Easing = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Sine ease-in-out: gentle s-curve. */
export const easeInOutSine: Easing = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Back ease-out: slight overshoot before settling at the target. */
export const easeOutBack: Easing = (t) => {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Elastic ease-out: spring-like oscillation that settles at the target. */
export const easeOutElastic: Easing = (t) => {
	const c4 = (2 * Math.PI) / 3;
	if (t === 0) return 0;
	if (t === 1) return 1;
	return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/** Bounce ease-out: bounces a few times before settling at the target. */
export const easeOutBounce: Easing = (t) => {
	const n1 = 7.5625;
	const d1 = 2.75;
	if (t < 1 / d1) {
		return n1 * t * t;
	} else if (t < 2 / d1) {
		const t2 = t - 1.5 / d1;
		return n1 * t2 * t2 + 0.75;
	} else if (t < 2.5 / d1) {
		const t2 = t - 2.25 / d1;
		return n1 * t2 * t2 + 0.9375;
	} else {
		const t2 = t - 2.625 / d1;
		return n1 * t2 * t2 + 0.984375;
	}
};
