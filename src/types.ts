export interface TerminalInterface {
  onData(handler: (data: string) => void): void;

  focus(): void;
  write(s: string): void;
}

export interface App {
  assignTerminal(term: TerminalInterface): void;

  runCode(code: string): void;
  listFiles(): Promise<string[]>;

  getFileAsText(src_fname: string): Promise<string>;
  sendFileAsText(file: string, text: string): void;

  sendFile(f: File): void;

  onOpen(handler: () => void): void;
}

export const EduBlocksXML = 'xml';
export const PythonScript = 'py';

export type FileType = typeof EduBlocksXML | typeof PythonScript;
