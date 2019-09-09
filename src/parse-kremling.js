const { startOfExpression } = require('./utils');

module.exports = function parseKremling(src) {
  let kremlings = [];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let templateLiterals = 0;
  let placeholders = 0;
  let inComment = false;
  let inCommentMulti = false;

  function next(char, index) {
    const inTemplateLiteralQuote = templateLiterals > placeholders;
    const currentKremling = kremlings.length ? kremlings[kremlings.length - 1] : null;

    /** COMMENTS **/
    if (!inComment &&
      !inCommentMulti &&
      !inSingleQuote &&
      !inDoubleQuote &&
      !inTemplateLiteralQuote &&
      /\//.test(char) && /\//.test(src.slice(index + 1, index + 2))
    ) {
      inComment = true;
    }
    if (!inComment &&
      !inCommentMulti &&
      !inSingleQuote &&
      !inDoubleQuote &&
      !inTemplateLiteralQuote &&
      char === '*' &&
      src.slice(index - 1, index) === '/'
    ) {
      inCommentMulti = true;
      return;
    }
    if (inComment && /\n/.test(char)) {
      inComment = false;
      return;
    }
    if (inCommentMulti &&
      char === '/' &&
      src.slice(index - 1, index) === '*') {
      inCommentMulti = false;
      return;
    }
    if (inComment || inCommentMulti) return;

    /** QUOTES **/
    /** CLOSE **/
    if (char === `'` && inSingleQuote && !inDoubleQuote && !inTemplateLiteralQuote) {
      inSingleQuote = false;
      return;
    }
    if (char === `"` && inDoubleQuote && !inSingleQuote && !inTemplateLiteralQuote) {
      inDoubleQuote = false;
      return;
    }

    if (char === '`') {
      //
    }

    if (char === '`' &&
      inTemplateLiteralQuote &&
      !inDoubleQuote &&
      !inSingleQuote
    ) {
      templateLiterals--;
      if (templateLiterals === 0 &&
        currentKremling &&
        !currentKremling.end
      ) {
        currentKremling.end = index;
      }
      return;
    }
    /** OPEN **/
    if (char === `'` && !inTemplateLiteralQuote) {
      inSingleQuote = true;
      return;
    }
    if (char === `"` && !inTemplateLiteralQuote) {
      inDoubleQuote = true;
      return;
    }
    if (char === '`' && !inTemplateLiteralQuote) {
      templateLiterals++;
      if (
        src.slice(index - 1, index) === 'k' &&
        startOfExpression(src.slice(index - 2, index - 1))
      ) {
        kremlings.push({
          start: index + 1,
          placeholders: [],
        });
      }
      return;
    }
    if (inSingleQuote || inDoubleQuote || !kremlings.length) {
      return;
    }


    /** PLACEHOLDERS **/
    if (inTemplateLiteralQuote &&
      templateLiterals > 0 &&
      char === '{' &&
      src.slice(index - 1, index) === '$'
    ) {
      placeholders++;
      if (templateLiterals === 1) {
        currentKremling.placeholders.push({
          start: index - 1,
        });
      }
    }
    if (!inTemplateLiteralQuote && char === '}' && templateLiterals > 0) {
      placeholders--;
      if (templateLiterals === 1) {
        currentKremling.placeholders[currentKremling.placeholders.length - 1].end = index + 1;
      }
    }
  }

  const chars = src.split('');
  for (let i = 0; i < chars.length; i++) {
    next(chars[i], i);
  }
  return kremlings;
}
