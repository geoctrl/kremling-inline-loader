const kremlingInlineLoader = require('../src/kremling-inline-loader');

exports.webpackMock = function() {
  this.test = null;
  this.async = () => (err, result) => {
    return this.test(result);
  };
  this.loader = kremlingInlineLoader;
  this.run = (source, options, test) => {
    if (options) this.query = `?${JSON.stringify(options)}`;
    this.test = test;
    this.loader(source);
  };
}
