[**@universal-stores/tweened**](../README.md)

***

[@universal-stores/tweened](../README.md) / makeTweenedStore

# Function: makeTweenedStore()

> **makeTweenedStore**\<`T`\>(`value`, `config?`): [`TweenedStore`](../type-aliases/TweenedStore.md)\<`T` *extends* `number` ? `number` : `T`\>

Defined in: [src/lib/tweened.ts:176](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L176)

Create a tweened store.
An tweened store is a special kind of store that tweens its value toward a
target using a configurable easing function. It can be used to perform
animations and to make a UI feel more natural (e.g. in a drag&drop scenario).

Example usage
```ts
const tweened$ = makeTweenedStore(0);
tweened$.subscribe(console.log);
// Calling `.set(...)` will cause the above subscription
// to emit values until the target is reached.
tweened$.target$.set(1);
```

## Type Parameters

### T

`T` *extends* `number` \| `Record`\<`string`, `number`\> \| `number`[]

## Parameters

### value

`T` *extends* `number` ? `number` : `T`

the initial value of the store. It can be a number, an array of numbers or an object whose values are numbers.

### config?

[`TweenedStoreConfig`](../type-aliases/TweenedStoreConfig.md)

an optional configuration object to customize the behavior of the store.

## Returns

[`TweenedStore`](../type-aliases/TweenedStore.md)\<`T` *extends* `number` ? `number` : `T`\>

a tweened store.
