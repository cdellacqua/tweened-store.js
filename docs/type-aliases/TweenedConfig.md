[**@universal-stores/tweened**](../README.md)

***

[@universal-stores/tweened](../README.md) / TweenedConfig

# Type Alias: TweenedConfig

> **TweenedConfig** = `object`

Defined in: [src/lib/tweened.ts:97](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L97)

Configuration options for the tweened

## Properties

### duration

> **duration**: `number`

Defined in: [src/lib/tweened.ts:110](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L110)

The duration of the tween, in milliseconds.

#### Default

```ts
300
```

***

### easing

> **easing**: [`Easing`](Easing.md)

Defined in: [src/lib/tweened.ts:104](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L104)

The easing function used to interpolate from the value at the time
`target$` was set to the current target.

#### Default

```ts
(t) => t  // linear
```
