module.exports = function objectExpression(quasis, expressions, id, namespace) {
  return {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        method: false,
        key: {
          type: 'Identifier',
          name: 'styles',
        },
        computed: false,
        shorthand: false,
        value: {
          type: 'TemplateLiteral',
          expressions,
          quasis,
        },
      },
      {
        type: 'ObjectProperty',
        method: false,
        key: {
          type: 'Identifier',
          name: 'id',
        },
        computed: false,
        shorthand: false,
        value: {
          type: 'StringLiteral',
          extra: {
            rawValue: id,
            raw: `\u0027${id}\u0027`,
          },
          value: id,
        },
      },
      {
        type: 'ObjectProperty',
        method: false,
        key: {
          type: 'Identifier',
          name: 'namespace',
        },
        computed: false,
        shorthand: false,
        value: {
          type: 'StringLiteral',
          extra: {
            rawValue: namespace,
            raw: `\u0027${namespace}\u0027`
          },
          value: namespace,
        },
      },
    ],
  };
};