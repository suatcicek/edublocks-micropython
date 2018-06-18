import React = require('preact');
import { Component } from 'preact';

import Nav from './Nav';
import BlocklyView from './BlocklyView';
import PythonView from './PythonView';
import TerminalView from './TerminalView';
import FileModel from './FileModal';
import Status from './Status';
import { App, EduBlocksXML, PythonScript, FileType, DocumentState, BlocklyDocumentState, PythonDocumentState, FileSelectResult } from '../types';
import { sleep, joinDirNameAndFileName, getFileType } from '../lib';
import { MpFile, SocketStatus } from '../micropython-ws';

const ViewModeBlockly = 'blockly';
const ViewModePython = 'python';

type ViewMode = typeof ViewModeBlockly | typeof ViewModePython;

interface PageProps {
  app: App;
}

interface PageState {
  connectionStatus: SocketStatus;
  viewMode: ViewMode;
  terminalOpen: boolean;

  fileModelOpen: boolean;

  doc: Readonly<DocumentState>;
}

export default class Page extends Component<PageProps, PageState> {
  private blocklyView: BlocklyView;
  private pythonView: PythonView;
  public terminalView: TerminalView;

  constructor(props: PageProps) {
    super(props);

    this.state = {
      connectionStatus: 'disconnected',
      viewMode: ViewModeBlockly,
      terminalOpen: false,

      fileModelOpen: false,

      doc: {
        fileType: EduBlocksXML,
        dirName: '/user',
        fileName: null,
        xml: null,
        python: null,
        pythonClean: true,
      },
    };

    this.props.app.onSocketStatusChange((connectionStatus) => {
      this.setState({ connectionStatus });
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
      dirName: '/user',
      fileName: null,
      xml: null,
      python: null,
      pythonClean: true,
    };

    this.setState({ doc });

    this.switchView('blockly');
  }

  protected async componentDidMount() {

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
    if (await this.save()) {
      // this.props.app.runCode(this.state.doc.python || '');

      this.props.app.runDoc(this.state.doc);

      this.setState({ terminalOpen: true });
      this.terminalView.focus();

      setTimeout(() => this.terminalView.focus(), 250);
    }
  }

  public async openFileListModal() {
    this.setState({ fileModelOpen: true });
  }

  public closeFileListModal() {
    this.setState({ fileModelOpen: false });
  }

  private handleFileContents(dirName: string, fileName: string, contents: string): 0 {
    if (dirName === '/samples') {
      dirName = '/user';
    }

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

  private checkReadyToSave() {
    if (!this.state.doc.fileName) {
      const fileName = prompt('Enter filename');

      if (fileName) {
        this.renameDocument(fileName);
      }
    }

    if (!this.state.doc.fileName) {
      alert('You must specify a filename in order to save');

      return false;
    }

    return true;
  }

  public async save() {
    if (this.checkReadyToSave()) {
      await this.props.app.save(this.state.doc);

      return true;
    }

    return false;
  }

  private async onFileSelected(result: FileSelectResult | null) {
    this.closeFileListModal();

    if (result) {
      const { dirName, fileName, contents } = result;

      this.handleFileContents(dirName, fileName, contents);
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
          connectionStatus={this.state.connectionStatus}
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

        {
          this.state.fileModelOpen &&
          <FileModel
            app={this.props.app}
            onSelect={(file) => this.onFileSelected(file)} />
        }
      </div>
    );
  }
}
