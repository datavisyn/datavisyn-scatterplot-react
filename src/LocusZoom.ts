/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */


import * as React from 'react';
import merge from 'datavisyn-scatterplot/src/merge';
import {formatPrefix} from 'd3-format';
import {EScaleAxes, IScatterplotOptions, IScatterplotBaseOptions} from 'datavisyn-scatterplot/src';
export {IScatterplotOptions, IScatterplotBaseOptions} from 'datavisyn-scatterplot/src';
import Scatterplot, {IScatterplotProps} from './index';

export interface ILocusZoomProps<T> extends IScatterplotProps<T> {
  chromosome?: string;
}

export default class LocusZoom<T> extends React.Component<ILocusZoomProps<T>,{}> {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    selection: React.PropTypes.any,
    options: React.PropTypes.object,
    onSelectionChanged: React.PropTypes.func,
    onWindowChanged: React.PropTypes.func
  };

  static defaultProps = {
    data: [],
    onSelectionChanged: () => undefined,
    chromosome: 'Chromosome'
  };


  constructor(props: ILocusZoomProps<T>, context?: any) {
    super(props, context);
  }

  render() {
    const baseOptions: IScatterplotBaseOptions<T> = {
        margin: {
          left: 50,
          bottom: 30
        },
        format: {
          x: formatPrefix('.2', 1e6) // SI-prefix with two significant digits, "42M"
        },
        zoom: {
          scale: EScaleAxes.x
        },
        aspectRatio: 5 // a wild guess that x is 5 times as width as height
    };

    const options: IScatterplotOptions<T> = {
      xlabel: this.props.chromosome,
      ylabel: '-log10 p-value',
    };
    return React.createElement(Scatterplot, merge({options}, {baseOptions}, this.props.baseOptions, this.props.options, this.props));
  }
}
