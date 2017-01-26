/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */


import * as React from 'react';
import merge from 'datavisyn-scatterplot/src/merge';
import {formatPrefix} from 'd3-format';
import {EScaleAxes, IScatterplotOptions} from 'datavisyn-scatterplot/src';
export {IScatterplotOptions} from 'datavisyn-scatterplot/src';
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
    const options: IScatterplotOptions<T> = {
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
      xlabel: this.props.chromosome,
      ylabel: '-log10 p-value',
      aspectRatio: 4 // a wild guess that x is 4 times as width as height
    };
    return React.createElement(Scatterplot, merge({options}, this.props));
  }
}
