import { KeywordConfiguration } from '../../types.js';

export const alarmKeywordConfiguration: Record<string, KeywordConfiguration> = {
	F1: { type: 'alarmkeyword', units: ['c-di', 'hlf', 'dlk'] },
	F2: {
		type: 'alarmkeyword',
		allowedAdditions: ['Wohn.', 'WohnY.', 'Keller'],
		units: ['c-di', 'hlf', 'hlf', 'dlk'],
	},
	F3: {
		type: 'alarmkeyword',
		allowedAdditions: ['WohnY.'],
		units: [
			'b-di',
			'c-di',
			'c-di',
			'hlf',
			'hlf',
			'hlf',
			'dlk',
			'gw-mess',
			'rtw',
		],
	},
	'Wohn.': { type: 'addition', units: ['gw-mess', 'rtw'] },
	'WohnY.': { type: 'addition', units: ['rtw', 'nef', 'olrd'] },
	Keller: { type: 'addition', units: ['gw-mess', 'ab-slm'] },
	rtw: { type: 'module', units: ['rtw'] },
	hlf: { type: 'module', units: ['hlf'] },
	'gw-mess': { type: 'module', units: ['gw-mess'] },
	'c-di': { type: 'module', units: ['c-di'] },
	drohne: { type: 'module', units: ['gw-mess', 'c-di'] },
	's-rtw': { type: 'module', units: ['s-rtw'] },
	// Weitere Konfigurationsdaten hier hinzufügen...
};
