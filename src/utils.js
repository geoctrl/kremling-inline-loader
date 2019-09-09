const postcss = require('postcss');
const postcssKremling = require('kremling-loader/src/postcss-kremling-plugin');

exports.startOfExpression = (char) => {
  const captureGroup = /,|=|>|<|\/|\*|-|\+|%|&|\^|\||~|!|\?|:|\[|{|\(|\s/;
  return captureGroup.test(char);
}

exports.runPostCss = (source, plugins, options, id, namespace) => {
  return new Promise(resolve => {
    postcss([ ...plugins, postcssKremling(id, namespace)() ])
      .process(source, {
        ...options,
        to: './',
        from: './',
      })
      .then((result) => {
        resolve(result.css || source);
      });
  });
}
