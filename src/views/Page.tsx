import React = require('preact');
import { Component } from 'preact';

import Nav from './Nav';
import BlocklyView from './BlocklyView';
import PythonView from './PythonView';
import TerminalView from './TerminalView';
import SelectModal from './SelectModal';
import Status from './Status';
import { App, EduBlocksXML, PythonScript, FileType } from '../types';

const ViewModeBlockly = 'blockly';
const ViewModePython = 'python';

type ViewMode = typeof ViewModeBlockly | typeof ViewModePython;

interface PageProps {
  app: App;
}

interface BlocklyDocumentState {
  fileType: typeof EduBlocksXML;
  fileName: string | null;
  xml: string | null;
  python: string | null;
  pythonClean: boolean;
}

interface PythonDocumentState {
  fileType: typeof PythonScript;
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
  files: string[];

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

      doc: {
        fileType: EduBlocksXML,
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

    if (this.state.doc.fileName) {
      if (fileType !== this.state.doc.fileType) {
        alert('You cannot change the file name extension');

        return;
      }
    }

    const doc = { ...this.state.doc, fileName };

    this.setState({ doc });

    if (fileType === PythonScript) {
      this.switchView(ViewModePython);
    } else {
      this.switchView(ViewModeBlockly);
    }
  }

  private readBlocklyContents(fileName: string, xml: string) {
    if (this.state.doc.fileType !== EduBlocksXML) { return; }

    const doc: DocumentState = {
      fileType: EduBlocksXML,
      fileName,
      xml,
      python: null,
      pythonClean: true,
    };

    this.setState({ doc });

    this.switchView(ViewModeBlockly);
  }

  private readPythonContents(fileName: string, python: string) {
    if (this.state.doc.python === python) { return; }

    const doc: DocumentState = {
      fileType: PythonScript,
      fileName,
      xml: null,
      python,
      pythonClean: false,
    };

    this.setState({ doc });

    this.switchView(ViewModePython);
  }

  private updateFromBlockly(xml: string, python: string) {
    if (
      this.state.doc.fileType === EduBlocksXML &&
      this.state.doc.xml === xml &&
      this.state.doc.python === python
    ) {
      return;
    }

    if (this.state.doc.python !== python && !this.state.doc.pythonClean) {
      alert('Python changes have been overwritten!');
    }

    const doc: DocumentState = {
      fileType: EduBlocksXML,
      fileName: this.state.doc.fileName,
      xml,
      python,
      pythonClean: true,
    };

    this.setState({ doc });
  }

  private updateFromPython(python: string) {
    if (this.state.doc.python === python) { return; }

    const doc: DocumentState = { ...this.state.doc, python, pythonClean: false };

    this.setState({ doc });
  }

  private new() {
    const doc: DocumentState = {
      fileType: EduBlocksXML,
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

  private sendCode() {
    if (!this.terminalView) { throw new Error('No terminal'); }

    if (!this.state.doc.python) {
      alert('There is no code to run');

      return;
    }

    this.setState({ terminalOpen: true });
    this.terminalView.focus();

    this.props.app.runCode(this.state.doc.python);

    setTimeout(() => this.terminalView.focus(), 250);
  }

  public async openFileListModal() {
    const files = await this.props.app.listFiles();

    this.setState({ fileListModalOpen: true, files });
  }

  public closeFileListModal() {
    this.setState({ fileListModalOpen: false });
  }

  public async openFile(file: string) {
    this.closeFileListModal();

    const contents = await this.props.app.getFileAsText(file);

    this.handleFileContents(file, contents);
  }

  private handleFileContents(file: string, contents: string): 0 {
    switch (getFileType(file)) {
      case EduBlocksXML:
        this.readBlocklyContents(file, contents);

        return 0;

      case PythonScript:
        this.readPythonContents(file, contents);

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

  public save(): 0 {
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

    switch (this.state.doc.fileType) {
      case EduBlocksXML:
        this.props.app.sendFileAsText(
          this.state.doc.fileName,
          this.state.doc.xml || '',
        );

        return 0;

      case PythonScript:
        this.props.app.sendFileAsText(
          this.state.doc.fileName,
          this.state.doc.python || '',
        );

        return 0;
    }
  }

  private onSelectFile(file: File) {
    this.props.app.sendFile(file);
  }

  private onTerminalClose() {
    this.setState({ terminalOpen: false });
  }

  public render() {
    return (
      <div id="page">
        <Nav
          onSendCode={() => this.sendCode()}
          onDownloadPython={() => { }}
          onOpenCode={() => this.openFileListModal()}
          onSaveCode={() => this.save()}
          onNewCode={() => this.new()}
          onSelectFile={(file) => this.onSelectFile(file)} />

        <Status
          connected={this.state.connected}
          fileName={this.state.doc.fileName}
          fileType={this.state.doc.fileType}
          sync={this.state.doc.pythonClean}

          onChangeName={(file) => this.renameDocument(file)} />

        <section id="workspace">
          <button
            id="toggleViewButton"
            onClick={() => this.toggleView()}>

            {this.state.viewMode}

          </button>

          {
            this.state.doc.fileType === EduBlocksXML &&
            <BlocklyView
              ref={(c) => this.blocklyView = c}
              visible={this.state.viewMode === 'blockly'}
              xml={this.state.doc.xml}
              onChange={(xml, python) => this.onBlocklyChange(xml, python)} />
          }

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
          options={this.state.files}
          visible={this.state.fileListModalOpen}
          onSelect={(file) => this.openFile(file)}
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
