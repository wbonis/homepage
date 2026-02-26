export const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
export const DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
export const DAYS_OF_THE_WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
export const MONTHS = [
	'JAN',
	'FEB',
	'MÄR',
	'APR',
	'MAI',
	'JUN',
	'JUL',
	'AUG',
	'SEP',
	'OKT',
	'NOV',
	'DEZ',
] as const;
export const NUMBER_OF_CELLS_IN_CALENDAR = 42; // 6 rows x 7 columns
