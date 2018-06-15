import React = require('preact');
import { Component } from 'preact';

interface SelectModalProps {
  title: string;
  visible: boolean;
  options: SelectModalOption[];

  onCancel(): void;
  onSelect(option: SelectModalOption): void;
}

interface SelectModalState {

}

export interface SelectModalOption {
  label: string;
  obj: any;
}

export default class SelectModal extends Component<SelectModalProps, SelectModalState> {
  public render() {
    const getOptions = () => this.props.options.map((option) => ([
      <div class="SelectModal__cell SelectModal__cell--text">
        <span>{option.label}</span>
      </div>,
      <div class="SelectModal__cell SelectModal__cell--action">
        <button onClick={() => this.props.onSelect(option)}>Select</button>
      </div>,
    ]));

    return (
      <div class="SelectModal modal">
        <input id="modal_1" type="checkbox" disabled={true} checked={this.props.visible} />
        <label for="modal_1" class="overlay"></label>
        <article>
          <header>
            <h3>{this.props.title}</h3>
            <a class="close" onClick={this.props.onCancel}>&times;</a>
          </header>
          <section class="content">
            <div class="SelectModal__grid">
              {getOptions()}
            </div>
          </section>
          <footer class="SelectModal__buttons">
            <button onClick={this.props.onCancel}>Close</button>
          </footer>
        </article>
      </div>
    );
  }
}
