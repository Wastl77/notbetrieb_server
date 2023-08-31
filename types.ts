/**
 * Defines the shape of the scene input object.
 *
 * @typedef {Object} SceneInputType
 *
 * @property {Object} address - The address object.
 * @property {string} address.street - The street name.
 * @property {string} address.object - The optional building/object name.
 * @property {string} address.district - The optional district name.
 *
 * @property {string} alarmKeyword - The alarm keyword.
 * @property {string[]} resources - Array of resource strings.
 * @property {string} sceneNumber - The optional number of the scene.
 */

export type CreateSceneInput = {
	address: {
		street: string;
		object?: string;
		district?: string;
	};
	alarmKeyword: string;
	sceneNumber?: number; //TODO create input type for the machine
};

export type Scene = CreateSceneInput & {
	resourceLines: {
		id: number;
		type: string;
		callsign: string | null;
		status: 'not disposed' | 'disposed' | 'cancelled';
		cancelledCallsign?: string;
	}[];
};
