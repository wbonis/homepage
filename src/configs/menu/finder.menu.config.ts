import { create_menu_config } from '🍎/helpers/create-menu-config';

export const finder_menu_config = create_menu_config({
	default: {
		title: 'WBonis',
		menu: {
			'about-site': {
				title: 'Über diese Seite',
				breakAfter: true,
			},
			'contact-me': {
				title: 'Kontakt',
			},
			'view-notes': {
				title: 'Notizen anzeigen',
				breakAfter: true,
			},
			'hide-finder': {
				title: 'Finder ausblenden',
			},
			'hide-others': {
				title: 'Andere ausblenden',
			},
			'show-all': {
				title: 'Alle einblenden',
				disabled: true,
			},
		},
	},

	file: {
		title: 'Ablage',
		menu: {
			'new-finder-window': {
				title: 'Neues Finder-Fenster',
			},
			'new-folder': {
				title: 'Neuer Ordner',
			},
			'new-folder-with-selection': {
				title: 'Neuer Ordner mit Auswahl',
				disabled: true,
			},
			'new-smart-folder': {
				title: 'Neuer intelligenter Ordner',
			},
			'new-tab': {
				title: 'Neuer Tab',
			},
			open: {
				title: 'Öffnen',
				disabled: true,
			},
			'open-with': {
				title: 'Öffnen mit',
				disabled: true,
			},
			print: {
				title: 'Drucken',
				disabled: true,
			},
			'close-window': {
				title: 'Fenster schließen',
				disabled: true,
				breakAfter: true,
			},

			'get-info': {
				title: 'Informationen',
			},
			rename: {
				title: 'Umbenennen',
				disabled: true,
				breakAfter: true,
			},

			compress: {
				title: 'Komprimieren',
				disabled: true,
				breakAfter: true,
			},

			duplicate: {
				title: 'Duplizieren',
				disabled: true,
			},
			'make-alias': {
				title: 'Alias erzeugen',
				disabled: true,
			},
			'quick-look': {
				title: 'Übersicht',
				disabled: true,
			},
			'show-original': {
				title: 'Original zeigen',
				disabled: true,
			},
			'add-to-sidebar': {
				title: 'Zur Seitenleiste hinzufügen',
				disabled: true,
				breakAfter: true,
			},

			'move-to-trash': {
				title: 'In den Papierkorb legen',
				disabled: true,
			},
			eject: {
				title: 'Auswerfen',
				disabled: true,
				breakAfter: true,
			},

			find: {
				title: 'Suchen',
				breakAfter: true,
			},

			tags: {
				title: 'Tags …',
				disabled: true,
			},
		},
	},

	edit: {
		title: 'Bearbeiten',
		menu: {
			undo: {
				title: 'Widerrufen',
				disabled: true,
			},
			redo: {
				title: 'Wiederholen',
				disabled: true,
				breakAfter: true,
			},

			cut: {
				title: 'Ausschneiden',
				disabled: true,
			},
			copy: {
				title: 'Kopieren',
				disabled: true,
			},
			paste: {
				title: 'Einsetzen',
				disabled: true,
			},
			'select-all': {
				title: 'Alles auswählen',
				disabled: true,
				breakAfter: true,
			},

			'show-clipboard': {
				title: 'Zwischenablage einblenden',
				breakAfter: true,
			},

			'start-dictation': {
				title: 'Diktat starten …',
			},
			'emoji-and-symbols': {
				title: 'Emoji & Symbole',
			},
		},
	},

	view: {
		title: 'Darstellung',
		menu: {
			'as-icons': {
				title: 'Als Symbole',
				disabled: true,
			},
			'as-list': {
				title: 'Als Liste',
				disabled: true,
			},
			'as-columns': {
				title: 'Als Spalten',
				disabled: true,
			},
			'as-gallery': {
				title: 'Als Galerie',
				disabled: true,
				breakAfter: true,
			},

			'use-stacks': {
				title: 'Stapel verwenden',
			},
			'sort-by': {
				title: 'Sortieren nach',
				menu: {},
			},
			'clean-up': {
				title: 'Aufräumen',
				disabled: true,
			},
			'clean-up-by': {
				title: 'Aufräumen nach',
				disabled: true,
				breakAfter: true,
				menu: {},
			},

			'hide-sidebar': {
				title: 'Seitenleiste ausblenden',
				disabled: true,
			},
			'show-preview': {
				title: 'Vorschau einblenden',
				disabled: true,
				breakAfter: true,
			},

			'hide-toolbar': {
				title: 'Symbolleiste ausblenden',
				disabled: true,
			},
			'show-all-tabs': {
				title: 'Alle Tabs anzeigen',
				disabled: true,
			},
			'show-tab-bar': {
				title: 'Tab-Leiste einblenden',
				disabled: true,
			},
			'show-path-bar': {
				title: 'Pfadleiste einblenden',
				disabled: true,
			},
			'show-status-bar': {
				title: 'Statusleiste einblenden',
				disabled: true,
				breakAfter: true,
			},

			'customize-toolbar': {
				title: 'Symbolleiste anpassen …',
				disabled: true,
				breakAfter: true,
			},

			'show-view-options': {
				title: 'Darstellungsoptionen einblenden',
			},
			'show-preview-options': {
				title: 'Vorschauoptionen einblenden',
				disabled: true,
				breakAfter: true,
			},

			'enter-full-screen': {
				title: 'Vollbild',
				disabled: true,
			},
		},
	},

	go: {
		title: 'Gehe zu',
		menu: {
			back: {
				title: 'Zurück',
				disabled: true,
			},
			forward: {
				title: 'Vor',
				disabled: true,
			},
			'enclosing-folder': {
				title: 'Übergeordneter Ordner',
				breakAfter: true,
			},

			recents: {
				title: 'Zuletzt benutzt',
			},
			documents: {
				title: 'Dokumente',
			},
			desktop: {
				title: 'Schreibtisch',
			},
			downloads: {
				title: 'Downloads',
			},
			home: {
				title: 'Benutzerordner',
			},
			computer: {
				title: 'Computer',
			},
			airdrop: {
				title: 'AirDrop',
			},
			network: {
				title: 'Netzwerk',
			},
			'icloud-drive': {
				title: 'iCloud Drive',
			},
			applications: {
				title: 'Programme',
			},
			utilities: {
				title: 'Dienstprogramme',
				breakAfter: true,
			},

			'go-to-folder': {
				title: 'Gehe zum Ordner',
			},
			'connect-to-server': {
				title: 'Mit Server verbinden',
			},
		},
	},

	window: {
		title: 'Fenster',
		menu: {
			minimize: {
				title: 'Im Dock ablegen',
				disabled: true,
			},
			zoom: {
				title: 'Zoomen',
				disabled: true,
			},
			'move-window-to-left-side-of-screen': {
				title: 'Fenster links anordnen',
				disabled: true,
			},
			'move-window-to-right-side-of-screen': {
				title: 'Fenster rechts anordnen',
				disabled: true,
			},
			'cycle-through-windows': {
				title: 'Durch Fenster blättern',
				breakAfter: true,
			},

			'show-previous-tab': {
				title: 'Vorherigen Tab anzeigen',
				disabled: true,
			},
			'show-next-tab': {
				title: 'Nächsten Tab anzeigen',
				disabled: true,
			},
			'move-tab-to-new-window': {
				title: 'Tab in neues Fenster bewegen',
				disabled: true,
			},
			'merge-all-windows': {
				title: 'Alle Fenster zusammenführen',
				disabled: true,
				breakAfter: true,
			},

			'bring-all-to-front': {
				title: 'Alle nach vorne bringen',
			},
		},
	},

	help: {
		title: 'Hilfe',
		menu: {
			'send-finder-feedback': {
				title: 'Finder-Feedback senden',
				breakAfter: true,
			},
			'macos-help': {
				title: 'macOS-Hilfe',
			},
		},
	},
});
