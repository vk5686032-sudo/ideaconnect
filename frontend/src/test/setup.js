// Runs for every test file, including the pure-node ones, so it must not touch
// `window` unguarded — that throws "window is not defined" outside jsdom.
if (typeof window !== 'undefined') {
  // jsdom implements neither of these, and components reach for them freely.
  // Stubbed rather than polyfilled: nothing in this app needs real layout, and
  // pulling in a polyfill set to satisfy a stubbed clipboard would be waste.
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (!window.scrollTo) window.scrollTo = () => {};
}
