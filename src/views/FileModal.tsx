import React = require('preact');
import { Component } from 'preact';
import SelectModal, { SelectModalOption, SelectModalButton } from './SelectModal';
import { MpFile } from '../micropython-ws';
import { App, FileSelectResult } from '../types';
import { joinDirNameAndFileName } from '../lib';

interface FileModalProps {
  app: App;

  onSelect(result: FileSelectResult | null): void;
}

interface FileModalState {
  files: MpFile[];
  cwd: string;
}

export default class FileModal extends Component<FileModalProps, FileModalState> {
  public constructor(props: FileModalProps) {
    super(props);

    this.state = {
      files: [],
      cwd: '/user',
    };
  }

  protected async componentDidMount() {
    const files = await this.props.app.listFiles(this.state.cwd);

    this.setState({ files });
  }

  private async changeDirectory(dir: string) {
    let newCwd;

    if (dir === '..') {
      newCwd = this.state.cwd.split('/').slice(0, -1).join('/');

      if (newCwd === '') {
        newCwd = '/';
      }
    } else {
      newCwd = joinDirNameAndFileName(this.state.cwd, dir);
    }

    if (!newCwd) {
      throw new Error('Invalid dir path');
    }

    const files = await this.props.app.listFiles(newCwd);

    this.setState({ files, cwd: newCwd });
  }

  private async onFileSelected(file: SelectModalOption) {
    const selectedFile = file.obj as MpFile;

    if (selectedFile.isdir) {
      await this.changeDirectory(selectedFile.filename);
    } else {
      const filePath = joinDirNameAndFileName(this.state.cwd, selectedFile.filename);

      if (!filePath) {
        throw new Error('Invalid file path');
      }

      const contents = await this.props.app.getFileAsText(filePath);

      this.props.onSelect({
        dirName: this.state.cwd,
        fileName: selectedFile.filename,
        contents,
      });
    }
  }

  private async onModalButtonClick(key: string) {
    if (key === 'up') {
      await this.changeDirectory('..');
    }

    if (key === 'close') {
      this.props.onSelect(null);
    }
  }

  public render() {
    const options = this.state.files.map((file) => ({
      label: `${file.filename} (${file.isdir ? 'Folder' : 'File'})`,
      obj: file,
    }));

    const buttons: SelectModalButton[] = this.state.cwd !== '/' ? [
      { key: 'up', label: 'Go up', position: 'left' },
    ] : [];

    return (
      <SelectModal
        title={`Browsing ${this.state.cwd}`}
        buttons={buttons}
        options={options}
        onSelect={(file) => this.onFileSelected(file)}
        onButtonClick={(key) => this.onModalButtonClick(key)} />
    );
  }
}
