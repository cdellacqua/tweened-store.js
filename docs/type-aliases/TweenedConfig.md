[**@universal-stores/tweened**](../README.md)

***

[@universal-stores/tweened](../README.md) / TweenedConfig

# Type Alias: TweenedConfig

> **TweenedConfig** = `object`

Defined in: [src/lib/tweened.ts:86](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L86)

Configuration options for the tweened

## Properties

### duration

> **duration**: `number`

Defined in: [src/lib/tweened.ts:99](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L99)

The duration of the tween, in milliseconds.

#### Default

```ts
300
```

***

### easing

> **easing**: [`Easing`](Easing.md)

Defined in: [src/lib/tweened.ts:93](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L93)

The easing function used to interpolate from the value at the time
`target$` was set to the current target.

#### Default

```ts
(t) => t  // linear
```
