import * as vscode from 'vscode';
import * as repl from './repl';

let g_terminal: vscode.Terminal = null

interface WorkspaceVariable {
    name: string,
    type: string,
    value: string
}

let g_replVariables: WorkspaceVariable[] = undefined;

export class REPLTreeDataProvider implements vscode.TreeDataProvider<WorkspaceVariable> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkspaceVariable | undefined> = new vscode.EventEmitter<WorkspaceVariable | undefined>();
    readonly onDidChangeTreeData: vscode.Event<WorkspaceVariable | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getChildren(node?: WorkspaceVariable) {
        if (node) {
            return []
        }
        else {
            if (g_replVariables) {
                return g_replVariables
            }
            else {
                return []
            }
        }
    }

    getTreeItem(node: WorkspaceVariable): vscode.TreeItem {
        let treeItem = new vscode.TreeItem(`${node.name}:`)
        treeItem.description = node.value;
        treeItem.tooltip = node.type;
        treeItem.contextValue = 'globalvariable';
        return treeItem;
    }
}

let g_REPLTreeDataProvider: REPLTreeDataProvider = null;

export async function updateReplVariables() {
    g_replVariables = await repl.g_connection.sendRequest(repl.requestTypeGetVariables, undefined);

    g_REPLTreeDataProvider.refresh();
}

export async function replFinishEval() {
    await updateReplVariables();
}

async function showInVSCode(node: WorkspaceVariable) {
    repl.g_connection.sendNotification(repl.notifyTypeReplShowInGrid, node.name);
}

export function activate(context: vscode.ExtensionContext) {
    g_REPLTreeDataProvider = new REPLTreeDataProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider('REPLVariables', g_REPLTreeDataProvider));

    context.subscriptions.push(vscode.commands.registerCommand('language-julia.showInVSCode', showInVSCode));
}

export function clearVariables() {
    g_replVariables = [];
    g_REPLTreeDataProvider.refresh();
}

export function setTerminal(terminal: vscode.Terminal) {
    g_replVariables = undefined;
    g_REPLTreeDataProvider.refresh();
    g_terminal = terminal
}
