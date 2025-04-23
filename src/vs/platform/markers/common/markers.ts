/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../base/common/event.js';
import { IDisposable } from '../../../base/common/lifecycle.js';
import { URI } from '../../../base/common/uri.js';
import { localize } from '../../../nls.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';

export interface IMarkerService {
	readonly _serviceBrand: undefined;

	getStatistics(): MarkerStatistics;

	changeOne(owner: string, resource: URI, markers: IMarkerData[]): void;

	changeAll(owner: string, data: IResourceMarker[]): void;

	remove(owner: string, resources: URI[]): void;

	read(filter?: { owner?: string; resource?: URI; severities?: number; take?: number }): IMarker[];

	installResourceFilter(resource: URI, reason: string): IDisposable;

	readonly onMarkerChanged: Event<readonly URI[]>;
}

/**
 *
 */
export interface IRelatedInformation {
	resource: URI;
	message: string;
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
}

export const enum MarkerTag {
	Unnecessary = 1,
	Deprecated = 2
}

export enum MarkerSeverity {
	Hint = 1,
	Info = 2,
	Warning = 4,
	Error = 8,
}

export namespace MarkerSeverity {

	export function compare(a: MarkerSeverity, b: MarkerSeverity): number {
		return b - a;
	}

	const _displayStrings: { [value: number]: string } = Object.create(null);
	_displayStrings[MarkerSeverity.Error] = localize('sev.error', "Error");
	_displayStrings[MarkerSeverity.Warning] = localize('sev.warning', "Warning");
	_displayStrings[MarkerSeverity.Info] = localize('sev.info', "Info");

	const _displayStringsPlural: { [value: number]: string } = Object.create(null);
	_displayStringsPlural[MarkerSeverity.Error] = localize('sev.errors', "Errors");
	_displayStringsPlural[MarkerSeverity.Warning] = localize('sev.warnings', "Warnings");
	_displayStringsPlural[MarkerSeverity.Info] = localize('sev.infos', "Infos");
}

/**
 * A structure defining a problem/warning/etc.
 */
export interface IMarkerData {
	code?: string | { value: string; target: URI };
	severity: MarkerSeverity;
	message: string;
	source?: string;
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
	modelVersionId?: number;
	relatedInformation?: IRelatedInformation[];
	tags?: MarkerTag[];
}

export interface IResourceMarker {
	resource: URI;
	marker: IMarkerData;
}

export interface IMarker {
	owner: string;
	resource: URI;
	severity: MarkerSeverity;
	code?: string | { value: string; target: URI };
	message: string;
	source?: string;
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
	modelVersionId?: number;
	relatedInformation?: IRelatedInformation[];
	tags?: MarkerTag[];
}

export interface MarkerStatistics {
	errors: number;
	warnings: number;
	infos: number;
	unknowns: number;
}

export namespace IMarkerData {
}

export const IMarkerService = createDecorator<IMarkerService>('markerService');
