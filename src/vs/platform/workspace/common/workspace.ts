/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../nls.js';
import { Event } from '../../../base/common/event.js';
import { TernarySearchTree } from '../../../base/common/ternarySearchTree.js';
import { joinPath} from '../../../base/common/resources.js';
import { URI, UriComponents } from '../../../base/common/uri.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';

export const IWorkspaceContextService = createDecorator<IWorkspaceContextService>('contextService');

export interface IWorkspaceContextService {

	readonly _serviceBrand: undefined;

	/**
	 * An event which fires on workbench state changes.
	 */
	readonly onDidChangeWorkbenchState: Event<WorkbenchState>;

	/**
	 * An event which fires on workspace name changes.
	 */
	readonly onDidChangeWorkspaceName: Event<void>;

	/**
	 * An event which fires before workspace folders change.
	 */
	readonly onWillChangeWorkspaceFolders: Event<IWorkspaceFoldersWillChangeEvent>;

	/**
	 * An event which fires on workspace folders change.
	 */
	readonly onDidChangeWorkspaceFolders: Event<IWorkspaceFoldersChangeEvent>;

	/**
	 * Provides access to the complete workspace object.
	 */
	getCompleteWorkspace(): Promise<IWorkspace>;

	/**
	 * Provides access to the workspace object the window is running with.
	 * Use `getCompleteWorkspace` to get complete workspace object.
	 */
	getWorkspace(): IWorkspace;

	/**
	 * Return the state of the workbench.
	 *
	 * WorkbenchState.EMPTY - if the workbench was opened with empty window or file
	 * WorkbenchState.FOLDER - if the workbench was opened with a folder
	 * WorkbenchState.WORKSPACE - if the workbench was opened with a workspace
	 */
	getWorkbenchState(): WorkbenchState;

	/**
	 * Returns the folder for the given resource from the workspace.
	 * Can be null if there is no workspace or the resource is not inside the workspace.
	 */
	getWorkspaceFolder(resource: URI): IWorkspaceFolder | null;

	/**
	 * Return `true` if the current workspace has the given identifier or root URI otherwise `false`.
	 */
	isCurrentWorkspace(workspaceIdOrFolder: IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier | URI): boolean;

	/**
	 * Returns if the provided resource is inside the workspace or not.
	 */
	isInsideWorkspace(resource: URI): boolean;
}

export interface IResolvedWorkspace extends IWorkspaceIdentifier, IBaseWorkspace {
	readonly folders: IWorkspaceFolder[];
}

export interface IBaseWorkspace {

	/**
	 * If present, marks the window that opens the workspace
	 * as a remote window with the given authority.
	 */
	readonly remoteAuthority?: string;

	/**
	 * Transient workspaces are meant to go away after being used
	 * once, e.g. a window reload of a transient workspace will
	 * open an empty window.
	 *
	 * See: https://github.com/microsoft/vscode/issues/119695
	 */
	readonly transient?: boolean;
}

export interface IBaseWorkspaceIdentifier {

	/**
	 * Every workspace (multi-root, single folder or empty)
	 * has a unique identifier. It is not possible to open
	 * a workspace with the same `id` in multiple windows
	 */
	readonly id: string;
}

/**
 * A single folder workspace identifier is a path to a folder + id.
 */
export interface ISingleFolderWorkspaceIdentifier extends IBaseWorkspaceIdentifier {

	/**
	 * Folder path as `URI`.
	 */
	readonly uri: URI;
}

/**
 * A multi-root workspace identifier is a path to a workspace file + id.
 */
export interface IWorkspaceIdentifier extends IBaseWorkspaceIdentifier {

	/**
	 * Workspace config file path as `URI`.
	 */
	configPath: URI;
}

export interface IEmptyWorkspaceIdentifier extends IBaseWorkspaceIdentifier { }

export type IAnyWorkspaceIdentifier = IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier | IEmptyWorkspaceIdentifier;

export const EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE: IEmptyWorkspaceIdentifier = { id: 'ext-dev' };
export const UNKNOWN_EMPTY_WINDOW_WORKSPACE: IEmptyWorkspaceIdentifier = { id: 'empty-window' };

export interface ISerializedSingleFolderWorkspaceIdentifier extends IBaseWorkspaceIdentifier {
	readonly uri: UriComponents;
}

export interface ISerializedWorkspaceIdentifier extends IBaseWorkspaceIdentifier {
	readonly configPath: UriComponents;
}

export const enum WorkbenchState {
	EMPTY = 1,
	FOLDER,
	WORKSPACE
}

export interface IWorkspaceFoldersWillChangeEvent {

	readonly changes: IWorkspaceFoldersChangeEvent;
	readonly fromCache: boolean;

