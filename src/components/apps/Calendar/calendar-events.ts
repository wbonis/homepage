export interface CalendarEvent {
	title: string;
	time?: string;
	color: string;
	allDay?: boolean;
}

/** Funny one-off meetings to sprinkle across the calendar */
const FUNNY_MEETINGS: Omit<CalendarEvent, 'allDay'>[] = [
	{ title: 'Fix "temporary" Workaround from 2019', time: '10:00', color: '#ff9500' },
	{ title: 'Blame Git History Meeting', time: '11:00', color: '#af52de' },
	{ title: 'Pretend to Understand Kubernetes', time: '14:00', color: '#5856d6' },
	{ title: 'Argue about Tabs vs Spaces', time: '15:00', color: '#ff2d55' },
	{ title: 'Emergency: Prod is Fine (false alarm)', time: '09:30', color: '#ff3b30' },
	{ title: 'Rename Variables for Fun', time: '13:00', color: '#34c759' },
	{ title: 'Rubber Duck Debugging Session', time: '16:00', color: '#007aff' },
	{ title: 'Lunch: Döner or Pizza?', time: '12:00', color: '#ff9500' },
	{ title: 'Rewrite Everything in Rust (again)', time: '10:30', color: '#ff6b35' },
	{ title: 'Deploy on Friday YOLO', time: '16:30', color: '#ff3b30' },
	{ title: 'Stack Overflow Copy-Paste Review', time: '11:00', color: '#af52de' },
	{ title: 'Why is the CI Red?', time: '09:00', color: '#ff2d55' },
	{ title: 'Discussing Microservices at Lunch', time: '12:30', color: '#5ac8fa' },
	{ title: 'Delete node_modules & Pray', time: '14:30', color: '#8e8e93' },
	{ title: 'Convince PM That\'s a Feature', time: '15:00', color: '#34c759' },
	{ title: '"Quick" 5-Minute Sync', time: '10:00', color: '#007aff' },
	{ title: 'Update Dependencies (wish me luck)', time: '11:30', color: '#ff9500' },
	{ title: 'Read Docs We Should\'ve Read Before', time: '13:30', color: '#5856d6' },
	{ title: 'Coffee & Complain about Legacy Code', time: '09:00', color: '#8e8e93' },
	{ title: 'Celebrate Passing Tests Party', time: '17:00', color: '#34c759' },
];

/**
 * Deterministic pseudo-random from a seed so the same day always gets the same events.
 */
function seeded_random(seed: number): number {
	const x = Math.sin(seed * 9301 + 49297) * 49297;
	return x - Math.floor(x);
}

/**
 * Generate events dynamically relative to today so the calendar always looks alive.
 * Returns a Map keyed by "YYYY-MM-DD" for fast lookup.
 */
export function get_events(): Map<string, CalendarEvent[]> {
	const events = new Map<string, CalendarEvent[]>();
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();

	function add(date: Date, event: CalendarEvent) {
		const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		const existing = events.get(key) ?? [];
		existing.push(event);
		events.set(key, existing);
	}

	function getMonday(d: Date): Date {
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(d.getFullYear(), d.getMonth(), diff);
	}

	// Generate 8 weeks of recurring events centered around current month
	const startMonday = getMonday(new Date(year, month, 1));
	startMonday.setDate(startMonday.getDate() - 7);

	let funnyIndex = 0;

	for (let week = 0; week < 8; week++) {
		const mon = new Date(startMonday);
		mon.setDate(startMonday.getDate() + week * 7);

		// Tuesday 14:00 — Jour Fixe (real)
		const tue = new Date(mon);
		tue.setDate(mon.getDate() + 1);
		add(tue, { title: 'Jour Fixe', time: '14:00', color: '#007aff' });

		// Thursday — Technik Meetup (whole day, real)
		const thu = new Date(mon);
		thu.setDate(mon.getDate() + 3);
		add(thu, { title: 'Technik Meetup', color: '#ff9500', allDay: true });

		// Sprinkle funny meetings on Mon, Wed, Fri
		const seed = mon.getFullYear() * 1000 + mon.getMonth() * 50 + mon.getDate() + week;

		// Monday — ~60% chance
		if (seeded_random(seed) > 0.4) {
			add(mon, FUNNY_MEETINGS[funnyIndex % FUNNY_MEETINGS.length]);
			funnyIndex++;
		}

		// Wednesday
		const wed = new Date(mon);
		wed.setDate(mon.getDate() + 2);
		if (seeded_random(seed + 1) > 0.3) {
			add(wed, FUNNY_MEETINGS[funnyIndex % FUNNY_MEETINGS.length]);
			funnyIndex++;
		}

		// Friday
		const fri = new Date(mon);
		fri.setDate(mon.getDate() + 4);
		if (seeded_random(seed + 2) > 0.5) {
			add(fri, FUNNY_MEETINGS[funnyIndex % FUNNY_MEETINGS.length]);
			funnyIndex++;
		}

		// Saturday — rare (~20%)
		const sat = new Date(mon);
		sat.setDate(mon.getDate() + 5);
		if (seeded_random(seed + 3) > 0.8) {
			add(sat, FUNNY_MEETINGS[funnyIndex % FUNNY_MEETINGS.length]);
			funnyIndex++;
		}
	}

	return events;
}
