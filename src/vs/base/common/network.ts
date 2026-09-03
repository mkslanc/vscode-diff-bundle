/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export namespace Schemas {

	/**
	 * A schema that is used for models that exist in memory
	 * only and that have no correspondence on a server or such.
	 */
	export const inMemory = 'inmemory';

	/**
	 * A schema that is used for setting files
	 */
	export const vscode = 'vscode';

	/**
	 * A schema that is used for internal private files
	 */
	export const internal = 'private';

	/**
	 * A walk-through document.
	 */
	export const walkThrough = 'walkThrough';

	/**
	 * An embedded code snippet.
	 */
	export const walkThroughSnippet = 'walkThroughSnippet';

	export const http = 'http';

	export const https = 'https';

	export const file = 'file';

	export const mailto = 'mailto';

	export const untitled = 'untitled';

	export const data = 'data';

	export const command = 'command';

	export const vscodeRemote = 'vscode-remote';

	export const vscodeRemoteResource = 'vscode-remote-resource';

	export const vscodeManagedRemoteResource = 'vscode-managed-remote-resource';

	export const vscodeUserData = 'vscode-userdata';

	export const vscodeCustomEditor = 'vscode-custom-editor';

	export const vscodeNotebookCell = 'vscode-notebook-cell';
	export const vscodeNotebookCellMetadata = 'vscode-notebook-cell-metadata';
	export const vscodeNotebookCellMetadataDiff = 'vscode-notebook-cell-metadata-diff';
	export const vscodeNotebookCellOutput = 'vscode-notebook-cell-output';
	export const vscodeNotebookCellOutputDiff = 'vscode-notebook-cell-output-diff';
	export const vscodeNotebookMetadata = 'vscode-notebook-metadata';
	export const vscodeInteractiveInput = 'vscode-interactive-input';

	export const vscodeSettings = 'vscode-settings';

	export const vscodeWorkspaceTrust = 'vscode-workspace-trust';

	export const vscodeTerminal = 'vscode-terminal';

	/** Scheme used for the image carousel editor. */
	export const vscodeImageCarousel = 'vscode-image-carousel';

	/** Scheme used for code blocks in chat. */
	export const vscodeChatCodeBlock = 'vscode-chat-code-block';

	/** Scheme used for LHS of code compare (aka diff) blocks in chat. */
	export const vscodeChatCodeCompareBlock = 'vscode-chat-code-compare-block';

	/** Scheme used for the chat input editor. */
	export const vscodeChatEditor = 'vscode-chat-editor';

	/** Scheme used for the chat input part */
	export const vscodeChatInput = 'chatSessionInput';

	/** Scheme used for the Agents window new-session composer input */
	export const sessionsChatInput = 'sessions-chat';

	/** Scheme used for local chat session content */
	export const vscodeLocalChatSession = 'vscode-chat-session';

	/** Scheme used for read-only resources owned by a chat response or attachment */
	export const vscodeChatResponseResource = 'vscode-chat-response-resource';

	/**
	 * Scheme used internally for webviews that aren't linked to a resource (i.e. not custom editors)
	 */
	export const webviewPanel = 'webview-panel';

	/**
	 * Scheme used for loading the wrapper html and script in webviews.
	 */
	export const vscodeWebview = 'vscode-webview';

	/**
	 * Scheme used for integrated browser tabs using WebContentsView.
	 */
	export const vscodeBrowser = 'vscode-browser';

	/**
	 * Scheme used for extension pages
	 */
	export const extension = 'extension';

	/**
	 * Scheme used as a replacement of `file` scheme to load
	 * files with our custom protocol handler (desktop only).
	 */
	export const vscodeFileResource = 'vscode-file';

	/**
	 * Scheme used for temporary resources
	 */
	export const tmp = 'tmp';

	/**
	 * Scheme used vs live share
	 */
	export const vsls = 'vsls';

	/**
	 * Scheme used for the Source Control commit input's text document
	 */
	export const vscodeSourceControl = 'vscode-scm';

	/**
	 * Scheme used for input box for creating comments.
	 */
	export const commentsInput = 'comment';

	/**
	 * Scheme used for special rendering of settings in the release notes
	 */
	export const codeSetting = 'code-setting';

	/**
	 * Scheme used for output panel resources
	 */
	export const outputChannel = 'output';

	/**
	 * Scheme used for the accessible view
	 */
	export const accessibleView = 'accessible-view';

	/**
	 * Used for snapshots of chat edits
	 */
	export const chatEditingSnapshotScheme = 'chat-editing-snapshot-text-model';
	export const chatEditingModel = 'chat-editing-text-model';

	/**
	 * Used for rendering multidiffs in copilot agent sessions
	 */
	export const copilotPr = 'copilot-pr';
}

export const connectionTokenCookieName = 'vscode-tkn';
export const connectionTokenQueryName = 'tkn';

class RemoteAuthoritiesImpl {

}

export const RemoteAuthorities = new RemoteAuthoritiesImpl();

/**
 * A string pointing to a path inside the app. It should not begin with ./ or ../
 */
export type AppResourcePath = (
	`a${string}` | `b${string}` | `c${string}` | `d${string}` | `e${string}` | `f${string}`
	| `g${string}` | `h${string}` | `i${string}` | `j${string}` | `k${string}` | `l${string}`
	| `m${string}` | `n${string}` | `o${string}` | `p${string}` | `q${string}` | `r${string}`
	| `s${string}` | `t${string}` | `u${string}` | `v${string}` | `w${string}` | `x${string}`
	| `y${string}` | `z${string}`
);

export const builtinExtensionsPath: AppResourcePath = 'vs/../../extensions';
export const nodeModulesPath: AppResourcePath = 'vs/../../node_modules';
export const nodeModulesAsarPath: AppResourcePath = 'vs/../../node_modules.asar';
export const nodeModulesAsarUnpackedPath: AppResourcePath = 'vs/../../node_modules.asar.unpacked';

export const VSCODE_AUTHORITY = 'vscode-app';

class FileAccessImpl {


}

export const FileAccess = new FileAccessImpl();

export const CacheControlheaders: Record<string, string> = Object.freeze({
	'Cache-Control': 'no-cache, no-store'
});

export const DocumentPolicyheaders: Record<string, string> = Object.freeze({
	'Document-Policy': 'include-js-call-stacks-in-crash-reports'
});

export namespace COI {

	const coiHeaders = new Map<'3' | '2' | '1' | string, Record<string, string>>([
		['1', { 'Cross-Origin-Opener-Policy': 'same-origin' }],
		['2', { 'Cross-Origin-Embedder-Policy': 'require-corp' }],
		['3', { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' }],
	]);

	export const CoopAndCoep = Object.freeze(coiHeaders.get('3'));

}
