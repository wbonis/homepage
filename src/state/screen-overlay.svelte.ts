export type OverlayMode = 'none' | 'sleep' | 'lock' | 'shutdown' | 'about' | 'vram-corrupt' | 'kernel-panic' | 'bug-report';

export const screen_overlay = $state({
	mode: 'none' as OverlayMode,
});

let glitch_running = false;

export function trigger_glitch() {
	if (glitch_running || screen_overlay.mode !== 'none') return;
	glitch_running = true;

	// Phase 1: Subtle VRAM corruption creeps in (0–6s)
	screen_overlay.mode = 'vram-corrupt';

	// Phase 2: Gentle screen shake joins (6–9.5s)
	setTimeout(() => {
		document.body.classList.add('glitch-active');
	}, 6000);

	// Phase 3: Kernel panic (9.5s)
	setTimeout(() => {
		document.body.classList.remove('glitch-active');
		screen_overlay.mode = 'kernel-panic';
		glitch_running = false;
	}, 9500);
}
