import React = require('preact');
import { Component } from 'preact';

interface SelectModalProps {
  title: string;

  buttons: SelectModalButton[];
  options: SelectModalOption[];

  onButtonClick(key: string): void;
  onSelect(option: SelectModalOption): void;
}

interface SelectModalState {

}

export interface SelectModalOption {
  label: string;
  obj: any;
}

export interface SelectModalButton {
  key: string;
  label: string;
  position: 'left' | 'right';
}

export default class SelectModal extends Component<SelectModalProps, SelectModalState> {
  private getButtons(): SelectModalButton[] {
    return [
      ...this.props.buttons,
      { key: 'close', label: 'Close', position: 'right' },
    ];
  }

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

        <input id="modal_1" type="checkbox" disabled={true} checked={true} />

        <label for="modal_1" class="overlay"></label>

        <article>

          <header>
            <h3>{this.props.title}</h3>
            <a class="close" onClick={() => this.props.onButtonClick('close')}>&times;</a>
          </header>

          <section class="content">
            <div class="SelectModal__grid">
              {getOptions()}
            </div>
          </section>

          <footer class="SelectModal__buttons">
            {
              this.getButtons().map((button) => (
                <button style={{ float: button.position }} onClick={() => this.props.onButtonClick(button.key)}>{button.label}</button>
              ))
            }
          </footer>

        </article>

      </div>
    );
  }
}
