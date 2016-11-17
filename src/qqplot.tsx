/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */


import * as React from 'react';
import merge from 'datavisyn-scatterplot/src/merge';
import Impl, {IScatterplotOptions} from 'datavisyn-scatterplot/src';
import {quantile} from 'd3-array';

export class XY {
  constructor(public x: number, public y: number, public q: number) {

  }
  toString() {
    return `Quantile ${this.q}: x = ${this.x}, y = ${this.y}`;
  }
}

/**
 * all scatterplot options and the data
 */
export interface IQQPlotProps {
  a: number[];
  b: number[];

  options?: IScatterplotOptions<XY>;
}

function byNumber(a: number, b: number) {
  return a - b;
}

/**
 * see R ppoints function
 * (1:m - a)/(m + (1-a)-a) where m is either n, if length(n)==1, or length(n)
 * ppoints(n, a = if(n <= 10) 3/8 else 1/2)
 * @param length
 * @returns {Array}
 */
function ppoints(n: number|number[], a?: number) {
  const m = Array.isArray(n) ? n.length : n as number;
  if (a === undefined) {
    a = m <= 10 ? 3. / 8 : 1. / 2;
  }
  const factor = 1 / (m + (1 - a) - a);

  const r: number[] = [];
  for (let i = 1; i <= (m - a); ++i) {
    r.push(i * factor);
  }
  return r;
}

/**
 * compute data for QQ plot
 * @param a
 * @param b
 * @returns {Array}
 */
function computeData(a: number[], b: number[]): XY[] {
  const a_sorted = a.slice().sort(byNumber);
  const b_sorted = b.slice().sort(byNumber);
  return ppoints(Math.min(a_sorted.length, b_sorted.length)).map((q) => {
    return new XY(quantile(a_sorted, q), quantile(b_sorted, q), q);
  });
}

export default class QQPlot extends React.Component<IQQPlotProps,{}> {
  static propTypes = {
    a: React.PropTypes.array.isRequired,
    b: React.PropTypes.array.isRequired,
    options: React.PropTypes.object
  };

  static defaultProps = {
    a: [],
    b: []
  };

  private plot: Impl<XY> = null;
  private parent: HTMLDivElement = null;

  constructor(props: IQQPlotProps, context?: any) {
    super(props, context);
  }

  componentDidMount() {
    //create impl
    var clone = merge({
      isSelectEvent: null
    }, this.props.options);
    const data = computeData(this.props.a, this.props.b);
    this.plot = new Impl<XY>(data, this.parent, clone);
    this.plot.render();
    console.log('b');
  }

  componentDidUpdate() {
    //new data recreate
    console.log('ads');
    const data = computeData(this.props.a, this.props.b);
    this.plot.data = data;
  }

  render() {
    return (
      <div ref={(div) => this.parent = div}>
      </div>
    );
  }
}
