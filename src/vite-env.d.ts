/// <reference types="vite/client" />

// gsap ships no types for the lighter-weight subpath entry; reuse the main ones.
declare module 'gsap/gsap-core' {
  export * from 'gsap';
}
