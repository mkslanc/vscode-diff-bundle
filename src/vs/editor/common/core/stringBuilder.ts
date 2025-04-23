/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as platform from '../../../base/common/platform.js';

let _utf16LE_TextDecoder: TextDecoder | null;
function getUTF16LE_TextDecoder(): TextDecoder {
	if (!_utf16LE_TextDecoder) {
		_utf16LE_TextDecoder = new TextDecoder('UTF-16LE');
	}
	return _utf16LE_TextDecoder;
}

let _utf16BE_TextDecoder: TextDecoder | null;
function getUTF16BE_TextDecoder(): TextDecoder {
	if (!_utf16BE_TextDecoder) {
		_utf16BE_TextDecoder = new TextDecoder('UTF-16BE');
	}
	return _utf16BE_TextDecoder;
}

let _platformTextDecoder: TextDecoder | null;
export function getPlatformTextDecoder(): TextDecoder {
	if (!_platformTextDecoder) {
		_platformTextDecoder = platform.isLittleEndian() ? getUTF16LE_TextDecoder() : getUTF16BE_TextDecoder();
	}
	return _platformTextDecoder;
}


export class StringBuilder {



	constructor(capacity: number) {

	}

}
