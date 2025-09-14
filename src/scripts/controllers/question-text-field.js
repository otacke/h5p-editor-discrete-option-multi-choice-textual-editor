import Util from '@services/util.js';
import UtilText from '@services/util-text.js';
import './question-text-field.scss';

export default class QuestionTextField {

  /**
   * Constructor for QuestionTextField class.
   * @class
   * @param {object} list - The list parameter.
   */
  constructor(list) {
    this.questionTextInstance = H5PEditor.findField(
      'question', Util.getMainEditorForm(list),
    );
  }

  /**
   * Gets the text from the question text instance.
   * @returns {string} - The text from the question text instance.
   */
  getText() {
    if (!this.questionTextInstance) {
      return '';
    }

    // Ensure that field is validated, so previous changes have been applied
    this.questionTextInstance.validate();

    return UtilText.HTMLtoPlainTextLine(this.questionTextInstance.value || '');
  }

  /**
   * Set the text for the question text instance.
   * @param {string} text Text to be set.
   */
  setText(text) {
    if (!this.questionTextInstance || typeof text !== 'string') {
      return;
    }

    text = UtilText.encodeForHTML(text);

    // HTML widgets consist of a placeholder when not active and the CKEditor field
    if (this.questionTextInstance.ckeditor?.status === 'ready') {
      this.questionTextInstance.forceValue(`<p>${text}</p>\n`);
    }
    else {
      this.questionTextInstance.$input.get(0).innerHTML =
        `<p>${text}</p>\n`;
    }

    this.questionTextInstance.validate();
  }

  /**
   * Enable the question text field.
   */
  enable() {
    if (!this.questionTextInstance) {
      return;
    }

    // HTML widgets consist of a placeholder when not active and the CKEditor field
    this.questionTextInstance.$item?.get(0).classList.remove('disabled');

    if (this.questionTextInstance.ckeditor?.status === 'ready') {
      this.questionTextInstance.ckeditor.setReadOnly(false);
    }
  }

  /**
   * Disable the question text field.
   */
  disable() {
    if (!this.questionTextInstance) {
      return;
    }

    // HTML widgets consist of a placeholder when not active and the CKEditor field
    this.questionTextInstance.$item?.get(0).classList.add('disabled');

    if (this.questionTextInstance.ckeditor?.status === 'ready') {
      this.questionTextInstance.ckeditor.setReadOnly(true);
    }
  }
}
