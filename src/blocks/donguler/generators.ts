export default function define(Python: Blockly.BlockGenerators) {
 Blockly.Python['for'] = function(block) {
  var text_forsart = block.getFieldValue('forsart');
  var statements_name = Blockly.Python.statementToCode(block, 'NAME');
  // TODO: Assemble Python into code variable.
  var code = '...\n';
  return code;
};

Blockly.Python['while'] = function(block) {
  var text_sart = block.getFieldValue('sart');
  var statements_name = Blockly.Python.statementToCode(block, 'NAME');
  // TODO: Assemble Python into code variable.
  var code = 'for x in range(text_forsart):';
  return code;
};
 
}
