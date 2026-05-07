import {makeDerivedStore, makeStore, ReadonlyStore, Store} from 'universal-stores';

const noop = () => undefined as void;

/** Request animation frame implementation. */
export type RAFImplementation = {
	/**
	 * Enqueue the passed callback for the execution on the next animation frame.
	 * @param callback a function which will be called once an animation frame is available.
	 */
	request(callback: (time: number) => void): unknown;
	/**
	 * Remove a callback that was previously added to the animation frame queue.
	 * @param id the return value of the request method, which identifies an enqueued callback.
	 */
	cancel(id: unknown): void;
};

/**
 * A custom error that's raised when the `.skip()` method is invoked on a tweened store.
 * If `.skip()` is called while the store is 'pausing', the promise returned by `.pause()`
 * will reject with this error.
 */
export class TweenedStoreSkipError extends Error {
	constructor() {
		super('[ease store] tween skipped');
	}
}

/** All possible states of a tweened store */
export type TweenedStoreState = 'idle' | 'running' | 'pausing' | 'skipping' | 'paused';

/**
 * An easing function: takes a normalized time in [0, 1] and returns the eased
 * value (typically in [0, 1], but values outside this range are valid for
 * easings that overshoot or undershoot, such as elastic or back).
 */
export type Easing = (t: number) => number;

/**
 * A tweened store is a special kind of store that interpolate its value toward a target using a configurable easing function.
 * It can be used to perform animations.
 */
export type TweenedStore<T> = ReadonlyStore<T> & {
	/** Return the current tween duration, in milliseconds. */
	duration(): number;
	/**
	 * Set a new tween duration, in milliseconds. If a tween is currently running,
	 * the new value will be used immediately, scaling the remaining trajectory.
	 */
	duration(newDuration: number): number;
	/** Return the current easing function. */
	easing(): Easing;
	/**
	 * Set a new easing function. If a tween is currently running, the new
	 * function will be used immediately for the remaining trajectory.
	 */
	easing(newEasing: Easing): Easing;
	/** A store containing the current state of the ease. */
	state$: ReadonlyStore<TweenedStoreState>;
	/**
	 * A store containing the velocity of the ease, in units-per-second,
	 * expressed using the same shape as the ease value.
	 */
	velocity$: ReadonlyStore<T>;
	/** The speed (in units-per-second) derived from the velocity using Pythagoras' Theorem. */
	speed$: ReadonlyStore<number>;
	/** Stop the tween, even if it was paused, and set the store value to the current target. */
	skip(): Promise<void>;
	/**
	 * Pause the tween.
	 * @throws {TweenedStoreSkipError} if `.skip()` is called while the tween is pausing or paused.
	 */
	pause(): Promise<void>;
	/** Resume a paused tween. */
	resume(): void;
	/** Wait for the tween to end, either because it reached the target or because `.skip()` was called. */
	idle(): Promise<void>;
	/**
	 * A store containing the target value of the ease. Changes to this store will start a new tween (if not already running).
	 */
	target$: Store<T>;
};

/** Configuration options for the ease */
export type TweenedConfig = {
	/**
	 * The easing function used to interpolate from the value at the time
	 * `target$` was set to the current target.
	 *
	 * @default (t) => t  // linear
	 */
	easing: Easing;
	/**
	 * The duration of the tween, in milliseconds.
	 *
	 * @default 300
	 */
	duration: number;
};

/** Configuration options for a tweened store */
export type TweenedStoreConfig = {
	/**
	 * A custom requestAnimationFrame + cancelAnimationFrame implementation.
	 * By default, the store will use requestAnimationFrame and cancelAnimationFrame
	 * if available in the runtime. If these functions are not available, it will
	 * default to using setTimeout and clearTimeout emulating a 60Hz display.
	 */
	requestAnimationFrameImplementation?: RAFImplementation;
} & Partial<TweenedConfig>;

/**
 * Create a promisified version of requestAnimationFrame that supports cancellation through
 * an abort signal.
 * @param rafImpl a custom requestAnimationFrame + cancelAnimationFrame implementation.
 * @returns a Promisified version of requestAnimationFrame.
 */
