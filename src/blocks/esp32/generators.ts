export default function define(Python: Blockly.BlockGenerators) {
  Python['import_oled'] = function (block) {
    return 'import oled\n';
  };

  Python['import_machine'] = function (block) {
    return 'import machine\n';
  };

  Python['oled_printLine'] = function (block) {
    const text = block.getFieldValue('text');
    const line = block.getFieldValue('line');

    return `oled.printLine(${text}, ${line})\n`;
  };

  Python['pin_in_declare'] = function (block) {
    const pin_name = block.getFieldValue('pin_name');
    const pin_number = block.getFieldValue('pin_number');
    const pull_up_down = block.getFieldValue('pull_up_down');

    return `${pin_name} = machine.Pin(${pin_number}, machine.Pin.IN, machine.Pin.${pull_up_down})\n`;
  };

  Python['pin_out_declare'] = function (block) {
    const pin_name = block.getFieldValue('pin_name');
    const pin_number = block.getFieldValue('pin_number');

    return `${pin_name} = machine.Pin(${pin_number}, machine.Pin.OUT)\n`;
  };

  Python['pin_value_get'] = function (block) {
    const var_name = block.getFieldValue('var_name');
    const pin_name = block.getFieldValue('pin_name');

    return `${var_name} = ${pin_name}.value()\n`;
  };

  Python['pin_value_set'] = function (block) {
    const pin_name = block.getFieldValue('pin_name');
    const value = block.getFieldValue('value');

    return `${pin_name}.value(${value})\n`;
  };
}
