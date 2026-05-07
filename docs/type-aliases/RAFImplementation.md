[**@universal-stores/tweened**](../README.md)

***

[@universal-stores/tweened](../README.md) / RAFImplementation

# Type Alias: RAFImplementation

> **RAFImplementation** = `object`

Defined in: [src/lib/tweened.ts:6](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L6)

Request animation frame implementation.

## Methods

### cancel()

> **cancel**(`id`): `void`

Defined in: [src/lib/tweened.ts:16](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L16)

Remove a callback that was previously added to the animation frame queue.

#### Parameters

##### id

`unknown`

the return value of the request method, which identifies an enqueued callback.

#### Returns

`void`

***

### request()

> **request**(`callback`): `unknown`

Defined in: [src/lib/tweened.ts:11](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L11)

Enqueue the passed callback for the execution on the next animation frame.

#### Parameters

##### callback

(`time`) => `void`

a function which will be called once an animation frame is available.

#### Returns

`unknown`
