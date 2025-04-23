/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class HierarchicalKind {
	public static readonly sep = '.';

	public static readonly None = new HierarchicalKind('@@none@@'); // Special kind that matches nothing
	public static readonly Empty = new HierarchicalKind('');

	constructor(
		public readonly value: string
	) { }
}
