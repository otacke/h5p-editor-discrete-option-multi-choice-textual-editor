import Util from '@services/util.js';
import Dictionary from '@services/dictionary.js';

import '@styles/h5peditor-discrete-option-multi-choice-textual-editor.scss';

/** Class for PDiscreteOptionMultiChoice H5P widget */
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

    this.questionTextInstance = H5PEditor.findField(
      'question', Util.getMainEditorForm(list)
    );

    // Will be used by H5P.List / H5P.SemanticsStructure
    this.helpText = this.buildHelpText();

    // DOM
    this.inputField = document.createElement('textarea');
    this.inputField.classList.add(
      'h5p-editor-discrete-option-multi-choice-textual-editor-textarea'
    );
    this.inputField.setAttribute('id', list.getId());
    if (list.getDescriptionId()) {
      this.inputField.setAttribute('aria-describedby', list.getDescriptionId());
    }
    this.inputField.setAttribute(
      'rows', DiscreteOptionMultiChoiceTextualEditor.DEFAULT_ROWS
    );
    this.inputField.setAttribute(
      'placeholder', this.dictionary.get('l10n.helpTextExampleText')
    );

    this.inputField.addEventListener('change', () => {
      this.recreateList();
    });
  }

  /**
   * Recreate the list for H5P.List.
   */
  recreateList() {
    // Get text input
    const textLines = this.inputField.value.split('\n');

    this.isRecreatingList = true;

    if (this.questionTextInstance) {
      const questionText = Util.encodeForHTML(textLines.shift());

      if (this.questionTextInstance.ckeditor?.status === 'ready') {
        this.questionTextInstance.forceValue(`<p>${questionText}</p>\n`);
      }
      else {
        this.questionTextInstance.$input.get(0).innerHTML =
          `<p>${questionText}</p>\n`;
      }

      this.questionTextInstance.validate();
    }

    // Reset list, not using list.removeAllItems() as this does not trigger events
    const listLength = this.list.getValue()?.length ?? 0;
    if (listLength > 0) {
      for (let i = listLength - 1; i >= 0; i--) {
        this.list.removeItem(i);
      }
    }

    textLines.forEach((textline) => {
      this.list.addItem(this.parseAnswerOption(textline));
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
      return;
    }

    if (!(item instanceof H5PEditor.Group)) {
      return;
    }

    if (!this.questionText && this.questionText !== '') {
      // Ensure that field is validated, so changes have been applied
      this.questionTextInstance?.validate();

      console.log(this.questionTextInstance);

      this.questionText = Util.HTMLtoPlainTextLine(
        this.questionTextInstance?.value || ''
      );
      this.inputField.value = this.questionText;
    }

    const isCorrect = H5PEditor.findField('correct', item)?.value ?? false;

    /*
     * Stringify the item fields to something along the lines of
     * *answerOption:chosenFeedback:notChosenFeedback
     * * indicates correct answer option, feedback is optional
     */
    let option = isCorrect ? '*' : '';

    const text = H5PEditor.findField('text', item)?.value || '';
    option = `${option}${Util.HTMLtoPlainTextLine(text)}`;

    const notChosenFeedback = H5PEditor.findField(
      'hintAndFeedback/notChosenFeedback', item
    )?.value;

    const chosenFeedback = H5PEditor.findField(
      'hintAndFeedback/chosenFeedback', item
    )?.value || (notChosenFeedback ? '' : undefined);

    if (chosenFeedback !== undefined) {
      option = `${option}:${Util.HTMLtoPlainTextLine(chosenFeedback)}`;
    }

    if (notChosenFeedback) {
      option = `${option}:${Util.HTMLtoPlainTextLine(notChosenFeedback)}`;
    }

    this.inputField.value = `${this.inputField.value}\n${option}`;
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    $wrapper.get(0).append(this.inputField);
    $wrapper.get(0).classList.add(
      'h5p-editor-discrete-option-multi-choice-textual-editor'
    );

    const dialog = new H5P.ConfirmationDialog({
      headerText: this.dictionary.get('l10n.warningHeaderText'),
      dialogText: this.dictionary.get('l10n.warningDialogText'),
      confirmText: this.dictionary.get('l10n.ok'),
      hideCancel: true
    });

    dialog.appendTo(document.body);
    dialog.show();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    delete this.questionText;

    this.inputField.remove();
  }

  /**
   * Parse answer option text line to extract relevant information.
   * @param {string} textline The text line containing the answer option information.
   * @returns {object} An object containing the parsed answer option details.
   * @property {string} text The HTML-encoded option text.
   * @property {boolean} correct Indicates whether the option is correct.
   * @property {object} hintAndFeedback An object containing feedback for the option.
   * @property {string} hintAndFeedback.chosenFeedback Feedback for chosen (selected) option.
   * @property {string} hintAndFeedback.notChosenFeedback Feedback for not chosen (deselected) option.
   */
  parseAnswerOption(textline) {
    const isCorrect = textline.indexOf('*') === 0;
    const optionTextRaw = isCorrect ? textline.substring(1) : textline;
    const splits = optionTextRaw.split(':');
    const notChosenFeedback = splits.length > 2 ? splits.pop() : '';
    const chosenFeedback = splits.length > 1 ? splits.pop() : '';
    const optionText = `<p>${Util.encodeForHTML(splits.join(':'))}</p>\n`;

    return {
      text: optionText,
      correct: isCorrect,
      hintAndFeedback: {
        chosenFeedback: chosenFeedback,
        notChosenFeedback: notChosenFeedback
      }
    };
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
    let translations = this.getH5PCoreL10ns([
      { local: 'helpTextTitleMain', h5pCore: 'importantInstructions' },
      { local: 'helpTextTitleExample', h5pCore: 'example' }
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
      markdownToHTML: ['helpTextIntroduction']
    });
  }

  /**
   * Get localization defaults from H5P core if possible to keep uniform.
   * @param {object[]} keyPairs containing local key and h5pCore key.
   * @returns {object} Translation object with available l10n from H5P core.
   */
  getH5PCoreL10ns(keyPairs = []) {
    const l10n = {};

    keyPairs.forEach((keys) => {
      if (typeof keys.local !== 'string' || typeof keys.h5pCore !== 'string') {
        return;
      }

      const h5pCoreTranslation = H5PEditor.t('core', keys.h5pCore);
      if (h5pCoreTranslation.indexOf('Missing translation') !== 0) {
        l10n[keys.local] = h5pCoreTranslation;
      }
    });

    return { l10n: l10n };
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
        helpTextIntroduction: 'The first line is the question and the next lines are the answer alternatives. The correct alternatives are prefixed with an asterisk(*), feedback can also be added: *alternative:tip:feedback if chosen:feedback if not chosen.',
        helpTextExample: 'What type of berry is commonly used to make a traditional Scandinavian dessert called "rødgrød"?\n*Red Currant\nBlueberry\nStrawberry',
        warningHeaderText: 'Confirm warning notice',
        warningDialogText: 'Warning! If you change the task in the textual editor all rich text formatting (incl. line breaks) will be removed.',
        ok: 'OK'
      }
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
    const introductionText = Util.markdownToHTML(
      this.dictionary.get('l10n.helpTextIntroduction'),
      { separateWithBR: true }
    );
    const description = `<div class="description">${introductionText}</div>`;

    const exampleTitle = `<div class="example-title">${this.dictionary.get('l10n.helpTextTitleExample')}</div>`;
    const exampleText = Util.markdownToHTML(
      this.dictionary.get('l10n.helpTextExample'),
      { separateWithBR: true }
    );
    const exampleTextDOM = `<div class="example-text">${exampleText}</div>`;
    const example = `<div class="example">${exampleTitle}${exampleTextDOM}</div>`;

    const body = `<div class="body">${description}${example}</div>`;

    return `${header}${body}`;
  }
}

/** @constant {number} DEFAULT_ROWS Number of rows for text area. */
DiscreteOptionMultiChoiceTextualEditor.DEFAULT_ROWS = 20;
