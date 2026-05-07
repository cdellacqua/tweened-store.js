# @universal-stores/tweened

A tweened store is a special kind of store that interpolate its value toward a target using a configurable easing function. It can be used to perform animations.

The tween
is performed using `requestAnimationFrame` if available, otherwise `setTimeout` is
used as a substitute, simulating a 60Hz screen.

This package is based on [universal-stores](https://www.npmjs.com/package/universal-stores),
which are observable containers of values.

[NPM Package](https://www.npmjs.com/package/@universal-stores/tweened)

`npm install @universal-stores/tweened`

[Documentation](./docs/README.md)

## TweenedStore

A `TweenedStore<T>` is a [store](https://www.npmjs.com/package/universal-stores). In particular,
it's a `ReadonlyStore<T>` that exposes its `value` and a `subscribe` method to listen for changes.

Its value can be either a number, an array of numbers or an object whose values are numbers.

It also contains nested stores, the most important of them being `target$`, which contains (and lets you
modify) the current target the tweened should reach.

As an example:

```ts
import {makeTweenedStore} from '@universal-stores/tweened';

const tweened$ = makeTweenedStore(0);
tweened$.subscribe(console.log); // immediately prints 0
// Calling `.set(...)` will cause the above subscription
// to emit values ranging from 0 to 1 until the target is reached.
tweened$.target$.set(1);
```

## Creating a tweened

To create a tweened, this library provides a `makeTweenedStore` function. This function
takes one or two arguments: the initial value of the store and an optional configuration
object.

Examples:

```ts
import {makeTweenedStore} from '@universal-stores/tweened';

const easeFromNumber$ = makeTweenedStore(42);
const easeFromArray$ = makeTweenedStore([1, 2, 3]);
const easeFromObject$ = makeTweenedStore({x: 73, y: 3.14});
```

The optional configuration object can be used to customize the tween behavior, for example
by changing its duration and easing function.

```ts
import {makeTweenedStore, easings} from '@universal-stores/tweened';

const bouncyTweened$ = makeTweenedStore(42, {
	duration: 500, // milliseconds
	easing: easings.easeOutBack,
});
```

## Easings

This library ships a small preset of common easing functions under the
`easings` namespace:

```ts
import {easings} from '@universal-stores/tweened';

easings.linear;
easings.easeInQuad;
easings.easeOutQuad;
easings.easeInOutQuad;
easings.easeInCubic;
easings.easeOutCubic;
easings.easeInOutCubic;
easings.easeInOutSine;
easings.easeOutBack;
easings.easeOutElastic;
easings.easeOutBounce;
```

You can also bring your own. An easing function is just a function from `[0, 1]`
to (typically) `[0, 1]`:

```ts
import {makeTweenedStore, Easing} from '@universal-stores/tweened';

const easeInOutQuart: Easing = (t) =>
	t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

const tweened$ = makeTweenedStore(0, {duration: 400, easing: easeInOutQuart});
```

## Customizing a tweened

If you want to add custom methods to a tweened and encapsulate some behaviour behind
a method, you can use the object spread syntax as shown in the following example:

```ts
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
console.log(customTweened$.content()); // 1
await customTweened$.home();
console.log(customTweened$.content()); // 0
```