function makeWaitAnimationFrame(rafImpl?: RAFImplementation) {
	return function waitAnimationFrame(abortSignal?: AbortSignal): Promise<number> {
		const actualRafImpl =
			rafImpl ||
			(typeof requestAnimationFrame !== 'undefined'
				? {
						request: (cb: (time: number) => void) => requestAnimationFrame(cb),
						cancel: (id: number) => cancelAnimationFrame(id),
					}
				: {
						request: (cb: (time: number) => void) => setTimeout(() => cb(performance.now()), 1000 / 60),
						cancel: (id: number) => clearTimeout(id),
					});

		let callbackId: unknown | undefined;
		const rafPromise = new Promise<number>((res, rej) => {
			if (abortSignal?.aborted) {
				rej(abortSignal.reason);
				return;
			}

			const listener = () => {
				if (callbackId !== undefined) {
					actualRafImpl.cancel(callbackId);
				}
				rej(abortSignal?.reason);
			};
			abortSignal?.addEventListener('abort', listener, {once: true});
			callbackId = actualRafImpl.request((time) => {
				abortSignal?.removeEventListener('abort', listener);
				callbackId = undefined;
				res(time);
			});
		});
		return rafPromise;
	};
}

/**
 * Create a tweened store.
 * An ease store is a special kind of store that tweens its value toward a
 * target using a configurable easing function. It can be used to perform
 * animations and to make a UI feel more natural (e.g. in a drag&drop scenario).
 *
 * Example usage
 * ```ts
 * const tweened$ = makeTweenedStore(0);
 * tweened$.subscribe(console.log);
 * // Calling `.set(...)` will cause the above subscription
 * // to emit values until the target is reached.
 * tweened$.target$.set(1);
 * ```
 *
 * @param value the initial value of the store. It can be a number, an array of numbers or an object whose values are numbers.
 * @param config an optional configuration object to customize the behavior of the store.
 * @returns a tweened store.
 */
