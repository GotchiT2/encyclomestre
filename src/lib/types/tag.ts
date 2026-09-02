export interface CollectionTag {
	id: string;
	name: string;
	color: string;
	visibility?: import('./user').ProfileVisibility;
}

export type CollectionTagAssignments = Record<string, string[]>;
