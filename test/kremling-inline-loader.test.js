const { webpackMock } = require('./utils');
const mockKremlingLoader = new webpackMock();

test(`should`, (done) => {
  mockKremlingLoader.run(
`const thing = <TestComponent />;

const otherThing = \`\${thing}\`;

const thing = k\`
  .a {
    background-color: red;
    width: 10px;
    background-img: url('test.jpg');
  }
\`;

const otherThing = k\`
  .a {
    background-color: \$\{'if test' ? 'red' : 'black'};
    width: 10px;
    background-img: url('test.jpg');
  }
\``,
    {
      sass: {},
      postcss: {},
    }, result => {
    expect(result).toBe(
      `const thing = <TestComponent />;

const otherThing = \`\${thing}\`;

const thing = { styles: '[kremling="i0"] .a,[kremling="i0"].a { background-color: red; width: 10px; background-img: url("test.jpg"); }', id: 'i0',  };

const otherThing = { styles: '[kremling="i1"] .a,[kremling="i1"].a { background-color: \$\{'if test' ? 'red' : 'black'}; width: 10px; background-img: url("test.jpg"); }', id: 'i1',  }`);
    done();
  });
});
