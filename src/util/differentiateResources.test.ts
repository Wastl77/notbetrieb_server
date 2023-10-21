import { expect, test } from 'vitest';
import { differentiateResources } from './differentiateResources.js';

test('differentiates resources correctly', () => {
	const actualResources = ['c-di', 'hlf', 'hlf', 'dlk'];
	const totalResources = [
		'b-di',
		'c-di',
		'c-di',
		'hlf',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
	];
	const actualResources2 = ['c-di', 'hlf', 'hlf', 'dlk', 'gw-mess', 'rtw'];
	const totalResources2 = [
		'c-di',
		'hlf',
		'hlf',
		'dlk',
		'gw-mess',
		'rtw',
		'ab-slm',
	];

	const result = ['b-di', 'c-di', 'hlf', 'gw-mess', 'rtw'];
	const result2 = ['ab-slm'];

	const differentiatedResources = differentiateResources(
		actualResources,
		totalResources
	);

	const differentiatedResources2 = differentiateResources(
		actualResources2,
		totalResources2
	);

	expect(differentiatedResources).toEqual(result);
	expect(differentiatedResources2).toEqual(result2);
});
