<script lang="ts">
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { create_interval } from '🍎/state/interval.svelte';

	const time = create_interval(1000);
</script>

<div style:margin="0 0.5rem">
	{format(time.value, 'EEE dd. MMM', { locale: de })}&nbsp; {format(time.value, 'HH:mm')}
</div>
