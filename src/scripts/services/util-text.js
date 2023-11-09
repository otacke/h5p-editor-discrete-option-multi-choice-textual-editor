import { decode, encode } from 'he';
import showdown from 'showdown';

/** Class for text utility functions */
export default class UtilText {
  /**
   * Retrieve string without HTML tags.
   * @param {string} html Input string.
   * @returns {string} Output string.
   */
  static stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * HTML decode and strip HTML.
   * @param {string|object} html html.
   * @returns {string} html value.
   */
  static purifyHTML(html) {
    if (typeof html !== 'string') {
      return '';
    }

    return UtilText.stripHTML(decode(html));
  }

  /**
   * Convert HTML content into a single line of plain text.
   * @param {string} html HTML content to convert to plain text.
   * @returns {string} Plain text representation of the HTML content.
   */
  static HTMLtoPlainTextLine(html) {
    html = UtilText.purifyHTML(html);

    return html
      .replace(/[\n\r]/g, ' ')
      .replace(/\s\s+/g, ' ')
      .trim();
  }

  /**
   * Decode HTML to plain text.
   * @param {string} html HTML.
   * @returns {string} Text decoded from HTML. Careful, can contain HTML tags!
   */
  static decodeForText(html) {
    return decode(html);
  }

  /**
   * Encode text to be printable as HTML.
   * @param {string} text Text.
   * @returns {string} Text encoded for HTML display.
   */
  static encodeForHTML(text) {
    return encode(text);
  }

  /**
   * Convert markdown to html.
   * @param {string} markdown Markdown text.
   * @param {object} [options] Options.
   * @param {boolean} [options.separateWithBR] True separate parapgraphs with breaks.
   * @returns {string} HTML text.
   */
  static markdownToHTML(markdown, options = {}) {
    const converter = new showdown.Converter();
    let html = converter.makeHtml(markdown);

    if (options.separateWithBR) {
      html = html
        .replace(/<\/p>(\n)?<p>/g, '\n\n')
        .replace(/<(\/)?p>/g, '')
        .replace(/\n/g, '<br />');
    }

    return html;
  }

  /**
   * Stringify the list item fields.
   * Will result in something along the lines of
   * `*answerOption:chosenFeedback:notChosenFeedback`
   * where * indicates correct answer option, feedback is optional
   * @param {H5PEditor.Group} item List item.
   * @returns {string} Stringified list item fields.
   */
  static stringifyAnswerOption(item) {
    const isCorrect = H5PEditor.findField('correct', item)?.value ?? false;
    let option = isCorrect ? '*' : '';

    const text = H5PEditor.findField('text', item)?.value || '';
    option = `${option}${UtilText.HTMLtoPlainTextLine(text)}`;

    const notChosenFeedback = H5PEditor.findField(
      'hintAndFeedback/notChosenFeedback', item
    )?.value;

    const chosenFeedback = H5PEditor.findField(
      'hintAndFeedback/chosenFeedback', item
    )?.value || (notChosenFeedback ? '' : undefined);

    if (chosenFeedback !== undefined) {
      option = `${option}:${UtilText.HTMLtoPlainTextLine(chosenFeedback)}`;
    }

    if (notChosenFeedback) {
      option = `${option}:${UtilText.HTMLtoPlainTextLine(notChosenFeedback)}`;
    }

    return option;
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
  static parseAnswerOption(textline) {
    const isCorrect = textline.indexOf('*') === 0;
    const optionTextRaw = isCorrect ? textline.substring(1) : textline;
    const splits = optionTextRaw.split(':');
    const notChosenFeedback = splits.length > 2 ? splits.pop() : '';
    const chosenFeedback = splits.length > 1 ? splits.pop() : '';
    const optionText = `<p>${UtilText.encodeForHTML(splits.join(':'))}</p>\n`;

    return {
      text: optionText,
      correct: isCorrect,
      hintAndFeedback: {
        chosenFeedback: chosenFeedback,
        notChosenFeedback: notChosenFeedback
      }
    };
  }
}
