/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */


import * as React from 'react';
import merge from 'datavisyn-scatterplot/src/merge';
import Impl, {IScatterplotOptions, IWindow} from 'datavisyn-scatterplot/src';
export {scale, symbol, IScatterplotOptions} from 'datavisyn-scatterplot/src';
export {default as QQPlot, IQQPlotProps} from './qqplot';
export {default as ManhattanPlot} from './ManhattanPlot';

/**
 * all scatterplot options and the data
 */
export interface IScatterplotProps<T> {
  data: T[];
  selection?: T[];

  options?: IScatterplotOptions<T>;

  onSelectionChanged?(selection: T[]);
  onWindowChanged?(window: IWindow);
}

function deepEqual<T>(a: T[], b: T[]) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((ai, i) => ai === b[i]);
}

/**
 * scatterplot component wrapping the scatterplot implementation
 */
export default class Scatterplot<T> extends React.Component<IScatterplotProps<T>,{}> {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    selection: React.PropTypes.any,
    options: React.PropTypes.object,
    onSelectionChanged: React.PropTypes.func,
    onWindowChanged: React.PropTypes.func
  };

  static defaultProps = {
    data: []
  };

  private plot: Impl<T> = null;
  private parent: HTMLDivElement = null;

  constructor(props: IScatterplotProps<T>, context?: any) {
    super(props, context);
  }

  componentDidMount() {
    //create impl
    const clone = merge({}, this.props.options);
    this.plot = new Impl(this.props.data, this.parent, this.props.options);
    this.plot.selection = this.props.selection;
    this.plot.on(Impl.EVENT_SELECTION_CHANGED, this.onSelectionChanged.bind(this));
    if (this.props.onWindowChanged) {
      this.plot.on(Impl.EVENT_WINDOW_CHANGED, this.props.onWindowChanged);
    }
    this.plot.render();
  }

  //shouldComponentUpdate?(nextProps: IScatterplotProps<T>) {
  //  return !deepEqual(this.props.selection, nextProps.selection);
  //}

  private onSelectionChanged() {
    //update my state and notify
    const s = this.plot.selection;
    if (this.props.onSelectionChanged) {
      this.props.onSelectionChanged(s);
    }
  }

  componentDidUpdate() {
    this.plot.selection = this.props.selection;
    this.plot.render();
  }

  render() {
    return (
      <div ref={(div) => this.parent = div}>
      </div>
    );
  }
}
