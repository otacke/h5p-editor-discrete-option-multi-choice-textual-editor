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
   * Get localization defaults from H5P core if possible to keep uniform.
   * @param {object[]} keyPairs containing local key and h5pCore key.
   * @returns {object} Translation object with available l10n from H5P core.
   */
  static getH5PCoreL10ns(keyPairs = []) {
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
}
