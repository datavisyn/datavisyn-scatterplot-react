/*eslint-env node, mocha */
/*global expect */
/*eslint no-console: 0*/
'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;
import createComponent from './helpers/shallowRenderHelper';

import CanvasScatterplotComponent from '../../src/react';

describe('CanvasScatterplotComponent', () => {
  let m;

  beforeEach(() => {
    m = createComponent(CanvasScatterplotComponent);
  });

  it('should have its component name as default className', () => {
    //expect(m.props.className).to.equal('index');
  });
});
