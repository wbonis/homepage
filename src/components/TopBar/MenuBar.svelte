<script lang="ts">
	import LaptopIcon from '~icons/mdi/laptop';
	import { click_outside, elevation, focus_outside } from '🍎/actions';
	import { trackEvent } from '🍎/helpers/tracking';
	import { menubar_state } from '🍎/state/menubar.svelte';
	import { apps } from '🍎/state/apps.svelte';
	import type { AppID } from '🍎/state/apps.svelte';
	import { screen_overlay } from '🍎/state/screen-overlay.svelte';
	import Menu from './Menu.svelte';

	function handle_menu_action(key: string) {
		menubar_state.active = '';

		const action_map: Record<string, () => void> = {
			// Default menu (WBonis)
			'about-site': () => open_app('about-me'),
			'contact-me': () => open_app('contact'),
			'view-notes': () => open_app('notes'),

			// File menu
			'new-finder-window': () => open_app('finder'),

			// Apple menu
			'about-this-mac': () => (screen_overlay.mode = 'about'),
			'system-preferences': () => open_app('wallpapers'),
			'app-store': () => open_app('appstore'),
			'force-quit': () => close_all_apps(),
			sleep: () => (screen_overlay.mode = 'sleep'),
			restart: () => location.reload(),
			shutdown: () => (screen_overlay.mode = 'shutdown'),
			'lock-screen': () => (screen_overlay.mode = 'lock'),
			logout: () => location.reload(),

			// Help menu
			'send-finder-feedback': () => window.open('mailto:bonis@bonis.de'),
			'macos-help': () => window.open('https://github.com/wbonis/homepage', '_blank'),

			// Go menu
			home: () => open_app('finder'),
			applications: () => open_app('finder'),
			desktop: () => close_all_apps(),

			// Edit menu
			'show-clipboard': () => show_clippy(),

			// Window menu
			'bring-all-to-front': () => reset_z_indices(),
		};

		trackEvent('Menu', 'click', key);
		action_map[key]?.();
	}

	function open_app(id: AppID) {
		apps.open[id] = true;
		apps.active = id;
	}

	function close_all_apps() {
		for (const id of Object.keys(apps.open) as AppID[]) {
			apps.open[id] = false;
		}
	}

	let clippy_visible = $state(false);

	const clippy_messages = [
		"It looks like you're building a portfolio.\nWould you like help with that?",
		"It looks like you're browsing a fake Mac.\nWould you like to buy a real one?",
		"It looks like you're looking for the clipboard.\nI ate it. Sorry.",
		"It looks like you're clicking random menu items.\nI respect the hustle.",
		"Did you know? The clipboard was invented in 1983.\nI made that up.",
		"Your clipboard is empty.\nJust like my soul.",
		"404: Clipboard not found.\nHave you tried turning it off and on again?",
	];

	function show_clippy() {
		trackEvent('EasterEgg', 'found', 'clippy');
		clippy_visible = true;
	}

	function hide_clippy() {
		clippy_visible = false;
	}

	function get_random_message() {
		return clippy_messages[Math.floor(Math.random() * clippy_messages.length)];
	}

	function reset_z_indices() {
		let z = 0;
		for (const id of Object.keys(apps.z_indices) as AppID[]) {
			if (apps.open[id]) {
				apps.z_indices[id] = ++z;
			}
		}
		apps.active_z_index = z;
	}
</script>

<div
	class="container"
	use:click_outside={() => (menubar_state.active = '')}
	use:focus_outside={() => (menubar_state.active = '')}
