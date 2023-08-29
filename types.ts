/**
 * Defines the shape of the scene input object.
 *
 * @typedef {Object} SceneInputType
 *
 * @property {Object} adress - The address object.
 * @property {string} adress.street - The street name.
 * @property {string|null} adress.object - The building/object name.
 * @property {string|null} adress.district - The district name.
 *
 * @property {string} alarmKeyword - The alarm keyword.
 * @property {string[]} resources - Array of resource strings.
 * @property {string} sceneNumber - The optional number of the scene.
 */

export type SceneInputType = {
	adress: {
		street: string;
		object: string | null;
		district: string | null;
	};
	alarmKeyword: string;
	resources: string[];
	sceneNumber?: number;
};
