export const breakPoint = 768;
export const isMobile = (): boolean => window.matchMedia(`(max-width: ${breakPoint}px)`).matches;
