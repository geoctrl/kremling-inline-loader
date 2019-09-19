const { getOptions } = require('loader-utils');
const sass = require('sass');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const postcss = require('postcss/lib/postcss');
const postcssKremlingPlugin = require('kremling-loader/src/postcss-kremling-plugin');
const objectExpression = require('./object-expression');

const placeholder = '__KREMLING_PLACEHOLDER__';
let globalId = 0;

module.exports = function kremlingInlineLoader(source) {
  const loaderOptions = getOptions(this) || {};
  const callback = this.async();

  const ats = parser.parse(source, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'classProperties',
    ],
  });

  let kremlingNamespace = 'kremling';
  if (loaderOptions.namespace && typeof loaderOptions.namespace === 'string') {
    kremlingNamespace = loaderOptions.namespace;
  }
  const defaultOptions = {
    plugins: {},
    ...loaderOptions.postcss,
  };

  const { plugins, ...restOfOptions } = defaultOptions;
  const pluginsInit = (Object.keys(plugins)).map(key => {
    return require(key)(plugins[key]);
  });

  async function findK(next) {
    if (Array.isArray(next)) {
      try {
        next = await Promise.all(next.map(async n => await findK(n)))
      } catch (e) {}
    } else if (typeof next === 'object') {
      if (next.init && next.init.type === 'TaggedTemplateExpression' && next.init.tag && next.init.tag.name === 'k') {
        const id = globalId;
        globalId += 1;

        let evalString = next.init.quasi.quasis.map((item, i) => {
          return `${item.value.raw}${next.init.quasi.expressions[i] ? placeholder : ''}`;
        }).join('');

        if (loaderOptions.sass) {
          try {
            const { data, ...sassOptions } = loaderOptions.sass;
            evalString = sass.renderSync({
              data: (data || '') + evalString,
              ...sassOptions
            }).css.toString();
          } catch (e) {
            console.log(e)
            throw Error(e);
          }
        }

        let postCssResult;
        try {
          postCssResult = await postcss([...pluginsInit, postcssKremlingPlugin(`i${id}`, kremlingNamespace)])
            .process(evalString, {
              ...restOfOptions,
              to: './',
              from: './',
            });
        } catch (e) {}
        const pieces = postCssResult.css.split(placeholder);
        const quasis = next.init.quasi.quasis.map((item, i) => {
          item.value.raw = item.value.cooked = pieces[i];
          return item;
        });
        next.init = objectExpression(quasis, next.init.quasi.expressions, `i${id}`, kremlingNamespace);
      } else {
        try {
          const keys = Object.keys(next);
          const list = await Promise.all(keys.map(async key => await findK(next[key])));
          next = keys.reduce((acc, key, i) => ({ ...acc, [key]: list[i] }), {});
        } catch (e) {}
      }
    }
    return next;
  }

  findK(ats).then(res => {
    const { code } = generate(res, {});
    callback(null, code);
  });
}