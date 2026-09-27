import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const dist = new URL('../dist/', import.meta.url);
const read = (path) => readFileSync(new URL(path, dist));
const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.name, 'RebelRoutes India');
assert.equal(manifest.short_name, 'RebelRoutes');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.theme_color, '#06080d');
assert.equal(manifest.background_color, '#06080d');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
for (const size of [192, 512]) {
  const icon = manifest.icons.find((icon) => icon.sizes === `${size}x${size}`);
  assert.ok(icon?.purpose.includes('maskable'));
  const png = read(icon.src);
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}
assert.equal(read('icons/apple-touch-icon.png').readUInt32BE(16), 180);
const html = read('index.html').toString();
assert.match(html, /rel="manifest" href="\/manifest.json"/);
assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
assert.match(html, /rel="apple-touch-icon"/);
assert.match(html, /src="\/registerSW.js"/);
assert.match(read('registerSW.js').toString(), /register\('\/sw.js'/);

// Inspect the generated worker's actual precache and navigation registration.
let cached = [];
let navigation;
const define = (_, factory) => factory({
  clientsClaim() {},
  cleanupOutdatedCaches() {},
  precacheAndRoute(entries) { cached = entries.map((entry) => entry.url); },
  createHandlerBoundToURL(url) { assert.equal(url, 'index.html'); },
  NavigationRoute: class { constructor(_, options) { this.options = options; } },
  registerRoute(route) { assert.equal(navigation, undefined); navigation = route; },
});
runInNewContext(read('sw.js').toString(), {
  define,
  self: { define, addEventListener() {} },
});
for (const path of ['index.html', 'manifest.json', ...manifest.icons.map((icon) => icon.src)]) {
  assert.ok(cached.includes(path), `${path} must be available offline`);
}
assert.ok(cached.some((path) => /^assets\/.*\.js$/.test(path)));
assert.ok(cached.some((path) => /^assets\/.*\.css$/.test(path)));
for (const path of cached) {
  assert.ok(!/^(https?:|\/?api\/)/.test(path));
  assert.ok(existsSync(new URL(path, dist)), `Missing precached file: ${path}`);
}
assert.ok(navigation.options.denylist.some((rule) => rule.test('/api/cities')));
assert.ok(!navigation.options.denylist.some((rule) => rule.test('/')));
console.log('PWA manifest, icons, registration, app-shell precache and API exclusion passed.');
