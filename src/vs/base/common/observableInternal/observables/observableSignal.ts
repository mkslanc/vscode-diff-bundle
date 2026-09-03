/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IObservableWithChange, ITransaction } from '../base.js';

export interface IObservableSignal<TChange> extends IObservableWithChange<void, TChange> {
	trigger(tx: ITransaction | undefined, change: TChange): void;
}

