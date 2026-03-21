<script lang="ts">
	import {
		bounds,
		BoundsFrom,
		Compartment,
		ControlFrom,
		controls,
		disabled,
		draggable,
		events,
		position,
	} from '@neodrag/svelte';
	import { onMount, untrack } from 'svelte';
	import { sineInOut } from 'svelte/easing';
	import { elevation } from '🍎/actions';
	import { apps_config } from '🍎/configs/apps/apps-config.ts';
	import { rand_int } from '🍎/helpers/random.ts';
	import { sleep } from '🍎/helpers/sleep';
	import { trackEvent } from '🍎/helpers/tracking';
	import { apps, type AppID } from '🍎/state/apps.svelte.ts';
	import { preferences } from '🍎/state/preferences.svelte.ts';

	import AppNexus from '../../apps/AppNexus.svelte';
	import TrafficLights from './TrafficLights.svelte';

	const { app_id }: { app_id: AppID } = $props();

	let dragging_enabled = $state(true);

	let is_maximized = $state(false);
	let minimized_transform = $state<string>();

	let windowEl = $state<HTMLElement>();

	const { height, width, resizable } = apps_config[app_id];

	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const is_mobile = vw < 768;
	const is_tablet = vw >= 768 && vw < 1024;

	const remModifier = +height * 1.2 >= vh ? 24 : 16;

	// Clamp height to available viewport (minus top bar)
	const maxHeightRem = (vh - 28) / 16;
	const rawHeightRem = +height / remModifier;
	const clampedHeightRem = Math.min(rawHeightRem, maxHeightRem);

	// Clamp width to viewport on smaller screens
	const rawWidthRem = +width / remModifier;
	const maxWidthRem = (vw - 16) / 16;
	const clampedWidthRem = is_mobile ? maxWidthRem : Math.min(rawWidthRem, maxWidthRem);

	// Reduce random spread on smaller screens, eliminate on mobile
	const spreadX = is_mobile ? 0 : is_tablet ? 50 : 600;
	const spreadY = is_mobile ? 0 : is_tablet ? 30 : 100;
	const randX = rand_int(-spreadX, spreadX);
	const randY = rand_int(-spreadY, spreadY);

	// On mobile, position at origin (will be maximized). On tablet, center within viewport.
	let defaultPosition = is_mobile
		? { x: 0, y: 0 }
		: {
				x: Math.max(8, Math.min((vw / 2 + randX) / 2, vw - clampedWidthRem * 16 - 8)),
				y: Math.max(30, (100 + randY) / 2),
			};

	const disabledComp = Compartment.of(() => disabled(!dragging_enabled));

	$effect(() => {
		apps.active_z_index;

		if (apps.active === app_id) {
			untrack(() => (apps.z_indices[app_id] = apps.active_z_index));
		}
	});

	function focusApp() {
		apps.active = app_id;
	}

	function windowCloseTransition(
		el: HTMLElement,
		{ duration = preferences.reduced_motion ? 0 : 300 }: SvelteTransitionConfig = {},
	): SvelteTransitionReturnType {
		const existingTransform = getComputedStyle(el).transform;

		return {
			duration,
			easing: sineInOut,
			css: (t) => `opacity: ${t}; transform: ${existingTransform} scale(${t})`,
		};
	}

	async function maximizeApp() {
		if (!preferences.reduced_motion) {
			windowEl.style.transition = 'height 0.3s ease, width 0.3s ease, transform 0.3s ease';
		}

		if (!is_maximized) {
			dragging_enabled = false;

			minimized_transform = windowEl.style.transform;
			windowEl.style.transform = `translate(0px, 0px)`;

			windowEl.style.width = `100%`;
			// windowEl.style.height = 'calc(100vh - 1.7rem - 5.25rem)';
			windowEl.style.height = 'calc(100dvh - 1.7rem)';
		} else {
			dragging_enabled = true;
			windowEl.style.transform = minimized_transform;

			windowEl.style.width = `${clampedWidthRem}rem`;
			windowEl.style.height = `${clampedHeightRem}rem`;
		}

		is_maximized = !is_maximized;

		apps.fullscreen[app_id] = is_maximized;

		await sleep(300);

		if (!preferences.reduced_motion) windowEl.style.transition = '';
	}

	function closeApp() {
		trackEvent('App', 'close', app_id);
		apps.open[app_id] = false;
		apps.fullscreen[app_id] = false;
	}

	function onAppDragStart() {
		focusApp();
		apps.is_being_dragged = true;
	}

	function onAppDragEnd() {
		apps.is_being_dragged = false;
	}

	function onResizeStart(e: PointerEvent) {
		if (!resizable) return;
		e.preventDefault();
		e.stopPropagation();
		focusApp();

		const startX = e.clientX;
		const startY = e.clientY;
		const startW = windowEl.offsetWidth;
		const startH = windowEl.offsetHeight;

		function onPointerMove(ev: PointerEvent) {
			const newW = Math.max(240, startW + (ev.clientX - startX));
			const newH = Math.max(160, startH + (ev.clientY - startY));
			windowEl.style.width = `${newW}px`;
			windowEl.style.height = `${newH}px`;
		}

		function onPointerUp() {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		}

		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
	}

	onMount(() => {
		windowEl?.focus();

		// Auto-maximize on mobile
		if (is_mobile && windowEl) {
			dragging_enabled = false;
			is_maximized = true;
			apps.fullscreen[app_id] = true;
			windowEl.style.transform = `translate(0px, 0px)`;
			windowEl.style.width = `100%`;
			windowEl.style.height = 'calc(100dvh - 1.7rem)';
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
	role="application"
	class="container"
	class:dark={preferences.theme.scheme === 'dark'}
	class:active={apps.active === app_id}
	class:resizable
	style:width="{clampedWidthRem}rem"
	style:height="{clampedHeightRem}rem"
	style:z-index={apps.z_indices[app_id]}
	tabindex="-1"
	bind:this={windowEl}
	{@attach draggable(() => [
		controls({ allow: ControlFrom.selector('.app-window-drag-handle') }),
		bounds(
			BoundsFrom.viewport(
				is_tablet
					? { bottom: -200, top: 27.2, left: -100, right: -100 }
					: { bottom: -6000, top: 27.2, left: -6000, right: -6000 },
			),
		),
		disabledComp,
		position({ default: defaultPosition }),
		events({ onDragStart: onAppDragStart, onDragEnd: onAppDragEnd }),
	])}
	onclick={focusApp}
	onkeydown={() => {}}
	out:windowCloseTransition
>
	<div class="tl-container {app_id}" use:elevation={'window-traffic-lights'}>
		<TrafficLights {app_id} on_minimize_click={closeApp} on_maximize_click={maximizeApp} on_close_app={closeApp} />
	</div>

	<AppNexus {app_id} is_being_dragged={apps.is_being_dragged} />

	{#if resizable}
		<div class="resize-handle" role="separator" aria-label="Resize window" onpointerdown={onResizeStart}></div>
	{/if}
</section>

<style>
	.container {
		--elevated-shadow: 0px 8.5px 10px rgba(0, 0, 0, 0.115), 0px 68px 80px rgba(0, 0, 0, 0.23);

		width: 100%;
		height: 100%;

		display: grid;
		grid-template-rows: 1fr;

		position: absolute;

		border-radius: 0.75rem;
		box-shadow: var(--elevated-shadow);

		cursor: var(--system-cursor-default), auto;

		&.active {
			/* // --elevated-shadow: 0px 6.7px 12px rgba(0, 0, 0, 0.218), 0px 22.3px 40.2px rgba(0, 0, 0, 0.322),
      //   0px 100px 180px rgba(0, 0, 0, 0.54); */
			--elevated-shadow: 0px 8.5px 10px rgba(0, 0, 0, 0.28), 0px 68px 80px rgba(0, 0, 0, 0.56);
		}

		&.resizable {
			overflow: hidden;
		}

		&.dark {
			& > :global(section),
			& > :global(div) {
				border-radius: inherit;
				box-shadow:
					inset 0 0 0 0.9px hsla(var(--system-color-dark-hsl), 0.3),
					0 0 0 1px hsla(var(--system-color-light-hsl), 0.5),
					var(--elevated-shadow);
			}
		}
	}

	.tl-container {
		position: absolute;
		top: 1rem;
		left: 1rem;

		/* // Necessary, as `.container` tries to apply shadow on it */
		box-shadow: none !important;
	}

	.resize-handle {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 16px;
		height: 16px;
		cursor: nwse-resize;
		z-index: 10;
	}
</style>
