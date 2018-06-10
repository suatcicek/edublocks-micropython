export default function define(Python: Blockly.BlockGenerators) {
  Python['import_oled'] = function (block) {
    const code = 'import oled\n';
    return code;
  };

  Python['oled_printLine'] = function (block) {
    const text = block.getFieldValue('text');
    const line = block.getFieldValue('line');
    // TODO: Assemble Python into code variable.
    const code = 'oled.printLine(' + text + ', ' + line + ')\n';
    return code;
  };
}
