export type DeviceType = 'phone' | 'tablet' | 'desktop';

export function detectDeviceType(): DeviceType {
	const vw = window.innerWidth;
	const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

	if (vw < 768 && isTouchDevice) return 'phone';
	if (vw >= 768 && vw < 1024 && isTouchDevice) return 'tablet';
	return 'desktop';
}