	join(promise: Promise<void>): void;
}

export interface IWorkspaceFoldersChangeEvent {
	added: IWorkspaceFolder[];
	removed: IWorkspaceFolder[];
	changed: IWorkspaceFolder[];
}

export interface IWorkspace {

	/**
	 * the unique identifier of the workspace.
	 */
	readonly id: string;

	/**
	 * Folders in the workspace.
	 */
	readonly folders: IWorkspaceFolder[];

	/**
	 * Transient workspaces are meant to go away after being used
	 * once, e.g. a window reload of a transient workspace will
	 * open an empty window.
	 */
	readonly transient?: boolean;

	/**
	 * the location of the workspace configuration
	 */
	readonly configuration?: URI | null;
}

export interface IWorkspaceFolderData {

	/**
	 * The associated URI for this workspace folder.
	 */
	readonly uri: URI;

	/**
	 * The name of this workspace folder. Defaults to
	 * the basename of its [uri-path](#Uri.path)
	 */
	readonly name: string;

	/**
	 * The ordinal number of this workspace folder.
	 */
	readonly index: number;
}

export interface IWorkspaceFolder extends IWorkspaceFolderData {

	/**
	 * Given workspace folder relative path, returns the resource with the absolute path.
	 */
	toResource: (relativePath: string) => URI;
}

export class Workspace implements IWorkspace {

	private foldersMap: TernarySearchTree<URI, WorkspaceFolder>;

	private _folders!: WorkspaceFolder[];
	get folders(): WorkspaceFolder[] { return this._folders; }
	set folders(folders: WorkspaceFolder[]) {
		this._folders = folders;
		this.updateFoldersMap();
	}

	constructor(
		private _id: string,
		folders: WorkspaceFolder[],
		private _transient: boolean,
		private _configuration: URI | null,
		private ignorePathCasing: (key: URI) => boolean,
	) {
		this.foldersMap = TernarySearchTree.forUris<WorkspaceFolder>(this.ignorePathCasing, () => true);
		this.folders = folders;
	}

	update(workspace: Workspace) {
		this._id = workspace.id;
		this._configuration = workspace.configuration;
		this._transient = workspace.transient;
		this.ignorePathCasing = workspace.ignorePathCasing;
		this.folders = workspace.folders;
	}

	get id(): string {
		return this._id;
	}

	get transient(): boolean {
		return this._transient;
	}

	get configuration(): URI | null {
		return this._configuration;
	}

	set configuration(configuration: URI | null) {
		this._configuration = configuration;
	}

	getFolder(resource: URI): IWorkspaceFolder | null {
		if (!resource) {
			return null;
		}

		return this.foldersMap.findSubstr(resource) || null;
	}

	private updateFoldersMap(): void {
		this.foldersMap = TernarySearchTree.forUris<WorkspaceFolder>(this.ignorePathCasing, () => true);
		for (const folder of this.folders) {
			this.foldersMap.set(folder.uri, folder);
		}
	}

	toJSON(): IWorkspace {
		return { id: this.id, folders: this.folders, transient: this.transient, configuration: this.configuration };
	}
}

export interface IRawFileWorkspaceFolder {
	readonly path: string;
	name?: string;
}

export interface IRawUriWorkspaceFolder {
	readonly uri: string;
	name?: string;
}

export class WorkspaceFolder implements IWorkspaceFolder {

	readonly uri: URI;
	readonly name: string;
	readonly index: number;

	constructor(
		data: IWorkspaceFolderData,
		/**
		 * Provides access to the original metadata for this workspace
		 * folder. This can be different from the metadata provided in
		 * this class:
		 * - raw paths can be relative
		 * - raw paths are not normalized
		 */
		readonly raw?: IRawFileWorkspaceFolder | IRawUriWorkspaceFolder
	) {
		this.uri = data.uri;
		this.index = data.index;
		this.name = data.name;
	}

	toResource(relativePath: string): URI {
		return joinPath(this.uri, relativePath);
	}

	toJSON(): IWorkspaceFolderData {
		return { uri: this.uri, name: this.name, index: this.index };
	}
}

export const WORKSPACE_EXTENSION = 'code-workspace';
export const WORKSPACE_SUFFIX = `.${WORKSPACE_EXTENSION}`;
export const WORKSPACE_FILTER = [{ name: localize('codeWorkspace', "Code Workspace"), extensions: [WORKSPACE_EXTENSION] }];
export const UNTITLED_WORKSPACE_NAME = 'workspace.json';

export const STANDALONE_EDITOR_WORKSPACE_ID = '4064f6ec-cb38-4ad0-af64-ee6467e63c82';
