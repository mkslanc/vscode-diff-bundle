/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export const Mimes = Object.freeze({
	text: 'text/plain',
	binary: 'application/octet-stream',
	unknown: 'application/unknown',
	markdown: 'text/markdown',
	latex: 'text/latex',
	uriList: 'text/uri-list',
	html: 'text/html',
});



// Known media mimes that we can handle

const _simplePattern = /^(.+)\/(.+?)(;.+)?$/;

export function normalizeMimeType(mimeType: string): string;
export function normalizeMimeType(mimeType: string, strict: true): string | undefined;
export function normalizeMimeType(mimeType: string, strict?: true): string | undefined {

	const match = _simplePattern.exec(mimeType);
	if (!match) {
		return strict
			? undefined
			: mimeType;
	}
	// https://datatracker.ietf.org/doc/html/rfc2045#section-5.1
	// media and subtype must ALWAYS be lowercase, parameter not
	return `${match[1].toLowerCase()}/${match[2].toLowerCase()}${match[3] ?? ''}`;
}
