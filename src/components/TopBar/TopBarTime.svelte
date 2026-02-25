<script lang="ts">
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { create_interval } from '🍎/state/interval.svelte';

	const time = create_interval(1000);
</script>

<div class="time-display">
	<span class="date-part">{format(time.value, 'EEE dd. MMM', { locale: de })}</span>
	&nbsp;{format(time.value, 'HH:mm')}
</div>

<style>
	.time-display {
		margin: 0 0.5rem;
		white-space: nowrap;
	}

	@media (max-width: 480px) {
		.date-part {
			display: none;
		}
	}
</style>
