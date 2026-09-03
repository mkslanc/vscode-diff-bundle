/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


/**
 * Warning: Be careful when changing this type, as it is used for serialization!
*/
export type ISerializedStringEdit = ISerializedStringReplacement[];

/**
 * Warning: Be careful when changing this type, as it is used for serialization!
*/
export interface ISerializedStringReplacement {
	txt: string;
	pos: number;
	len: number;
}

/**
 * Represents data associated to a single edit, which survives certain edit operations.
*/
export interface IEditData<T> {
	join(other: T): T | undefined;
}
