import { expect, test } from 'vitest';
import { generateInitialResources } from './generateInitialResources.js';

test('generates correct resource array from alarmkeyword without addition or module', () => {
	const alarmkeyword = 'F2';
	const expectedResourcesArray = ['c-di', 'hlf', 'hlf', 'dlk'];

	const result = generateInitialResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition, but without module', () => {
	const alarmkeyword = 'F2[Residential]';
	const expectedResourcesArray = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
	];

	const result = generateInitialResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition and module, but without multiplier', () => {
	const alarmkeyword = 'F2[Residential]+rtw';
	const expectedResourcesArray = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'rtw',
	];

	const result = generateInitialResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition and module with multiplier', () => {
	const alarmkeyword = 'F2[Residential]+2rtw';
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

	const result = generateInitialResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});

test('generates correct resource array from alarmkeyword with addition and modules with multiplier', () => {
	const alarmkeyword = 'F2[Residential]+2rtw+hlf';
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

	const result = generateInitialResources(alarmkeyword);

	expect(result).toEqual(expectedResourcesArray);
});
