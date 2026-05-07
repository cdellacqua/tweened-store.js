[**@universal-stores/tweened**](../README.md)

***

[@universal-stores/tweened](../README.md) / TweenedStore

# Type Alias: TweenedStore\<T\>

> **TweenedStore**\<`T`\> = [`ReadonlyStore`](ReadonlyStore.md)\<`T`\> & `object`

Defined in: [src/lib/tweened.ts:44](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L44)

A tweened store is a special kind of store that interpolate its value toward a target using a configurable easing function.
It can be used to perform animations.

## Type Declaration

### speed$

> **speed$**: [`ReadonlyStore`](ReadonlyStore.md)\<`number`\>

The speed (in units-per-second) derived from the velocity using Pythagoras' Theorem.

### state$

> **state$**: [`ReadonlyStore`](ReadonlyStore.md)\<[`TweenedStoreState`](TweenedStoreState.md)\>

A store containing the current state of the tweened.

### target$

> **target$**: [`Store`](Store.md)\<`T`\>

A store containing the target value of the tweened. Changes to this store will start a new tween (if not already running).

### velocity$

> **velocity$**: [`ReadonlyStore`](ReadonlyStore.md)\<`T`\>

A store containing the velocity of the tweened, in units-per-second,
expressed using the same shape as the tweened value.

### duration()

#### Call Signature

> **duration**(): `number`

Return the current tween duration, in milliseconds.

##### Returns

`number`

#### Call Signature

> **duration**(`newDuration`): `number`

Set a new tween duration, in milliseconds. If a tween is currently running,
the new value will be used immediately, scaling the remaining trajectory.

##### Parameters

###### newDuration

`number`

##### Returns

`number`

### easing()

#### Call Signature

> **easing**(): [`Easing`](Easing.md)

Return the current easing function.

##### Returns

[`Easing`](Easing.md)

#### Call Signature

> **easing**(`newEasing`): [`Easing`](Easing.md)

Set a new easing function. If a tween is currently running, the new
function will be used immediately for the remaining trajectory.

##### Parameters

###### newEasing

[`Easing`](Easing.md)

##### Returns

[`Easing`](Easing.md)

### idle()

> **idle**(): `Promise`\<`void`\>

Wait for the tween to end, either because it reached the target or because `.skip()` was called.

#### Returns

`Promise`\<`void`\>

### pause()

> **pause**(): `Promise`\<`void`\>

Pause the tween.

#### Returns

`Promise`\<`void`\>

#### Throws

if `.skip()` is called while the tween is pausing or paused.

### resume()

> **resume**(): `void`

Resume a paused tween.

#### Returns

`void`

### skip()

> **skip**(): `Promise`\<`void`\>

Stop the tween, even if it was paused, and set the store value to the current target.

#### Returns

`Promise`\<`void`\>

## Type Parameters

### T

`T`
