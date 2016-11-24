/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */


import * as React from 'react';
import merge from 'datavisyn-scatterplot/src/merge';
import {EScaleAxes} from 'datavisyn-scatterplot/src';
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
    onSelectionChanged: React.PropTypes.func
  };

  static defaultProps = {
    data: [],
    onSelectionChanged: ()=>undefined,
    chromosome: 'Chromosome'
  };


  constructor(props: ILocusZoomProps<T>, context?: any) {
    super(props, context);
  }

  render() {
    return React.createElement(Scatterplot, merge({
      options: {
        scale: EScaleAxes.x,
        xlabel: this.props.chromosome + ' (Mb)',
        ylabel: '-log_10 p-value'
      }
    },this.props));
  }
}
