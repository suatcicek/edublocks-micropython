import React = require('preact');
import { Component } from 'preact';

import Nav from './Nav';
import BlocklyView from './BlocklyView';
import PythonView from './PythonView';
import TerminalView from './TerminalView';
import SelectModal, { SelectModalOption } from './SelectModal';
import Status from './Status';
import { App, EduBlocksXML, PythonScript, FileType } from '../types';
import { sleep, joinDirNameAndFileName } from '../lib';
import { MpFile } from '../micropython-ws';

const ViewModeBlockly = 'blockly';
const ViewModePython = 'python';

type ViewMode = typeof ViewModeBlockly | typeof ViewModePython;

interface PageProps {
  app: App;
}

interface BlocklyDocumentState {
  fileType: typeof EduBlocksXML;
  dirName: string | null;
  fileName: string | null;
  xml: string | null;
  python: string | null;
  pythonClean: boolean;
}

interface PythonDocumentState {
  fileType: typeof PythonScript;
  dirName: string | null;
  fileName: string | null;
  python: string | null;
  pythonClean: false;
}

type DocumentState = BlocklyDocumentState | PythonDocumentState;

interface PageState {
  connected: boolean;
  viewMode: ViewMode;
  terminalOpen: boolean;

  fileListModalOpen: boolean;
  files: MpFile[];
  cwd: string;

  doc: Readonly<DocumentState>;
}

export default class Page extends Component<PageProps, PageState> {
  private blocklyView: BlocklyView;
  private pythonView: PythonView;
  public terminalView: TerminalView;

  constructor(props: PageProps) {
    super(props);

    this.state = {
      connected: false,
      viewMode: ViewModeBlockly,
      terminalOpen: false,

      fileListModalOpen: false,
      files: [],
      cwd: '/',

      doc: {
        fileType: EduBlocksXML,
        dirName: null,
        fileName: null,
        xml: null,
        python: null,
        pythonClean: true,
      },
    };

    this.props.app.onOpen(() => {
      this.setState({ connected: true });
    });
  }

  private renameDocument(fileName: string) {
    const inferredType = getFileType(fileName);

    if (inferredType === null) {
      fileName = `${fileName}.${EduBlocksXML}`;
    }

    const fileType = inferredType || EduBlocksXML;

    const doc: DocumentState = this.state.doc;

    if (fileType === 'xml' && doc.fileType === 'xml') {
      const xmlDoc: BlocklyDocumentState = {
        ...doc,
        fileType,
        fileName,
      };

      this.setState({ doc: xmlDoc });
    }

    if (fileType === 'py' && doc.fileType === 'py') {
      const pyDoc: PythonDocumentState = {
        ...doc,
        fileType,
        fileName,
      };

      this.setState({ doc: pyDoc });
    }

    // Convert from XML -> PY
    if (fileType === 'py' && doc.fileType === 'xml') {
      const pyDoc: PythonDocumentState = {
        fileType,
        dirName: doc.dirName,
        fileName,
        python: doc.python,
        pythonClean: false,
      };

      this.setState({ doc: pyDoc });
    }

    // Convert from PY -> XML
    if (fileType === 'xml' && doc.fileType === 'py') {
      alert('Cannot convert a Python document to an EduBlocks document');

      return;
    }

    if (fileType === PythonScript) {
      this.switchView(ViewModePython);
    } else {
      this.switchView(ViewModeBlockly);
    }
  }

  private readBlocklyContents(dirName: string, fileName: string, xml: string) {
    const doc: DocumentState = {
      fileType: EduBlocksXML,
      dirName,
      fileName,
      xml,
      python: null,
      pythonClean: true,
    };

    this.setState({ doc });

    this.switchView(ViewModeBlockly);
  }

  private readPythonContents(dirName: string, fileName: string, python: string) {
    if (this.state.doc.python === python) { return; }

    const doc: DocumentState = {
      fileType: PythonScript,
      dirName,
      fileName,
      xml: null,
      python,
      pythonClean: false,
    };

    this.setState({ doc });

    this.switchView(ViewModePython);
  }

  private updateFromBlockly(xml: string, python: string) {
    const { doc } = this.state;

    if (
      doc.fileType === EduBlocksXML &&
      doc.xml === xml &&
      doc.python === python
    ) {
      return;
    }

    if (doc.python !== python && !doc.pythonClean) {
      alert('Python changes have been overwritten!');
    }

    const newDoc: DocumentState = {
      fileType: EduBlocksXML,
      dirName: doc.dirName,
      fileName: doc.fileName,
      xml,
      python,
      pythonClean: true,
    };

    this.setState({ doc: newDoc });
  }

  private updateFromPython(python: string) {
    if (this.state.doc.python === python) { return; }

    const doc: DocumentState = { ...this.state.doc, python, pythonClean: false };

    this.setState({ doc });
  }

  private new() {
    const doc: DocumentState = {
      fileType: EduBlocksXML,
      dirName: null,
      fileName: null,
      xml: null,
      python: null,
      pythonClean: true,
    };

    this.setState({ doc });

    this.switchView('blockly');
  }

  protected componentDidMount() {

  }

  private toggleView(): 0 {
    switch (this.state.viewMode) {
      case ViewModeBlockly:
        return this.switchView(ViewModePython);

      case ViewModePython:
        return this.switchView(ViewModeBlockly);
    }
  }

  private switchView(viewMode: ViewMode): 0 {
    switch (viewMode) {
      case ViewModeBlockly:
        if (this.state.doc.fileType === PythonScript) {
          alert('Block view not available');

          return 0;
        }

        this.setState({ viewMode: 'blockly' });

        return 0;

      case ViewModePython:
        this.setState({ viewMode: 'python' });

        return 0;
    }
  }

