const { webpackMock } = require('./utils');
const mockKremlingLoader = new webpackMock();

test('should handle JS and prepend kremling', (done) => {
  mockKremlingLoader.run(
`const test = k\`.a {
  background: \${'red' ? 'red' : 'blue'};
}\``,
    null,
    (result) => {
      expect(result).toBe(
`const test = {
  styles: \`[kremling="i0"] .a,[kremling="i0"].a {
  background: \${'red' ? 'red' : 'blue'};
}\`,
  id: 'i0',
  namespace: 'kremling'
};`);
      done();
    });
});

test('should handle sass if option is passed in', (done) => {
  mockKremlingLoader.run(
`const thing = <div className="no-company"></div>;
const obj = { test: 'test' }
const css = k\`
  .no-company {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
    font-size: 1.6rem;

    .side {
      background-color: red;
    }
  }
\`;`, {
      sass: {},
    }, result => {
      expect(result).toBe(
`const thing = <div className="no-company"></div>;
const obj = {
  test: 'test'
};
const css = {
  styles: \`[kremling="i1"] .no-company,[kremling="i1"].no-company {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
  font-size: 1.6rem;
}
[kremling="i1"] .no-company .side,[kremling="i1"].no-company .side {
  background-color: red;
}\`,
  id: 'i1',
  namespace: 'kremling'
};`);
      done();
    });
});