import {makeTweenedStore, TweenedStore, easings} from '../src/lib/index.js';

describe('examples', () => {
	it('readme 1', async () => {
		const tweened$ = makeTweenedStore(0);
		const allValues: number[] = [];
		tweened$.subscribe((value) => allValues.push(value));
		// Calling `.set(...)` will cause the above subscription
		// to emit values until the target is reached.
		tweened$.target$.set(1);
		await tweened$.idle();
		expect(allValues.length).to.be.greaterThan(0);
	});
	it('readme 2', () => {
		const easeFromNumber$ = makeTweenedStore(42);
		const easeFromArray$ = makeTweenedStore([1, 2, 3]);
		const easeFromObject$ = makeTweenedStore({x: 73, y: 3.14});
		expect(easeFromNumber$.content()).to.eqls(42);
		expect(easeFromArray$.content()).to.eqls([1, 2, 3]);
		expect(easeFromObject$.content()).to.eqls({x: 73, y: 3.14});
	});
	it('readme 3', async () => {
		const bouncyTweened$ = makeTweenedStore(42, {
			duration: 500,
			easing: easings.easeOutBack,
		});
		bouncyTweened$.target$.set(43);
		const allValues: number[] = [];
		bouncyTweened$.subscribe((value) => allValues.push(value));
		await bouncyTweened$.idle();
		expect(allValues.some((v) => v > 43)).to.be.true;
	});
	it('object spread syntax', async () => {
		function makeCustomTweened(): TweenedStore<number> & {home(): Promise<void>} {
			const tweened$ = makeTweenedStore(0);
			return {
				...tweened$,
				home() {
					tweened$.target$.set(0);
					return tweened$.idle();
				},
			};
		}
		const customTweened$ = makeCustomTweened();
		customTweened$.target$.set(1);
		await customTweened$.idle();
		expect(customTweened$.content()).to.eq(1);
		await customTweened$.home();
		expect(customTweened$.content()).to.eq(0);
	});
});
