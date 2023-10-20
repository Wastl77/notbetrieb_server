import { expect, test } from 'vitest';
import { generateResources } from './generateResources.js';

test('generates correct resource array from alarmkeyword without addition or module', () => {
	const alarmkeyword = 'F2';
	const expectedResourcesArray = ['c-di', 'hlf', 'hlf', 'dlk'];

	const result = generateResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition, but without module', () => {
	const alarmkeyword = 'F2[Wohn.]';
	const expectedResourcesArray = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
	];

	const result = generateResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition and module, but without multiplier', () => {
	const alarmkeyword = 'F2[Wohn.]+rtw';
	const expectedResourcesArray = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'rtw',
	];

	const result = generateResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition and module with multiplier', () => {
	const alarmkeyword = 'F2[Wohn.]+2rtw';
	const expectedResourcesArray = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'rtw',
		'rtw',
	];

	const result = generateResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition and modules with multiplier', () => {
	const alarmkeyword = 'F2[Wohn.]+2rtw+hlf';
	const expectedResourcesArray = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'rtw',
		'rtw',
		'hlf',
	];

	const result = generateResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from 2 alarmkeywords with # delimiter', () => {
	const alarmkeyword = 'F2[Wohn.#Keller]';
	const expectedResourcesArray = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'ab-slm',
	];

	const result = generateResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});
