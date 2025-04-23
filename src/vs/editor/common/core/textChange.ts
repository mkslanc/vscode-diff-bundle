/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/



export class TextChange {

	public get oldLength(): number {
		return this.oldText.length;
	}

	public get oldEnd(): number {
		return this.oldPosition + this.oldText.length;
	}

	public get newLength(): number {
		return this.newText.length;
	}

	public get newEnd(): number {
		return this.newPosition + this.newText.length;
	}

	constructor(
		public readonly oldPosition: number,
		public readonly oldText: string,
		public readonly newPosition: number,
		public readonly newText: string
	) { }



}

