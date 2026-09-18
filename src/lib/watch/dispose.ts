import { BufferGeometry, Material, Texture } from "three";

/**
 * Release GPU resources on teardown.
 *
 * three.js keeps its WebGL state in a WeakMap keyed by the material or
 * geometry. When one of those is garbage collected the map entry goes
 * with it, but `gl.deleteTexture` and `gl.deleteProgram` are never
 * called, so the texture and the compiled program stay allocated for
 * the life of the context. React Three Fiber does not dispose objects
 * handed to a mesh through the `material=` or `geometry=` props, so
 * anything built in a `useMemo` has to be released by hand.
 *
 * This matters whenever the quality changes, which happens when a
 * tablet is rotated or a desktop window is dragged across the compact
 * breakpoint: the whole material set is rebuilt at the new resolution
 * and the old one would otherwise be stranded.
 */
export function disposeAll(values: Iterable<unknown>): void {
  for (const value of values) {
    if (value instanceof Material) {
      // Materials own their maps; dropping the material alone leaks them.
      for (const property of Object.values(value)) {
        if (property instanceof Texture) property.dispose();
      }
      value.dispose();
    } else if (value instanceof BufferGeometry) {
      value.dispose();
    } else if (value instanceof Texture) {
      value.dispose();
    }
  }
}
