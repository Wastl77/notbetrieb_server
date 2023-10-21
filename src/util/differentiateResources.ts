function countResources(resourceArray: string[]) {
	const countedResources: Record<string, number> = {};
	for (let i = 0; i < resourceArray.length; i++) {
		const element = resourceArray[i];
		if (countedResources[element]) {
			countedResources[element] += 1;
		} else {
			countedResources[element] = 1;
		}
	}
	return countedResources;
}

export function differentiateResources(
	actualResources: string[],
	totalResources: string[]
) {
	const totalResourcesCount = countResources(totalResources);
	const actualResourcesCount = countResources(actualResources);

	const resourcesToAdd = [];

	for (const key in totalResourcesCount) {
		if (Object.keys(totalResourcesCount).includes(key)) {
			const diff = totalResourcesCount[key] - (actualResourcesCount[key] || 0);
			for (let i = 0; i < diff; i++) {
				resourcesToAdd.push(key);
			}
		}
	}
	return resourcesToAdd;
}
