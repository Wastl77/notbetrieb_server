import { expect, test } from 'vitest';
import { upgradeAlarmkeyword } from './upgradeAlarmkeyword.js';

test('returns the correct new units array when given the original keyword + the new keyword', () => {
	const newKeyword = 'F2[Wohn.]+F3[WohnY.]';
	const originalKeyword = 'F2[Wohn.]';

	const expectedResourcesArray = [
		'b-di',
		'c-di',
		'c-di',
		'hlf',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'rtw',
		'nef',
		'olrd',
	];

	const result = upgradeAlarmkeyword(originalKeyword, newKeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('returns the correct new units array when only given the new keyword', () => {
	const newKeyword = 'F3[WohnY.]';
	const originalKeyword = 'F2[Wohn.]';

	const expectedResourcesArray = [
		'b-di',
		'c-di',
		'c-di',
		'hlf',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'rtw',
		'nef',
		'olrd',
	];

	const result = upgradeAlarmkeyword(originalKeyword, newKeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('returns the correct new units array when only given the new keyword and a module', () => {
	const newKeyword = 'F3[WohnY.]+s-rtw';
	const originalKeyword = 'F2[Wohn.]';

	const expectedResourcesArray = [
		'b-di',
		'c-di',
		'c-di',
		'hlf',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'rtw',
		'nef',
		'olrd',
		's-rtw',
	];

	const result = upgradeAlarmkeyword(originalKeyword, newKeyword);

	expect(result).toEqual(expectedResourcesArray);
});