  private async onRun() {
    if (this.state.doc.fileType === 'py') {
      await this.save();
    }

    if (!this.terminalView) { throw new Error('No terminal'); }

    if (!this.state.doc.python) {
      alert('There is no code to run');

      return;
    }

    this.setState({ terminalOpen: true });
    this.terminalView.focus();

    if (this.state.doc.fileType === 'xml') {
      this.props.app.runCode(this.state.doc.python);
    }

    if (this.state.doc.fileType === 'py') {
      this.props.app.runLine(`exec(open('${this.state.doc.fileName}','r').read())`);
    }

    setTimeout(() => this.terminalView.focus(), 250);
  }

  public async openFileListModal() {
    const files = await this.props.app.listFiles(this.state.cwd);

    this.setState({ fileListModalOpen: true, files });
  }

  public closeFileListModal() {
    this.setState({ fileListModalOpen: false });
  }

  private changeDirectory(dir: string) {
    const cwd = this.state.cwd;

    const newCwd = joinDirNameAndFileName(cwd, dir);

    if (!newCwd) {
      throw new Error('Invalid dir path');
    }

    this.setState({ cwd: newCwd });
  }

  private handleFileContents(dirName: string, fileName: string, contents: string): 0 {
    switch (getFileType(fileName)) {
      case EduBlocksXML:
        this.readBlocklyContents(dirName, fileName, contents);

        return 0;

      case PythonScript:
        this.readPythonContents(dirName, fileName, contents);

        return 0;

      case null:
        alert('Unknown file type');

        return 0;
    }
  }

  public onBlocklyChange(xml: string, python: string) {
    this.updateFromBlockly(xml, python);
  }

  public onPythonChange(python: string) {
    this.updateFromPython(python);
  }

  public async save(): Promise<0> {
    if (!this.state.doc.fileName) {
      const fileName = prompt('Enter filename');

      if (fileName) {
        this.renameDocument(fileName);
      }
    }

    if (!this.state.doc.fileName) {
      alert('You must specify a filename in order to save');

      return 0;
    }

    const filePath = this.getDocumentFilePath();

    if (!filePath) {
      throw new Error('Invalid file path');
    }

    switch (this.state.doc.fileType) {
      case EduBlocksXML:
        await this.props.app.sendFileAsText(
          filePath,
          this.state.doc.xml || '',
        );

        return 0;

      case PythonScript:
        await this.props.app.sendFileAsText(
          filePath,
          this.state.doc.python || '',
        );

        return 0;
    }
  }

  private async onFileSelected(option: SelectModalOption) {
    const selectedFile = option.obj as MpFile;

    if (selectedFile.isdir) {
      this.changeDirectory(selectedFile.filename);

      this.openFileListModal();
    } else {
      const filePath = joinDirNameAndFileName(this.state.cwd, selectedFile.filename);

      if (!filePath) {
        throw new Error('Invalid file path');
      }

      const contents = await this.props.app.getFileAsText(filePath);

      this.handleFileContents(this.state.cwd, selectedFile.filename, contents);

      this.closeFileListModal();
    }
  }

  private onSelectFile(file: File) {
    this.props.app.sendFile(file);
  }

  private onTerminalClose() {
    this.setState({ terminalOpen: false });
  }

  private getXml(): string {
    if (this.state.doc.fileType === 'xml') {
      return this.state.doc.xml || '';
    }

    return '';
  }

  private getFiles(): SelectModalOption[] {
    return this.state.files.map((file) => ({
      label: `${file.filename} (${file.isdir ? 'Folder' : 'File'})`,
      obj: file,
    }));
  }

  private getDocumentFilePath() {
    const { doc } = this.state;

    return joinDirNameAndFileName(doc.dirName, doc.fileName);
  }

  public render() {
    return (
      <div class="Page">
        <Nav
          onRun={() => this.onRun()}
          onDownloadPython={() => { }}
          onOpen={() => this.openFileListModal()}
          onSave={() => this.save()}
          onNew={() => this.new()}
          onSelectFile={(file) => this.onSelectFile(file)} />

        <Status
          connected={this.state.connected}
          fileName={this.getDocumentFilePath()}
          fileType={this.state.doc.fileType}
          sync={this.state.doc.pythonClean}

          onChangeName={(file) => this.renameDocument(file)} />

        <section id="workspace">
          <button
            id="toggleViewButton"
            onClick={() => this.toggleView()}>

            {this.state.viewMode}

          </button>

          <BlocklyView
            ref={(c) => this.blocklyView = c}
            visible={this.state.viewMode === 'blockly'}
            xml={this.getXml()}
            onChange={(xml, python) => this.onBlocklyChange(xml, python)} />

          <PythonView
            ref={(c) => this.pythonView = c}
            visible={this.state.viewMode === 'python'}
            python={this.state.doc.python}
            onChange={(python) => this.onPythonChange(python)} />
        </section>

        <TerminalView
          ref={(c) => this.terminalView = c}
          visible={this.state.terminalOpen}
          onClose={() => this.onTerminalClose()} />

        <SelectModal
          title="Files"
          options={this.getFiles()}
          visible={this.state.fileListModalOpen}
          onSelect={(file) => this.onFileSelected(file)}
          onCancel={() => this.closeFileListModal()} />
      </div>
    );
  }
}

function getFileType(file: string): FileType | null {
  if (file.indexOf('.xml') === file.length - 4) {
    return EduBlocksXML;
  }

  if (file.indexOf('.py') === file.length - 3) {
    return PythonScript;
  }

  return null;
}
