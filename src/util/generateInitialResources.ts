import { alarmKeywordConfiguration } from '../util/alarmKeywordConfiguration.js';

export function generateInitialResources(alarmKeyword: string) {
	const parts = alarmKeyword.split('+');
	const initialResources: string[] = [];
	let baseKeyword = null;

	for (const part of parts) {
		if (part.includes('[')) {
			const [keyword, addition] = part.split('[');
			if (alarmKeywordConfiguration[keyword]) {
				baseKeyword = keyword;
				const config = alarmKeywordConfiguration[keyword];
				if (config.units.every((unit) => !initialResources.includes(unit))) {
					initialResources.push(...config.units);
				}
				if (addition) {
					const additionString = addition.replace(']', '');
					const additionParts = additionString.split('#');
					for (const additionPart of additionParts) {
						if (config.allowedAdditions?.includes(additionPart)) {
							const additionConfig = alarmKeywordConfiguration[additionPart];
							for (const unit of additionConfig.units) {
								if (!initialResources.includes(unit)) {
									initialResources.push(unit);
								}
							}
						}
					}
				}
			}
		} else {
			const config = alarmKeywordConfiguration[part];
			if (config) {
				if (config.type === 'alarmkeyword') {
					if (baseKeyword !== null) {
						return [];
					}
					if (config.units.every((unit) => !initialResources.includes(unit))) {
						initialResources.push(...config.units);
					}
					baseKeyword = part;
				}
				if (config.type === 'module') {
					initialResources.push(...config.units);
				}
			} else {
				const config2 = alarmKeywordConfiguration[part.replace(/\d+/g, '')];
				if (config2?.type === 'module') {
					if (baseKeyword === null) {
						return [];
					}
					let count = 1;
					const match = part.match(/\d+/);
					if (match) {
						count = parseInt(match[0], 10);
					}
					for (const unit of config2.units) {
						for (let i = 0; i < count; i++) {
							initialResources.push(unit);
						}
					}
				} else {
					return [];
				}
			}
		}
	}
	return initialResources;
}
