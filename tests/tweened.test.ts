import {makeTweenedStore, TweenedStore, TweenedStoreSkipError, TweenedStoreState, easings} from '../src/lib/index.js';

describe('tweened store', () => {
	afterEach(() => {
		(
			globalThis as {
				requestAnimationFrame: unknown;
			}
		).requestAnimationFrame = undefined;
		(globalThis as {cancelAnimationFrame: unknown}).cancelAnimationFrame = undefined;
	});

	it('creates tweened stores and checks their states while at rest', () => {
		const number = 13;
		const array = [43, 21, 5];
		const object = {x: 543, y: 23, z: 43};
		const easeFromNumber$ = makeTweenedStore(number);
		expect(easeFromNumber$.content()).to.eqls(number);
		expect(easeFromNumber$.target$.content()).to.eqls(number);
		expect(easeFromNumber$.speed$.content()).to.eqls(0);
		expect(easeFromNumber$.velocity$.content()).to.eqls(0);
		const easeFromArray$ = makeTweenedStore(array);
		expect(easeFromArray$.content()).to.eqls(array);
		expect(easeFromArray$.target$.content()).to.eqls(array);
		expect(easeFromArray$.speed$.content()).to.eqls(0);
		expect(easeFromArray$.velocity$.content()).to.eqls([0, 0, 0]);
		const easeFromObject$ = makeTweenedStore(object);
		expect(easeFromObject$.content()).to.eqls(object);
		expect(easeFromObject$.target$.content()).to.eqls(object);
		expect(easeFromObject$.speed$.content()).to.eqls(0);
		expect(easeFromObject$.velocity$.content()).to.eqls({x: 0, y: 0, z: 0});
	});
	it('creates a tweened changing the defaults', () => {
		const customEasing = (t: number) => t * t;
		const tweened$ = makeTweenedStore(0, {
			duration: 1500,
			easing: customEasing,
		});
		expect(tweened$.duration()).to.eq(1500);
		expect(tweened$.easing()).to.eq(customEasing);
	});
	it('changes the tweened settings after instantiation', () => {
		const tweened$ = makeTweenedStore(0);
		const customEasing = (t: number) => t * t;

		tweened$.duration(1500);
		tweened$.easing(customEasing);

		expect(tweened$.duration()).to.eq(1500);
		expect(tweened$.easing()).to.eq(customEasing);
	});
	it('awaits the tween state to become idle', async () => {
		const number = 13;
		const array = [43, 21, 5];
		const object = {x: 543, y: 23, z: 43};
		const targetNumber = 90;
		const targetArray = [12, 1, 5];
		const targetObject = {x: 143, y: 20, z: 183};
		const easeFromNumber$ = makeTweenedStore(number);
		const easeFromArray$ = makeTweenedStore(array);
		const easeFromObject$ = makeTweenedStore(object);
		easeFromNumber$.target$.set(targetNumber);
		easeFromArray$.target$.set(targetArray);
		easeFromObject$.target$.set(targetObject);
		await Promise.all([easeFromNumber$.idle(), easeFromArray$.idle(), easeFromObject$.idle()]);
		expect(easeFromNumber$.content()).to.eqls(targetNumber);
		expect(easeFromArray$.content()).to.eqls(targetArray);
		expect(easeFromObject$.content()).to.eqls(targetObject);
	});
	it('checks the number of active subscriptions to the tweened', () => {
		const tweened$ = makeTweenedStore(0);
		expect(tweened$.nOfSubscriptions()).to.eq(0);
		const unsubscribe = tweened$.subscribe(() => undefined);
		expect(tweened$.nOfSubscriptions()).to.eq(1);
		unsubscribe();
		expect(tweened$.nOfSubscriptions()).to.eq(0);
	});
	it('checks that the promise returned by idle() resolves once the store has reached its target', async () => {
		const tweened$ = makeTweenedStore(0);
		expect(tweened$.content()).to.eqls(0);
		expect(tweened$.target$.content()).to.eqls(0);
		tweened$.target$.set(1);
		expect(tweened$.content()).to.not.eqls(1);
		await tweened$.idle();
		expect(tweened$.content()).to.eqls(1);
	});
	it('shows that the store will take the default requestAnimationFrame implementation if available in the global context', async () => {
		let called = false;
		(
			globalThis as {
				requestAnimationFrame: (cb: (time: number) => void) => unknown;
			}
		).requestAnimationFrame = (cb) =>
			setTimeout(() => {
				cb(performance.now());
				called = true;
			}, 1000 / 60);
		(globalThis as {cancelAnimationFrame: (id: number) => void}).cancelAnimationFrame = (id) => clearTimeout(id);
		const tweened$ = makeTweenedStore(0);
		tweened$.target$.set(1);
		await tweened$.idle();
		expect(called).to.be.true;
	});
	it('handles a frame dt of 0 between two animation frames without dividing by zero', async () => {
		let previousTimestamp = performance.now();
		let callCount = 0;
		(
			globalThis as {
				requestAnimationFrame: (cb: (time: number) => void) => unknown;
			}
		).requestAnimationFrame = (cb) => {
			callCount++;
			const currentTimestamp = performance.now();
			let id: unknown;
			if (callCount > 10 && callCount < 15) {
				id = setTimeout(() => cb(previousTimestamp), 1000 / 60);
			} else {
				id = setTimeout(() => cb(currentTimestamp), 1000 / 60);
				previousTimestamp = currentTimestamp;
			}
			return id;
		};
		(globalThis as {cancelAnimationFrame: (id: number) => void}).cancelAnimationFrame = (id) => clearTimeout(id);
		const tweened$ = makeTweenedStore(0);
		tweened$.target$.set(1);
		await tweened$.idle();
		expect(tweened$.content()).to.eq(1);
	});
	it('skips the tween while requestAnimationFrame is pending', async () => {
		let first = true;
		const skipPromise = new Promise<void>((resolve, reject) => {
			(
				globalThis as {
					requestAnimationFrame: (cb: (time: number) => void) => unknown;
				}
			).requestAnimationFrame = (cb) => {
				if (first) {
					setTimeout(() => {
						tweened$.skip().then(() => resolve(), reject);
					}, 200);
					first = false;
				}
				return setTimeout(() => cb(performance.now()), 500);
			};
		});
		(globalThis as {cancelAnimationFrame: (id: number) => void}).cancelAnimationFrame = (id) => clearTimeout(id);
		const tweened$ = makeTweenedStore(0);
		tweened$.target$.set(1);
		await skipPromise;
	});
	it('checks the smooth transition towards the target', async () => {
		const tweened$ = makeTweenedStore(0);
		const allValues: number[] = [];
		tweened$.subscribe((current) => allValues.push(current));
		tweened$.target$.set(1);
		await tweened$.idle();
		expect(allValues.length).to.be.greaterThan(0);
		for (let i = 0; i < allValues.length - 1; i++) {
			expect(Math.abs(allValues[i] - allValues[i + 1])).to.be.lessThan(0.5);
		}
	});
	it('produces values that follow the supplied easing function', async () => {
		const tweened$ = makeTweenedStore(0, {
			duration: 300,
			easing: easings.linear,
		});
		const allValues: number[] = [];
		tweened$.subscribe((current) => allValues.push(current));
		tweened$.target$.set(1);
		await tweened$.idle();
		// Linear easing must be monotonically non-decreasing from 0 to 1.
		expect(allValues[0]).to.eq(0);
		expect(allValues.at(-1)).to.eq(1);
		for (let i = 1; i < allValues.length; i++) {
			expect(allValues[i]).to.be.greaterThanOrEqual(allValues[i - 1]);
		}
	});
	it('allows easings that overshoot the target', async () => {
		const tweened$ = makeTweenedStore(0, {
			duration: 300,
			easing: easings.easeOutBack,
		});
		const allValues: number[] = [];
		tweened$.subscribe((current) => allValues.push(current));
		tweened$.target$.set(1);
		await tweened$.idle();
		// easeOutBack overshoots above 1 before settling.
		expect(allValues.some((v) => v > 1)).to.be.true;
		expect(tweened$.content()).to.eq(1);
	});
	it('pauses and resumes the store', async () => {
		const tweened$ = makeTweenedStore(0, {duration: 1000});
		const states: TweenedStoreState[] = [];
		tweened$.state$.subscribe((state) => states.push(state));
		await new Promise<void>((resolve, reject) => {
			const unsubscribe = tweened$.subscribe((current) => {
				if (current > 0.3) {
					unsubscribe();
					tweened$
						.pause()
						.then(() => {
							expect(tweened$.content()).to.not.eqls(1);
							tweened$.resume();
							return tweened$.idle();
						})
						.then(() => {
							expect(tweened$.content()).to.eqls(1);
							expect(states).to.eqls(['idle', 'running', 'pausing', 'paused', 'running', 'idle']);
							resolve();
						}, reject);
				}
			});

			tweened$.target$.set(1);
		});
	});
	it('calls pause() and resume() multiple times', async () => {
		const tweened$ = makeTweenedStore(0, {duration: 1000});
		const states: TweenedStoreState[] = [];
		tweened$.state$.subscribe((state) => states.push(state));
		await new Promise<void>((resolve, reject) => {
			const unsubscribe = tweened$.subscribe((current) => {
				if (current > 0.3) {
					unsubscribe();
					tweened$.pause().catch(reject);
					tweened$.pause().catch(reject);
					tweened$.pause().catch(reject);
					tweened$.pause().catch(reject);
					tweened$.pause().catch(reject);
					tweened$.pause().catch(reject);
					tweened$
						.pause()
						.then(() => {
							expect(tweened$.content()).to.not.eqls(1);
							tweened$.resume();
							tweened$.resume();
							tweened$.resume();
							tweened$.resume();
							tweened$.resume();
							return tweened$.idle();
						})
						.then(() => {
							expect(tweened$.content()).to.eqls(1);
							expect(states).to.eqls(['idle', 'running', 'pausing', 'paused', 'running', 'idle']);
							resolve();
						}, reject);
				}
			});

			tweened$.target$.set(1);
		});
	});
	it('skips to target', async () => {
		const tweened$ = makeTweenedStore(0, {duration: 1000});
		const states: TweenedStoreState[] = [];
		const allValues: number[] = [];
		tweened$.subscribe((current) => allValues.push(current));
		tweened$.state$.subscribe((state) => states.push(state));
		tweened$.target$.set(1);
		await tweened$.skip();
		expect(tweened$.content()).to.eqls(1);
		expect(allValues.length).to.be.greaterThanOrEqual(2);
		expect(Math.abs(allValues.at(-1)! - allValues.at(-2)!)).to.be.greaterThan(0);
		expect(states).to.eqls(['idle', 'running', 'skipping', 'idle']);
	});
	it('skips to a new target synchronously while idle', async () => {
		const tweened$ = makeTweenedStore(0, {duration: 1000});
		const states: TweenedStoreState[] = [];
		const allValues: number[] = [];
		tweened$.subscribe((current) => allValues.push(current));
		tweened$.state$.subscribe((state) => states.push(state));
		await tweened$.skip(2);
		expect(tweened$.content()).to.eqls(2);
		expect(tweened$.target$.content()).to.eqls(2);
		expect(tweened$.velocity$.content()).to.eqls(0);
		expect(allValues).to.eqls([0, 2]);
		expect(states).to.eqls(['idle']);
	});
	it('skips to a new target while running', async () => {
		const tweened$ = makeTweenedStore(0, {duration: 1000});
		const states: TweenedStoreState[] = [];
		const allValues: number[] = [];
		tweened$.subscribe((current) => allValues.push(current));
		tweened$.state$.subscribe((state) => states.push(state));
		tweened$.target$.set(1);
		await tweened$.skip(2);
		expect(tweened$.content()).to.eqls(2);
		expect(tweened$.target$.content()).to.eqls(2);
		expect(allValues.at(-1)).to.eqls(2);
		expect(states).to.eqls(['idle', 'running', 'skipping', 'idle']);
	});
	it('calls skip() and pause() almost at the same time', async () => {
		const tweened$ = makeTweenedStore(0);
		const states: TweenedStoreState[] = [];
		tweened$.state$.subscribe((state) => states.push(state));
		tweened$.target$.set(1);
		const skipPromise = tweened$.skip();
		tweened$.pause().catch(() => undefined);
		await skipPromise;
		expect(tweened$.content()).to.eqls(1);
		expect(states).to.eqls(['idle', 'running', 'skipping', 'idle']);
	});
	it('calls pause() and skip() almost at the same time', async () => {
		const tweened$ = makeTweenedStore(0);
		const states: TweenedStoreState[] = [];
		tweened$.state$.subscribe((state) => states.push(state));
		tweened$.target$.set(1);
		const [pauseResult, skipResult] = await Promise.allSettled([tweened$.pause(), tweened$.skip()]);
		expect(tweened$.content()).to.eqls(1);
		expect(states).to.eqls(['idle', 'running', 'pausing', 'skipping', 'idle']);
		expect(skipResult.status).to.eq('fulfilled');
		expect(pauseResult.status).to.eq('rejected');
		if (pauseResult.status === 'rejected') {
			expect(pauseResult.reason).to.be.instanceOf(TweenedStoreSkipError);
		}
	});
	it('calls skip() after pause()', async () => {
		const tweened$ = makeTweenedStore(0);
		const states: TweenedStoreState[] = [];
		tweened$.state$.subscribe((state) => states.push(state));
		tweened$.target$.set(1);
		await tweened$.pause();
		await tweened$.skip();
		expect(tweened$.content()).to.eqls(1);
		expect(states).to.eqls(['idle', 'running', 'pausing', 'paused', 'skipping', 'idle']);
	});
	it('changes the target while the tween is still running', async () => {
		const tweened$ = makeTweenedStore(0);
		tweened$.target$.set(1);
		expect(tweened$.state$.content()).to.eq('running');
		tweened$.target$.set(2);
		expect(tweened$.state$.content()).to.eq('running');
		await tweened$.idle();
		expect(tweened$.content()).to.eq(2);
	});
	it('completes a tween with duration 0 immediately on the next frame', async () => {
		const tweened$ = makeTweenedStore(0, {duration: 0});
		tweened$.target$.set(1);
		await tweened$.idle();
		expect(tweened$.content()).to.eq(1);
	});
	it('tests that the duration can be changed after spreading a tweened object', async () => {
		function makeCustomTweened(): TweenedStore<number> {
			const tweened$ = makeTweenedStore(0);
			return {
				...tweened$,
			};
		}
		const customTweened$ = makeCustomTweened();
		customTweened$.target$.set(1);
		await customTweened$.idle();
		expect(customTweened$.content()).to.eq(1);
		customTweened$.duration(2000);
		expect(customTweened$.duration()).to.eq(2000);
	});
	it('tests that the skip followed by idle waits for the new target', async () => {
		const allValues: number[] = [];
		const tweened$ = makeTweenedStore(0);
		tweened$.target$.set(0.5);
		await tweened$.skip();
		tweened$.subscribe((v) => allValues.push(v));
		tweened$.target$.set(0.7);
		await tweened$.idle();
		tweened$.target$.set(1);
		await tweened$.idle();
		expect(tweened$.content()).to.eq(1);
		expect(allValues.length).to.be.greaterThan(2);
	});
	it('tests that the skip followed by idle waits for the new target /2', async () => {
		const allValues: number[] = [];
		const tweened$ = makeTweenedStore(0.2);
		tweened$.subscribe((v) => allValues.push(v));
		tweened$.target$.set(0.5);
		await sleep(0);
		await tweened$.skip();
		tweened$.target$.set(1);
		await tweened$.idle();
		expect(tweened$.content()).to.eq(1);
		expect(allValues.length).to.be.greaterThan(2);
	});
});

function sleep(ms: number) {
	return new Promise((res) => setTimeout(res, ms));
}
