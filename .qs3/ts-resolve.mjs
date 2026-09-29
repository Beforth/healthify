/**
 * Teaches Node to resolve the app's extensionless relative imports.
 *
 * The sources import each other as `./capGeo` and are bundled by Vite, which
 * resolves that happily; Node's ESM resolver does not, and there is no flag left
 * that tells it to. Rather than reach for a bundler — the cut-face generators are
 * pure functions over byte arrays, and all that is wanted is to call one — this
 * catches the failure and retries with a `.ts` extension, which is all the app's
 * own imports ever need.
 *
 * Register with `module.register`, then load anything from `src/` by dynamic
 * import. Static imports are resolved before a hook is in place, so they cannot be
 * used for the app's own modules.
 */

const TS = /\.ts$/;

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !TS.test(specifier)) {
      return next(`${specifier}.ts`, context);
    }
    throw err;
  }
}
