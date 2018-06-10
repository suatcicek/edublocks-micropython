export default function define(Blocks: Blockly.BlockDefinitions) {
  Blocks['import_oled'] = {
    init() {
      this.appendDummyInput()
        .appendField('import oled');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(336);
      this.setTooltip('Imports the OLED screen library.');
      this.setHelpUrl('http://www.example.com/');
    },
  };

  Blocks['oled_printLine'] = {
    init() {
      this.appendDummyInput()
        .appendField('oled.printLine(')
        .appendField(new Blockly.FieldTextInput('\'Hello World!\''), 'text')
        .appendField(',')
        .appendField(new Blockly.FieldNumber(0), 'line')
        .appendField(')');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip('Write a line of text');
      this.setHelpUrl('http://www.example.com/');
    },
  };
}
