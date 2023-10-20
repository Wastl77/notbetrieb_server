import { alarmKeywordConfiguration } from './alarmKeywordConfiguration.js';

export function generateResources(alarmKeyword: string) {
	const parts = alarmKeyword.split('+');
	const resources: string[] = [];
	let baseKeyword = null;

	for (const part of parts) {
		if (part.includes('[')) {
			const [keyword, addition] = part.split('[');
			if (alarmKeywordConfiguration[keyword]) {
				baseKeyword = keyword;
				const config = alarmKeywordConfiguration[keyword];
				if (config.units.every((unit) => !resources.includes(unit))) {
					resources.push(...config.units);
				}
				if (addition) {
					const additionString = addition.replace(']', '');
					const additionParts = additionString.split('#');
					for (const additionPart of additionParts) {
						if (config.allowedAdditions?.includes(additionPart)) {
							const additionConfig = alarmKeywordConfiguration[additionPart];
							if (additionString.includes('#')) {
								for (const unit of additionConfig.units) {
									if (!resources.includes(unit)) {
										resources.push(unit);
									}
								}
							} else {
								for (const unit of additionConfig.units) {
									resources.push(unit);
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
					if (config.units.every((unit) => !resources.includes(unit))) {
						resources.push(...config.units);
					}
					baseKeyword = part;
				}
				if (config.type === 'module') {
					resources.push(...config.units);
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
							resources.push(unit);
						}
					}
				} else {
					return [];
				}
			}
		}
	}
	return resources;
}
