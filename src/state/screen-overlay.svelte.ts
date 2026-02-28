export type OverlayMode = 'none' | 'sleep' | 'lock' | 'shutdown' | 'about' | 'vram-corrupt' | 'kernel-panic' | 'bug-report';

export const screen_overlay = $state({
	mode: 'none' as OverlayMode,
});

let glitch_running = false;

export function trigger_glitch() {
	if (glitch_running || screen_overlay.mode !== 'none') return;
	glitch_running = true;

	// Phase 1: VRAM corruption (0–1.5s)
	screen_overlay.mode = 'vram-corrupt';

	// Phase 2: Add screen shake (1.5–4s)
	setTimeout(() => {
		document.body.classList.add('glitch-active');
	}, 1500);

	// Phase 3: Kernel panic (4s)
	setTimeout(() => {
		document.body.classList.remove('glitch-active');
		screen_overlay.mode = 'kernel-panic';
		glitch_running = false;
	}, 4000);
}
