import Util from '@services/util.js';
import UtilText from '@services/util-text.js';
import Dictionary from '@services/dictionary.js';
import QuestionTextField from '@controllers/question-text-field.js';

import '@styles/h5peditor-discrete-option-multi-choice-textual-editor.scss';

/** Class for DiscreteOptionMultiChoice H5P widget */
export default class DiscreteOptionMultiChoiceTextualEditor {
  /**
   * @class
   * @param {H5P.List} list List to be replaced.
   */
  constructor(list) {
    this.list = list;
    this.isRecreatingList = false;

    this.dictionary = new Dictionary();
    this.fillDictionary();

    this.questionTextField = new QuestionTextField(list);
    this.questionTextField.disable();

    // Will be used by H5P.List / H5P.SemanticsStructure
    this.helpText = this.buildHelpText();

    // DOM
    this.inputField = document.createElement('textarea');
    this.inputField.classList.add(
      'h5p-editor-discrete-option-multi-choice-textual-editor-textarea',
    );
    this.inputField.setAttribute('id', list.getId());
    if (list.getDescriptionId()) {
      this.inputField.setAttribute('aria-describedby', list.getDescriptionId());
    }
    this.inputField.setAttribute(
      'rows', DiscreteOptionMultiChoiceTextualEditor.DEFAULT_ROWS,
    );
    this.inputField.setAttribute(
      'placeholder', this.dictionary.get('l10n.helpTextExampleText'),
    );

    this.inputField.value = this.questionTextField.getText();

    this.inputField.addEventListener('change', () => {
      this.recreateList();
    });
  }

  /**
   * Recreate the list for H5P.List.
   */
  recreateList() {
    this.isRecreatingList = true;

    // Get text input and remove empty lines
    const textLines = this.inputField.value.split('\n')
      .filter((textLine) => textLine.trim() !== '');

    this.questionTextField.setText(textLines.shift());

    // Reset list, not using list.removeAllItems() as this does not trigger events
    const listLength = this.list.getValue()?.length ?? 0;
    if (listLength > 0) {
      for (let i = listLength - 1; i >= 0; i--) {
        this.list.removeItem(i);
      }
    }

    textLines.forEach((textline) => {
      this.list.addItem(UtilText.parseAnswerOption(textline));
    });

    this.isRecreatingList = false;
  }

  /**
   * Add item to text field. Called by H5P.List.
   * Will decode parameters into lines for text area.
   * @param {H5PEditor.Group} item Group item.
   */
  addItem(item) {
    if (this.isRecreatingList) {
      return; // Busy
    }

    if (!(item instanceof H5PEditor.Group)) {
      return; // Item must be a group widget field
    }

    this.inputField.value =
      `${this.inputField.value}\n${UtilText.stringifyAnswerOption(item)}`;
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    $wrapper.get(0).append(this.inputField);
    $wrapper.get(0).classList.add(
      'h5p-editor-discrete-option-multi-choice-textual-editor',
    );

    const dialog = new H5P.ConfirmationDialog({
      headerText: this.dictionary.get('l10n.warningHeaderText'),
      dialogText: this.dictionary.get('l10n.warningDialogText'),
      confirmText: this.dictionary.get('l10n.ok'),
      hideCancel: true,
    });

    dialog.appendTo(document.body);
    dialog.show();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.questionTextField.enable();
    this.inputField.remove();
  }

  /**
   * Fill Dictionary.
   */
  fillDictionary() {
    // Convert H5PEditor language strings into object.
    const plainTranslations =
      H5PEditor.language['H5PEditor.DiscreteOptionMultiChoiceTextualEditor']
        .libraryStrings || {};

    // Get l10n from H5P core if available to keep uniform translations
    let translations = Util.getH5PCoreL10ns([
      { local: 'helpTextTitleMain', h5pCore: 'importantInstructions' },
      { local: 'helpTextTitleExample', h5pCore: 'example' },
    ]);

    for (const key in plainTranslations) {
      let current = translations;
      // Assume string keys separated by . or / for defining path
      const splits = key.split(/[./]+/);
      const lastSplit = splits.pop();

      // Create nested object structure if necessary
      splits.forEach((split) => {
        if (!current[split]) {
          current[split] = {};
        }
        current = current[split];
      });

      // Add translation string if not set already
      current[lastSplit] = current[lastSplit] ?? plainTranslations[key];
    }

    translations = this.sanitizeTranslations(translations);

    this.dictionary.fill(translations, {
      markdownToHTML: ['helpTextIntroduction'],
    });
  }

  /**
   * Sanitize translations with defaults.
   * @param {object} translations Translations.
   * @returns {object} Sanitized translations.
   */
  sanitizeTranslations(translations) {
    return Util.extend({
      l10n: {
        helpTextTitleMain: 'Important instructions',
        helpTextTitleExample: 'Example',
        // eslint-disable-next-line @stylistic/js/max-len
        helpTextIntroduction: 'The first line is the question and the next lines are the answer alternatives. The correct alternatives are prefixed with an asterisk(*), feedback can also be added: *alternative:tip:feedback if chosen:feedback if not chosen.',
        // eslint-disable-next-line @stylistic/js/max-len
        helpTextExample: 'What type of berry is commonly used to make a traditional Scandinavian dessert called "rødgrød"?\n*Red Currant\nBlueberry\nStrawberry',
        warningHeaderText: 'Confirm warning notice',
        // eslint-disable-next-line @stylistic/js/max-len
        warningDialogText: 'Warning! If you change the task in the textual editor all rich text formatting (incl. line breaks) will be removed.',
        ok: 'OK',
      },
    }, translations);
  }

  /**
   * Build help text from different snippets.
   * Will look like important description widget for text fields.
   * @returns {string} HTML string representing help text.
   */
  buildHelpText() {
    // Header
    const title = `<div class="title">${this.dictionary.get('l10n.helpTextTitleMain')}</div>`;
    const header = `<div class="header">${title}</div>`;

    // Body with description and example
    const introductionText = UtilText.markdownToHTML(
      this.dictionary.get('l10n.helpTextIntroduction'),
      { separateWithBR: true },
    );
    const description = `<div class="description">${introductionText}</div>`;

    const exampleTitle = `<div class="example-title">${this.dictionary.get('l10n.helpTextTitleExample')}</div>`;
    const exampleText = UtilText.markdownToHTML(
      this.dictionary.get('l10n.helpTextExample'),
      { separateWithBR: true },
    );
    const exampleTextDOM = `<div class="example-text">${exampleText}</div>`;
    const example = `<div class="example">${exampleTitle}${exampleTextDOM}</div>`;

    const body = `<div class="body">${description}${example}</div>`;

    return `${header}${body}`;
  }
}

/** @constant {number} DEFAULT_ROWS Number of rows for text area. */
DiscreteOptionMultiChoiceTextualEditor.DEFAULT_ROWS = 20;
