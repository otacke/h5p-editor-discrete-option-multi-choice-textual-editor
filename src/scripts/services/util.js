import { decode, encode } from 'he';
import showdown from 'showdown';

/** Class for utility functions */
export default class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (
            typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object'
          ) {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

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

    return Util.stripHTML(decode(html));
  }

  /**
   * Convert HTML content into a single line of plain text.
   * @param {string} html HTML content to convert to plain text.
   * @returns {string} Plain text representation of the HTML content.
   */
  static HTMLtoPlainTextLine(html) {
    html = Util.purifyHTML(html);

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
   * Retrieve the main editor form for an H5PEditor widget instance.
   * @param {object} instance H5PEditor widget instance.
   * @returns {H5PEditor.Form|null} Main editor form, or null if not found.
   */
  static getMainEditorForm(instance) {
    if (!instance || typeof instance !== 'object') {
      return null;
    }

    if (instance instanceof H5PEditor.Form) {
      return instance;
    }

    return Util.getMainEditorForm(instance.parent);
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
}
