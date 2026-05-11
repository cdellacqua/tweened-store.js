[**@universal-stores/tweened**](../README.md)

***

[@universal-stores/tweened](../README.md) / TweenedStoreConfig

# Type Alias: TweenedStoreConfig

> **TweenedStoreConfig** = `object` & `Partial`\<[`TweenedConfig`](TweenedConfig.md)\>

Defined in: [src/lib/tweened.ts:114](https://github.com/cdellacqua/tweened-store.js/blob/main/src/lib/tweened.ts#L114)

Configuration options for a tweened store

## Type Declaration

### requestAnimationFrameImplementation?

> `optional` **requestAnimationFrameImplementation?**: [`RAFImplementation`](RAFImplementation.md)

A custom requestAnimationFrame + cancelAnimationFrame implementation.
By default, the store will use requestAnimationFrame and cancelAnimationFrame
if available in the runtime. If these functions are not available, it will
default to using setTimeout and clearTimeout emulating a 60Hz display.
