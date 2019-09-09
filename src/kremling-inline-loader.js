const { getOptions } = require('loader-utils');
const sass = require('sass');
const parseKremling = require('./parse-kremling');
const { runPostCss } = require('./utils');

let globalId = 0;

module.exports = function kremlingInlineLoader(source) {
  const loaderOptions = getOptions(this) || {};
  const kremlings = parseKremling(source);
  const callback = this.async();

  // no kremlings found
  if (kremlings.length === 0) {
    return callback(null, source);
  }

  kremlings.forEach(kremling => {
    kremling.code = source.slice(kremling.start, kremling.end);
    kremling.id = `i${globalId}`;
    globalId += 1;
    const offset = kremling.start;
    kremling.placeholders.forEach((placeholder, i) => {
      placeholder.code = kremling.code.slice(placeholder.start - offset, placeholder.end - offset);
      placeholder.id = `__kremling_placeholder_${i}__`;
      kremling.code = `${kremling.code.slice(0, placeholder.start - offset)}${placeholder.id}${kremling.code.slice(placeholder.end - offset)}`;
    });

    if (loaderOptions.sass) {
      try {
        const { data, ...sassOptions } = loaderOptions.sass;
        kremling.code = sass.renderSync({
          data: (data || '') + kremling.code,
          ...sass
        }).css.toString();
      } catch (e) {
        throw Error(e);
      }
    }
  });

  let kremlingNamespace = 'kremling';
  let kremlingNamespaceString = '';
  if (loaderOptions.namespace && typeof loaderOptions.namespace === 'string') {
    kremlingNamespace = loaderOptions.namespace;
    kremlingNamespaceString = `namespace: '${loaderOptions.namespace}'`;
  }
  const defaultOptions = {
    plugins: {},
    ...loaderOptions.postcss,
  };

  const { plugins, ...restOfOptions } = defaultOptions;
  const pluginsInit = (Object.keys(plugins)).map(key => {
    return require(key)(plugins[key]);
  });

  Promise.all(kremlings.map(kremling => {
    return runPostCss(kremling.code, pluginsInit, restOfOptions, kremling.id, kremlingNamespace);
  })).then(results => {
    let newSource = '';

    // put code back into source
    kremlings.forEach((kremling, i) => {
      const first = i === 0
        ? source.slice(0, kremling.start - 2)
        : '';
      const last = kremlings.length - 1 === i
        ? source.slice(kremling.end + 1)
        : source.slice(kremling.end + 1, kremlings[i + 1].start - 2);
      newSource += `${first}{ styles: '${results[i].replace(/\s+/g, ' ').replace(/'/g, '\'')}', id: '${kremling.id}', ${kremlingNamespaceString} }${last}`;
    });

    // replace placeholders
    kremlings.forEach(kremling => {
      kremling.placeholders.forEach(placeholder => {
        newSource = newSource.replace(placeholder.id, placeholder.code);
      });
    });
    callback(null, newSource);
  });
};

