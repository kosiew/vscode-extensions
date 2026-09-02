import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";

const execFileAsync = promisify(execFile);
const output = vscode.window.createOutputChannel("Git Log Selection");

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    output,
    vscode.commands.registerCommand(
      "gitLogSelection.findIntroduction",
      findIntroduction,
    ),
  );
}

async function findIntroduction(): Promise<void> {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    output.appendLine(message);
    output.show(true);
    void vscode.window.showErrorMessage("Git log search failed. See the Git Log Selection output.");
  }
}

export function deactivate(): void { }