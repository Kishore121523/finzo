export function haptic(style: 'light' | 'medium' | 'success' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  switch (style) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(20);
      break;
    case 'success':
      navigator.vibrate([10, 50, 10]);
      break;
  }
}
