/**
 * Haptic Feedback Service
 * Provides haptic feedback for mobile devices
 */

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 */
export function triggerHaptic(pattern: number | number[] = 10): void {
  if (isHapticSupported()) {
    navigator.vibrate(pattern);
  }
}

/**
 * Haptic patterns for different events
 */
export const HapticPatterns = {
  success: [10, 50, 10],
  error: [20, 50, 20, 50, 20],
  warning: [15, 30, 15],
  light: 5,
  medium: 10,
  heavy: 20,
  double: [10, 50, 10],
  triple: [10, 50, 10, 50, 10]
};

/**
 * Trigger success haptic
 */
export function hapticSuccess(): void {
  triggerHaptic(HapticPatterns.success);
}

/**
 * Trigger error haptic
 */
export function hapticError(): void {
  triggerHaptic(HapticPatterns.error);
}

/**
 * Trigger warning haptic
 */
export function hapticWarning(): void {
  triggerHaptic(HapticPatterns.warning);
}

/**
 * Trigger light haptic
 */
export function hapticLight(): void {
  triggerHaptic(HapticPatterns.light);
}

/**
 * Trigger medium haptic
 */
export function hapticMedium(): void {
  triggerHaptic(HapticPatterns.medium);
}

/**
 * Trigger heavy haptic
 */
export function hapticHeavy(): void {
  triggerHaptic(HapticPatterns.heavy);
}

