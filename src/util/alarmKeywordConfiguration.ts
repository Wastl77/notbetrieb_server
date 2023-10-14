import { KeywordConfiguration } from '../../types.js';

export const alarmKeywordConfiguration: Record<string, KeywordConfiguration> = {
	F1: { type: 'alarmkeyword', units: ['c-di', 'hlf', 'dlk'] },
	F2: {
		type: 'alarmkeyword',
		allowedAdditions: ['Residential', 'Basement'],
		units: ['c-di', 'hlf', 'hlf', 'dlk'],
	},
	Residential: { type: 'addition', units: ['gw-mess', 'rtw'] },
	Basement: { type: 'addition', units: ['gw-mess', 'ab-slm'] },
	rtw: { type: 'module', units: ['rtw'] },
	hlf: { type: 'module', units: ['hlf'] },
	'gw-mess': { type: 'module', units: ['gw-mess'] },
	'c-di': { type: 'module', units: ['c-di'] },
	drohne: { type: 'module', units: ['gw-mess', 'c-di'] },
	// Weitere Konfigurationsdaten hier hinzufügen...
};
