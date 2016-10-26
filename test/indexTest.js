/*eslint-env node, mocha */
/*global expect */
/*eslint no-console: 0*/
'use strict';

import CanvasScatterplot from '../src';

function randomData(count = 100) {
  var r = [];
  for(let i = 0; i < count; ++i) {
    r.push({ x: Math.random(), y: Math.random()});
  }
  return r;
}

function setupCanvas(width = 100, height = 100) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

describe('CanvasScatterplot', () => {
  const data = randomData(100);
  var cs = null;

  beforeEach(() => {
    var canvas = setupCanvas(100, 100);
    cs = new CanvasScatterplot(data, canvas);
  });

  it('dummy', () => {
    expect(cs._canvas).to.be.defined();
  });
});
