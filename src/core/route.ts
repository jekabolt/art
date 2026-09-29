// Which logo a page shows is decided by its path: /logo-white (and the old /invert, still linked
// from cached storefront pages) is the white logo on black; every other logo path is black on white.
export const isWhiteLogo = (): boolean => /^\/(invert|logo-white)(\/|$)/.test(window.location.pathname)
