import React = require('preact');
import { Component } from 'preact';

interface NavProps {
  onDownloadPython(): void;
  onNewCode(): void;
  onOpenCode(): void;
  onSaveCode(): void;
  onSendCode(): void;
  onSelectFile(file: File): void;
}

export default function Nav(props: NavProps) {
  function onFileSelected(target: any) {
    props.onSelectFile(target.files[0]);
  }

  return (
    <nav>
      <a class="brand">
        <img class="logo" src="images/logo.png" />
        <span>EduBlocks</span>
      </a>

      <input id="bmenub" type="checkbox" class="show" />
      <label for="bmenub" class="burger pseudo button">menu</label>

      <input type="file" class="file" onChange={(e) => onFileSelected(e.target)} />

      <div class="menu">
        {/* <a class="button" title="Download Python Source Code" href="javascript:void(0)" onClick={() => props.onDownloadPython()}>
          Python Download
        </a> */}

        <a class="button icon-plus" title="New" href="javascript:void(0)" onClick={() => props.onNewCode()}>
          New
        </a>

        <a class="button icon-folder-open" title="Open a file" href="javascript:void(0)" onClick={() => props.onOpenCode()}>
          Open
        </a>

        <a class="button icon-floppy" title="Save a file" href="javascript:void(0)" onClick={() => props.onSaveCode()}>
          Save
        </a>

        <a class="button icon-play" title="Run your code" href="javascript:void(0)" onClick={() => props.onSendCode()}>
          Run
        </a>
      </div>
    </nav>
  );
}
