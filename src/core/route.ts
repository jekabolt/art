// Which logo a page shows is decided by its path: /logo-white (and the old /invert, still linked
// from cached storefront pages) is the white logo on black; every other logo path is black on white.
export const isWhiteLogo = (): boolean => /^\/(invert|logo-white)(\/|$)/.test(window.location.pathname)

/** /gyro: the logo turns with the phone (compass heading), as the 2024 party version did. */
export const isGyro = (): boolean => /^\/gyro(\/|$)/.test(window.location.pathname)
