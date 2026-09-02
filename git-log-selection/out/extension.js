"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const vscode = require("vscode");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const output = vscode.window.createOutputChannel("Git Log Selection");
function activate(context) {
    context.subscriptions.push(output, vscode.commands.registerCommand("gitLogSelection.findIntroduction", findIntroduction));
}
async function findIntroduction() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        void vscode.window.showErrorMessage("Open an editor and select a line first.");
        return;
    }
    const selectedText = editor.document.getText(editor.selection);
    const selectedLine = selectedText.split(/\r?\n/, 1)[0];
    if (!selectedLine) {
        void vscode.window.showErrorMessage("Select a non-empty first line to search for.");
        return;
    }
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (!workspaceFolder) {
        void vscode.window.showErrorMessage("The active file is not in an open workspace folder.");
        return;
    }
    const relativeFilePath = vscode.workspace.asRelativePath(editor.document.uri, false);
    const args = [
        "log",
        "--all",
        "--format=%H %s",
        "-S",
        selectedLine,
        "--",
        relativeFilePath,
    ];
    output.clear();
    output.appendLine(`$ git ${args.join(" ")}`);
    output.appendLine("");
    try {
        const { stdout, stderr } = await execFileAsync("git", args, {
            cwd: workspaceFolder.uri.fsPath,
        });
        output.append(stdout || "No commits found.");
        if (stderr) {
            output.appendLine(stderr);
        }
        output.show(true);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.appendLine(message);
        output.show(true);
        void vscode.window.showErrorMessage("Git log search failed. See the Git Log Selection output.");
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map