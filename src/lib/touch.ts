/** True on a touchscreen. Read once: a phone does not grow a mouse mid-session. */
export function isTouchOnly(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
}
