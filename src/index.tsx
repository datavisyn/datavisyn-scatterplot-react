/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */


import * as React from 'react';
import merge from 'datavisyn-scatterplot/src/merge';
import Impl, {IScatterplotOptions, IScatterplotBaseOptions, IWindow} from 'datavisyn-scatterplot/src';
export {scale, symbol, IScatterplotOptions, IScatterplotBaseOptions} from 'datavisyn-scatterplot/src';
export {default as QQPlot, IQQPlotProps} from './qqplot';
export {default as ManhattanPlot} from './ManhattanPlot';
export {default as LocusZoom, ILocusZoomProps} from './LocusZoom';
export {default as GeneExon, IGeneExonViewProps as IGeneExonProps} from './GeneExon';
import {isEqual} from 'lodash';

/**
 * all scatterplot options and the data
 */
export interface IScatterplotProps<T> {
  data: T[];
  selection?: T[];

  options?: IScatterplotOptions<T>;
  baseOptions?: IScatterplotBaseOptions<T>;

  onSelectionChanged?(selection: T[]);
  onWindowChanged?(window: IWindow);
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
  private renderedProps: IScatterplotProps<T> = null;
  private parent: HTMLDivElement = null;

  constructor(props: IScatterplotProps<T>, context?: any) {
    super(props, context);
  }

  private build() {
    this.renderedProps = {
      options: merge({}, this.props.options),
      baseOptions: merge({}, this.props.baseOptions),
      data: this.props.data
    };
    if (this.plot) {
      this.parent.innerHTML = ''; //clear
    }
    this.plot = new Impl(this.renderedProps.data, this.parent, this.renderedProps.options, this.renderedProps.baseOptions);
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

  componentDidMount() {
    this.build();
  }

  componentDidUpdate() {
    if (!this.renderedProps) { // || !isEqual(this.props.options, this.renderedProps.options)) {
      this.build();
    } else if (!isEqual(this.props.data, this.renderedProps.data)) {
      this.build();
    } else {
      this.plot.selection = this.props.selection;
      this.plot.render();
    }
  }

  render() {
    return (
      <div ref={(div) => this.parent = div}>
      </div>
    );
  }
}
