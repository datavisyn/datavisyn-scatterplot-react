/**
 * Created by sam on 12.12.2016.
 */

import * as React from 'react';
import {scaleLinear} from 'd3-scale';
import {axisLeft, axisBottom} from 'd3-axis';
import {select} from 'd3-selection';
import * as d3brush from 'd3-brush';

export interface IManhattanPlotProps {
  serverUrl: string;
  geqSignificance?: number;
  width?: number;
  height?: number;
  margin?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface IChromosome {
  name: string;
  start: number;
  end: number;
}


export default class ManhattanPlotReact extends React.Component<IManhattanPlotProps,{}> {
  static propTypes = {
    serverUrl: React.PropTypes.string.isRequired,
    geqSignificance: React.PropTypes.number
  };

  static defaultProps = {
    gegSignificance: 0.1,
    width: 1000,
    height: 400,
    margin: {
      left: 32,
      top: 10,
      bottom: 32,
      right: 10
    },
  };

  private parent: SVGSVGElement = null;

  private xscale = scaleLinear().range([this.props.margin.left, this.props.width-this.props.margin.right]);
  private yscale = scaleLinear().range([this.props.height-this.props.margin.bottom, this.props.margin.top]);
  private xaxis = axisBottom(this.xscale);
  private yaxis = axisLeft(this.yscale);
  private chromosomes: IChromosome[];

  constructor(props: IManhattanPlotProps, context?: any) {
    super(props, context);
  }

  componentDidMount() {
    (self as any).fetch(`${this.props.serverUrl}/manhattan_meta?geqSignificance=${this.props.geqSignificance}`, {
      // TODO options
    }).then((response) => response.json())
      .then((metadata: any) => {
        this.chromosomes = metadata.chromosomes;
        this.xscale.domain(metadata.xlim);
        this.yscale.domain(metadata.ylim);
        this.update();
      });
  }

  private update() {
    const $parent = select(this.parent);
    $parent.select('g.datavisyn-manhattanplot-xaxis').call(this.xaxis);
    $parent.select('g.datavisyn-manhattanplot-yaxis').call(this.yaxis);
  }

  render() {
    const margin = this.props.margin;
    const image = {
      width: this.props.width - margin.left - margin.right,
      height: this.props.height - margin.top - margin.bottom
    };

    return <svg ref={(div) => this.parent = div as SVGSVGElement} width={this.props.width} height={this.props.height}>
      <image x={margin.left} y={margin.top} width={image.width} height={image.height} preserveAspectRatio='none'
             xlinkHref={`${this.props.serverUrl}/manhattan?plain=true&geqSignificance=${this.props.geqSignificance}&width=${image.width}&height=${image.height}`}>

      </image>
      <g className='datavisyn-manhattanplot-yaxis' transform={`translate(${margin.left},0)`}>
      </g>
      <g className='datavisyn-manhattanplot-xaxis' transform={`translate(0,${image.height+margin.top})`}>
      </g>
    </svg>;
  }
}
