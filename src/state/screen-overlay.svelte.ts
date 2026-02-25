export type OverlayMode = 'none' | 'sleep' | 'lock' | 'shutdown' | 'about';

export const screen_overlay = $state({
	mode: 'none' as OverlayMode,
});