>
	{#each Object.entries(menubar_state.menus) as [menuID, menuConfig]}
		<div class:secondary-menu={!['apple', 'default', 'file'].includes(menuID)}>
			<div style:height="100%">
				<button
					class="menu-button"
					class:default-menu={menuID === 'default'}
					class:apple-icon-button={menuID === 'apple'}
					style:--scale={menubar_state.active === menuID ? 1 : 0}
					onclick={() => (menubar_state.active = menuID)}
					onmouseover={() => menubar_state.active && (menubar_state.active = menuID)}
					onfocus={() => (menubar_state.active = menuID)}
				>
					{#if menuID === 'apple'}
						<LaptopIcon />
					{:else}
						{menuConfig.title}
					{/if}
				</button>
			</div>

			<div
				class="menu-parent"
				style:visibility={menubar_state.active === menuID ? 'visible' : 'hidden'}
				use:elevation={'menubar-menu-parent'}
			>
				<Menu menu={menuConfig.menu} onaction={handle_menu_action} />
			</div>
		</div>
	{/each}
</div>

{#if clippy_visible}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="clippy-backdrop" onclick={hide_clippy}>
		<div class="clippy-container" onclick={(e) => e.stopPropagation()}>
			<div class="clippy-character">📎</div>
			<div class="clippy-bubble">
				<p class="clippy-text">{get_random_message()}</p>
				<button class="clippy-btn" onclick={hide_clippy}>Go away, Clippy</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.container {
		height: 100%;

		display: flex;
		position: relative;
		min-width: 0;
	}

	@media (max-width: 576px) {
		.secondary-menu {
			display: none;
		}
	}

	.menu-parent {
		position: absolute;
		margin-top: 1.5px;
	}

	.menu-button {
		font-weight: 500;

		border-radius: 0.25rem;

		position: relative;
		z-index: 1;

		padding: 0 0.5rem;

		height: 100%;

		&.default-menu {
			font-weight: 600 !important;
			margin: 0 6px;
		}

		&::after {
			content: '';

			position: absolute;
			top: 0;
			left: 0;
			z-index: -1;

			height: 100%;
			width: 100%;

			border-radius: inherit;

			transform: scale(var(--scale), var(--scale));
			transform-origin: center center;

			transition: transform 100ms ease;

			background-color: hsla(var(--system-color-dark-hsl), 0.2);
		}
	}

	.apple-icon-button {
		margin: 0 0rem 0 0.5rem;
		padding: 0 0.7rem;

		display: block;

		:global(svg) {
			font-size: 1rem;
		}
	}

	.clippy-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		padding: 2rem;
		animation: clippy-fade-in 200ms ease;
	}

	.clippy-container {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		animation: clippy-bounce-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.clippy-character {
		font-size: 4rem;
		line-height: 1;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
		animation: clippy-wobble 2s ease-in-out infinite;
	}

	.clippy-bubble {
		background: #ffffcc;
		border: 2px solid #333;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		max-width: 280px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		position: relative;
		color: #333;

		&::before {
			content: '';
			position: absolute;
			bottom: 12px;
			left: -10px;
			border: 6px solid transparent;
			border-right-color: #333;
		}

		&::after {
			content: '';
			position: absolute;
			bottom: 13px;
			left: -6px;
			border: 5px solid transparent;
			border-right-color: #ffffcc;
		}
	}

	.clippy-text {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		line-height: 1.4;
		white-space: pre-line;
	}

	.clippy-btn {
		background: linear-gradient(to bottom, #f0f0f0, #d0d0d0);
		border: 1px solid #999;
		border-radius: 4px;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		cursor: pointer;
		color: #333;
		font-family: inherit;

		&:hover {
			background: linear-gradient(to bottom, #e0e0e0, #c0c0c0);
		}

		&:active {
			background: linear-gradient(to bottom, #c0c0c0, #d0d0d0);
		}
	}

	@keyframes clippy-fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes clippy-bounce-in {
		from { transform: translateY(100px) scale(0.5); opacity: 0; }
		to { transform: translateY(0) scale(1); opacity: 1; }
	}

	@keyframes clippy-wobble {
		0%, 100% { transform: rotate(0deg); }
		25% { transform: rotate(5deg); }
		75% { transform: rotate(-5deg); }
	}
</style>