export function makeTweenedStore<T extends number | number[] | Record<string, number>>(
	value: T extends number ? number : T,
	config?: TweenedStoreConfig,
): TweenedStore<T extends number ? number : T> {
	let duration = config?.duration ?? 300;
	let easing: Easing = config?.easing ?? ((t) => t);

	type WidenedT = T extends number ? number : T;

	const waitAnimationFrame = makeWaitAnimationFrame(config?.requestAnimationFrameImplementation);

	type ValueOps<V> = {
		zero(): V;
		clone(v: V): V;
		lerp(start: V, end: V, t: number): V;
		velocity(current: V, previous: V, k: number): V;
		norm(v: V): number;
	};
	const valueOps = ((): ValueOps<WidenedT> => {
		if (typeof value === 'number') {
			const ops: ValueOps<number> = {
				zero: () => 0,
				clone: (v) => v,
				lerp: (s, e, t) => s + (e - s) * t,
				velocity: (c, p, k) => (c - p) * k,
				norm: (v) => Math.abs(v),
			};
			return ops as unknown as ValueOps<WidenedT>;
		}
		if (Array.isArray(value)) {
			const length = value.length;
			const ops: ValueOps<number[]> = {
				zero: () => new Array<number>(length).fill(0),
				clone: (v) => v.slice(),
				lerp: (s, e, t) => {
					const out = new Array<number>(length);
					for (let i = 0; i < length; i++) out[i] = s[i] + (e[i] - s[i]) * t;
					return out;
				},
				velocity: (c, p, k) => {
					const out = new Array<number>(length);
					for (let i = 0; i < length; i++) out[i] = (c[i] - p[i]) * k;
					return out;
				},
				norm: (v) => {
					let sum = 0;
					for (let i = 0; i < length; i++) sum += v[i] * v[i];
					return Math.sqrt(sum);
				},
			};
			return ops as unknown as ValueOps<WidenedT>;
		}
		const keys = Object.keys(value);
		const ops: ValueOps<Record<string, number>> = {
			zero: () => {
				const o: Record<string, number> = {};
				for (const k of keys) o[k] = 0;
				return o;
			},
			clone: (v) => ({...v}),
			lerp: (s, e, t) => {
				const o: Record<string, number> = {};
				for (const k of keys) o[k] = s[k] + (e[k] - s[k]) * t;
				return o;
			},
			velocity: (c, p, k) => {
				const o: Record<string, number> = {};
				for (const key of keys) o[key] = (c[key] - p[key]) * k;
				return o;
			},
			norm: (v) => {
				let sum = 0;
				for (const k of keys) sum += v[k] * v[k];
				return Math.sqrt(sum);
			},
		};
		return ops as unknown as ValueOps<WidenedT>;
	})();

	let targetValue = valueOps.clone(value as WidenedT);
	let startValue = valueOps.clone(value as WidenedT);
	let currentValue = valueOps.clone(value as WidenedT);
	let velocity = valueOps.zero();
	let elapsed = 0;

	const state$ = makeStore<TweenedStoreState>('idle');

	let idlePromise: Promise<void> | undefined;
	let resumePromise: Promise<void> | undefined;
	let pausePromise: Promise<void> | undefined;
	let resolveResumePromise = noop;
	let rejectResumePromise = noop as (err?: unknown) => void;
	let resolvePausePromise = noop;
	let rejectPausePromise = noop as (err?: unknown) => void;
	let resolveIdlePromise = noop;

	const velocity$ = makeStore(valueOps.zero());
	// speed = |velocity|
	const speed$ = makeDerivedStore(velocity$, (v) => valueOps.norm(v));

	const current$ = makeStore(value);
	const target$ = makeStore(value);
	let firstTarget = true;
	target$.subscribe((target) => {
		targetValue = valueOps.clone(target as WidenedT);
		if (firstTarget) {
			firstTarget = false;
			return;
		}
		startValue = valueOps.clone(currentValue);
		elapsed = 0;
		follow().catch((err) => console.error('[ease store] unable to follow target', err));
	});
	state$.subscribe((state) => {
		if (state === 'idle') {
			resolveIdlePromise();
			idlePromise = undefined;
			resolveIdlePromise = noop;
		} else if (!idlePromise) {
			idlePromise = new Promise((res) => (resolveIdlePromise = res));
		}
	});

	function skipToTarget() {
		currentValue = valueOps.clone(targetValue);
		velocity = valueOps.zero();
		elapsed = duration;
	}

	async function follow() {
		if (state$.content() !== 'idle') {
			return;
		}
		try {
			state$.set('running');

			let done = false;
			let previousTime: number | undefined;

			while (!done) {
				switch (state$.content()) {
					case 'skipping': {
						skipToTarget();
						done = true;
						break;
					}
					case 'pausing': {
						resolvePausePromise();
						state$.set('paused');
						try {
							await resumePromise;
							state$.set('running');
							previousTime = undefined;
						} catch (resumeErr) {
							if (resumeErr instanceof TweenedStoreSkipError) {
								skipToTarget();
								done = true;
								/* c8 ignore next */
							} else throw resumeErr; // This shouldn't be possible as the reject callback is always called with an TweenedStoreSkipError instance
						}
						break;
					}
					case 'running': {
						previousTime = previousTime ?? (await waitAnimationFrame());
						const currentTime = await waitAnimationFrame();
						const frameDtMs = currentTime - previousTime;
						previousTime = currentTime;

						elapsed += frameDtMs;
						const t = duration > 0 ? Math.min(1, elapsed / duration) : 1;

						if (t >= 1) {
							currentValue = valueOps.clone(targetValue);
							velocity = valueOps.zero();
							done = true;
						} else {
							const easedT = easing(t);
							const newValue = valueOps.lerp(startValue, targetValue, easedT);
							if (frameDtMs > 0) {
								// velocity is in units-per-second: (Δvalue / Δms) * 1000
								velocity = valueOps.velocity(newValue, currentValue, 1000 / frameDtMs);
							}
							currentValue = newValue;
						}
						break;
					}
					case 'idle':
					case 'paused':
						break;
				}

				current$.set(currentValue);
				velocity$.set(velocity);
			}
		} finally {
			state$.set('idle');
		}
	}

	return {
		duration(newDuration?: number) {
			if (newDuration !== undefined) {
				duration = newDuration;
			}
			return duration;
		},
		easing(newEasing?: Easing) {
			if (newEasing !== undefined) {
				easing = newEasing;
			}
			return easing;
		},
		nOfSubscriptions: current$.nOfSubscriptions,
		content: current$.content,
		speed$,
		state$,
		subscribe: current$.subscribe,
		watch: current$.watch,
		velocity$,
		async pause() {
			if (state$.content() === 'running') {
				state$.set('pausing');
				pausePromise = new Promise<void>((res, rej) => {
					resolvePausePromise = () => {
						pausePromise = undefined;
						resolvePausePromise = noop;
						rejectPausePromise = noop;
						res();
					};
					rejectPausePromise = (err) => {
						pausePromise = undefined;
						resolvePausePromise = noop;
						rejectPausePromise = noop;
						rej(err);
					};
				});
				pausePromise.catch(noop);
				resumePromise = new Promise<void>((res, rej) => {
					resolveResumePromise = () => {
						resumePromise = undefined;
						resolveResumePromise = noop;
						rejectResumePromise = noop;
						res();
					};
					rejectResumePromise = (err) => {
						resumePromise = undefined;
						resolveResumePromise = noop;
						rejectResumePromise = noop;
						rej(err);
					};
				});
				resumePromise.catch(noop);
			}
			await pausePromise;
		},
		resume() {
			resolveResumePromise();
		},
		async skip() {
			const state = state$.content();
			if ((state === 'running' || state === 'pausing' || state === 'paused') && idlePromise) {
				state$.set('skipping');
				const skipError = new TweenedStoreSkipError();
				rejectResumePromise(skipError);
				rejectPausePromise(skipError);
				await idlePromise;
			}
		},
		target$,
		async idle() {
			await idlePromise;
		},
	};
}
