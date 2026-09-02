// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("Remove Console Log");

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  outputChannel.appendLine('Congratulations, your extension "removeconsolelog" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('removeconsolelog.removeConsoleLog', () => {
    removeConsoleLogs(outputChannel);
  });
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }


export async function removeConsoleLogs(outputChannel: vscode.OutputChannel): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return; // no active text editor
  }

  function formatLogEntry(message: string, level = 'INFO') {
    const date = new Date();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;

    return `${dateString} [${level}] ${message}`;
  }

  function log(message: string, level = 'INFO') {
    outputChannel.appendLine(formatLogEntry(message, level));
  }


  const document = editor.document;
  const consoleLogPattern = /\bconsole\.log\s*\(([^)]*)\);\n/g;
  const edits: vscode.TextEdit[] = [];
  let match: RegExpExecArray | null;
  const searchString = vscode.workspace.getConfiguration().get<string>('consoleLogSearchString') || '';

  const documentText = document.getText();
  while ((match = consoleLogPattern.exec(documentText))) {
    const consoleLogText = match[1].trim();
    if (consoleLogText.includes(searchString)) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      edits.push(vscode.TextEdit.delete(new vscode.Range(start, end)));
    } else {
      log(`No "${searchString}" in consoleLogText: ${consoleLogText}`);
    }
  }


  if (edits.length > 0) {
    await editor.edit(editBuilder => {
      edits.forEach(edit => editBuilder.replace(edit.range, ''));
    });
    vscode.window.showInformationMessage(`Removed ${edits.length} console.log() statements containing "${searchString}".`);
  } else {
    vscode.window.showInformationMessage(`No console.log() statements found containing "${searchString}".`);
    log(`searchString: ${searchString}, documentText length = ${documentText.length}`);
  }
}


