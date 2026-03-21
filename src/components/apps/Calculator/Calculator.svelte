<script lang="ts">
	import Plus from '~icons/ic/outline-plus';
	import Equal from '~icons/ic/round-equals';
	import Minus from '~icons/ic/round-minus';
	import PlusMinus from '~icons/majesticons/plus-minus-2';
	import Division from '~icons/ph/divide-bold';
	import Multiply from '~icons/uil/multiply';

	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	let display_value = $state('0');
	let first_operand: number | null = $state(null);
	let operator: string | null = $state(null);
	let waiting_for_second = $state(false);

	function input_digit(digit: string) {
		if (waiting_for_second) {
			display_value = digit;
			waiting_for_second = false;
		} else {
			display_value = display_value === '0' ? digit : display_value + digit;
		}
	}

	function input_decimal() {
		if (waiting_for_second) {
			display_value = '0.';
			waiting_for_second = false;
			return;
		}
		if (!display_value.includes('.')) {
			display_value += '.';
		}
	}

	function clear_all() {
		display_value = '0';
		first_operand = null;
		operator = null;
		waiting_for_second = false;
	}

	function toggle_sign() {
		if (display_value !== '0') {
			display_value = display_value.startsWith('-')
				? display_value.slice(1)
				: '-' + display_value;
		}
	}

	function input_percent() {
		display_value = String(parseFloat(display_value) / 100);
	}

	function perform_operation(next_op: string) {
		const current = parseFloat(display_value);

		if (first_operand !== null && operator && !waiting_for_second) {
			const result = calculate(first_operand, current, operator);
			display_value = format_result(result);
			first_operand = result;
		} else {
			first_operand = current;
		}

		operator = next_op;
		waiting_for_second = true;
	}

	function handle_equals() {
		if (first_operand === null || !operator) return;

		const current = parseFloat(display_value);
		const result = calculate(first_operand, current, operator);
		display_value = format_result(result);
		first_operand = null;
		operator = null;
		waiting_for_second = false;
	}

	function calculate(a: number, b: number, op: string): number {
		switch (op) {
			case '+': return a + b;
			case '-': return a - b;
			case '*': return a * b;
			case '/': return b !== 0 ? a / b : NaN;
			default: return b;
		}
	}

	function format_result(n: number): string {
		if (!isFinite(n)) return 'Error';
		const s = String(n);
		if (s.length > 12) {
			return Number(n.toPrecision(10)).toString();
		}
		return s;
	}

	const display_font_size = $derived(
		display_value.length > 9 ? '1.8rem' : display_value.length > 6 ? '2.2rem' : '3rem',
	);
</script>

<section class="container">
	{#if !ios_mode}
		<header class="app-window-drag-handle"></header>
	{/if}

	<section class="show-area" style:font-size={display_font_size} role="status" aria-live="polite" aria-label="Calculator display">{display_value}</section>

	<section class="buttons-container">
		<button class="top-row-button" onclick={clear_all}> AC </button>
		<button class="top-row-button" onclick={toggle_sign}>
			<PlusMinus />
		</button>
		<button class="top-row-button" onclick={input_percent}> % </button>
		<button class="operation-button" class:active-op={operator === '/' && waiting_for_second} onclick={() => perform_operation('/')}>
			<Division />
		</button>
		<button class="number-button" onclick={() => input_digit('7')}> 7 </button>
		<button class="number-button" onclick={() => input_digit('8')}> 8 </button>
		<button class="number-button" onclick={() => input_digit('9')}> 9 </button>
		<button class="operation-button" class:active-op={operator === '*' && waiting_for_second} onclick={() => perform_operation('*')}>
			<Multiply />
		</button>
		<button class="number-button" onclick={() => input_digit('4')}> 4 </button>
		<button class="number-button" onclick={() => input_digit('5')}> 5 </button>
		<button class="number-button" onclick={() => input_digit('6')}> 6 </button>
		<button class="operation-button" class:active-op={operator === '-' && waiting_for_second} onclick={() => perform_operation('-')}>
			<Minus />
		</button>
		<button class="number-button" onclick={() => input_digit('1')}> 1 </button>
		<button class="number-button" onclick={() => input_digit('2')}> 2 </button>
		<button class="number-button" onclick={() => input_digit('3')}> 3 </button>
		<button class="operation-button" class:active-op={operator === '+' && waiting_for_second} onclick={() => perform_operation('+')}>
			<Plus />
		</button>
		<button class="number-button curved-bottom-left-button" style:grid-column="1 / span 2" onclick={() => input_digit('0')}>
			0
		</button>
		<button class="number-button" onclick={input_decimal}> . </button>
		<button class="operation-button curved-bottom-right-button" onclick={handle_equals}> <Equal /> </button>
	</section>
</section>

<style>
	header {
		padding: 1rem;
	}

	.container {
		height: 100%;
		width: 100%;

		background-color: hsla(240, 5%, 12%, 0.7);
		backdrop-filter: blur(15px);

		border-radius: inherit;

		display: flex;
		flex-direction: column;

		font-family: var(--system-font-family) !important;
	}

	.buttons-container {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(5, 1fr);
		gap: 1px;

		margin: 1.5px;

		& > button {
			font-size: 1.6rem;
			font-weight: 400 !important;
			color: white;
			fill: white;
			cursor: pointer;
			transition: opacity 100ms ease;
			min-height: 0;

			&:active {
				opacity: 0.6;
			}
		}

		:global(svg) {
			font-size: 1.4rem;
		}
	}

	.top-row-button {
		background-color: hsla(240, 5%, 12%, 0.2);
	}

	.number-button {
		background-color: hsla(240, 5%, 80%, 0.25);
	}

	.operation-button {
		background-color: hsl(37deg 98% 51%);
	}

	.active-op {
		background-color: white;
		color: hsl(37deg 98% 51%) !important;
		fill: hsl(37deg 98% 51%) !important;
	}

	.curved-bottom-left-button {
		border-radius: 0 0 0 0.7rem;
	}

	.curved-bottom-right-button {
		border-radius: 0 0 0.7rem 0;
	}

	.show-area {
		font-size: 3rem;
		color: white;
		text-align: end;
		font-weight: 200;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		padding: 0.5rem 1rem;
	}

	:global(.tl-container.calculator) {
		top: 0.7rem;
		left: 0.7rem;
	}
</style>
