/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as streams from './stream.js';

interface NodeBuffer {
	allocUnsafe(size: number): Uint8Array;
	isBuffer(obj: unknown): obj is NodeBuffer;
	from(arrayBuffer: ArrayBufferLike, byteOffset?: number, length?: number): Uint8Array;
	from(data: string): Uint8Array;
}

declare const Buffer: NodeBuffer;

const hasBuffer = (typeof Buffer !== 'undefined');


export class VSBuffer {

	/**
	 * When running in a nodejs context, if `actual` is not a nodejs Buffer, the backing store for
	 * the returned `VSBuffer` instance might use a nodejs Buffer allocated from node's Buffer pool,
	 * which is not transferrable.
	 */
	static wrap(actual: Uint8Array): VSBuffer {
		if (hasBuffer && !(Buffer.isBuffer(actual))) {
			// https://nodejs.org/dist/latest-v10.x/docs/api/buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length
			// Create a zero-copy Buffer wrapper around the ArrayBuffer pointed to by the Uint8Array
			actual = Buffer.from(actual.buffer, actual.byteOffset, actual.byteLength);
		}
		return new VSBuffer(actual);
	}

	readonly buffer: Uint8Array;
	readonly byteLength: number;

	private constructor(buffer: Uint8Array) {
		this.buffer = buffer;
		this.byteLength = this.buffer.byteLength;
	}
}

export interface VSBufferReadable extends streams.Readable<VSBuffer> { }

export interface VSBufferReadableStream extends streams.ReadableStream<VSBuffer> { }

export interface VSBufferWriteableStream extends streams.WriteableStream<VSBuffer> { }

export interface VSBufferReadableBufferedStream extends streams.ReadableBufferedStream<VSBuffer> { }


const hexChars = '0123456789abcdef';
export function encodeHex({ buffer }: VSBuffer): string {
	let result = '';
	for (let i = 0; i < buffer.length; i++) {
		const byte = buffer[i];
		result += hexChars[byte >>> 4];
		result += hexChars[byte & 0x0f];
	}
	return result;
}

