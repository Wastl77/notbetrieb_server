export type Resource = {
	callsign: string;
	status: string;
	area: string;
	id: number;
	type: string;
};

export const RESOURCES: Resource[] = [
	{
		callsign: '1182-1',
		status: '2',
		area: 'NEF',
		id: 0,
		type: 'nef',
	},
	{
		callsign: '1182-2',
		status: '2',
		area: 'NEF',
		id: 1,
		type: 'nef',
	},
];
