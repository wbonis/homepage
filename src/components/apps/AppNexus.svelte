<script lang="ts">
	import type { AppID } from '🍎/state/apps.svelte';

	const {
		app_id,
		is_being_dragged,
	}: {
		app_id: AppID;
		is_being_dragged: boolean;
	} = $props();
</script>

{#if app_id === 'finder'}
	{#await import('./Finder/Finder.svelte') then module}
		<module.default />
	{/await}
{:else if app_id === 'about-me'}
	{#await import('./AboutMe/AboutMe.svelte') then { default: AboutMe }}
		<AboutMe />
	{/await}
{:else if app_id === 'projects'}
	{#await import('./Projects/Projects.svelte') then { default: Projects }}
		<Projects />
	{/await}
{:else if app_id === 'mail'}
	{#await import('./Mail/Mail.svelte') then { default: Mail }}
		<Mail />
	{/await}
{:else if app_id === 'contact'}
	{#await import('./Contact/Contact.svelte') then { default: Contact }}
		<Contact />
	{/await}
{:else if app_id === 'notes'}
	{#await import('./Notes/Notes.svelte') then { default: Notes }}
		<Notes />
	{/await}
{:else if app_id === 'terminal'}
	{#await import('./Terminal/Terminal.svelte') then { default: Terminal }}
		<Terminal />
	{/await}
{:else if app_id === 'safari'}
	{#await import('./Safari/Safari.svelte') then { default: Safari }}
		<Safari />
	{/await}
{:else if app_id === 'blog'}
	{#await import('./Blog/Blog.svelte') then { default: Blog }}
		<Blog />
	{/await}
{:else if app_id === 'github'}
	{#await import('./GitHub/GitHub.svelte') then { default: GitHub }}
		<GitHub />
	{/await}
{:else if app_id === 'calendar'}
	{#await import('./Calendar/Calendar.svelte') then { default: Calendar }}
		<Calendar />
	{/await}
{:else if app_id === 'calculator'}
	{#await import('./Calculator/Calculator.svelte') then { default: Calculator }}
		<Calculator />
	{/await}
{:else if app_id === 'wallpapers'}
	{#await import('./WallpaperApp/WallpaperSelectorApp.svelte') then { default: WallpaperSelector }}
		<WallpaperSelector />
	{/await}
{:else if app_id === 'vscode'}
	{#await import('./VSCode/VSCode.svelte') then { default: VSCode }}
		<VSCode {is_being_dragged} />
	{/await}
{:else if app_id === 'appstore'}
	{#await import('./AppStoreApp/AppStoreApp.svelte') then { default: AppStoreApp }}
		<AppStoreApp />
	{/await}
{:else}
	{#await import('./AppStore/AppStore.svelte') then { default: AppStore }}
		<AppStore {app_id} />
	{/await}
{/if}
