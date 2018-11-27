export default function define(Blocks: Blockly.BlockDefinitions) {
 Blockly.Blocks['for'] = {
  init: function() {
    this.appendStatementInput("NAME")
        .setCheck("String")
        .appendField(new Blockly.FieldTextInput("... kere"), "forsart")
        .appendField("tekrarla");
    this.setColour(60);
 this.setTooltip("deneme");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['while'] = {
  init: function() {
    this.appendStatementInput("NAME")
        .setCheck(null)
        .appendField(new Blockly.FieldTextInput("... olana kadar"), "sart")
        .appendField("dön");
    this.setColour(230);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};
 
}
