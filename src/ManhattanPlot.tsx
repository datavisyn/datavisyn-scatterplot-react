/**
 * Created by sam on 12.12.2016.
 */

import * as React from 'react';
import {scaleLinear} from 'd3-scale';
import {axisLeft, axisBottom} from 'd3-axis';
import {select, event as d3event} from 'd3-selection';
import {drag} from 'd3-drag';
import {brushX, D3BrushEvent} from 'd3-brush';


export interface IWindow {
  fromChromosome: string;
  fromLocation: number;
  toChromosome: string;
  toLocation: number;
}

export interface IManhattanPlotProps {
  serverUrl: string;
  geqSignificance?: number;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  margin?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };

  onSignificanceChanged?(geqSignificance: number);
  onWindowChanged?(window: IWindow);
  onMetadataLoaded?(xlim: number[], ylim: number[], chromosomes: IChromosome[]);

  snapToChromosome?: boolean;
  detailWindow?: number[];
}

export interface IChromosome {
  name: string;
  start: number;
  end: number;
  shift: number;
}

export interface IManhattanPlotState {
  chromosomes: IChromosome[];
  xlim: [number, number];
  ylim: [number, number];
  geqSignificance: number;
}

export default class ManhattanPlotReact extends React.Component<IManhattanPlotProps,IManhattanPlotState> {
  static propTypes = {
    serverUrl: React.PropTypes.string.isRequired,
    geqSignificance: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    margin: React.PropTypes.any,
    onSignificanceChange: React.PropTypes.func,
    onWindowChange: React.PropTypes.func,
  };

  static defaultProps = {
    geqSignificance: 5,
    width: 1000,
    height: 400,
    yAxisLabel: 'y axis',
    xAxisLabel: 'x axis',
    margin: {
      left: 50,
      top: 10,
      bottom: 42,
      right: 10
    },
    snapToChromosome: false
  };

  private parent: SVGSVGElement = null;

  private xscale = scaleLinear().range([this.props.margin.left, this.props.width - this.props.margin.right]);
  private yscale = scaleLinear().range([this.props.height - this.props.margin.bottom, this.props.margin.top]);
  private xaxis = axisBottom(this.xscale);
  private yaxis = axisLeft(this.yscale);

  constructor(props: IManhattanPlotProps, context?: any) {
    super(props, context);
  }

  private fetchData() {
    (self as any).fetch(`${this.props.serverUrl}/manhattan_meta?geq_significance=${this.props.geqSignificance}`).then((response) => response.json())
      .then((metadata: any) => {
        if (this.props.onMetadataLoaded) {
          this.props.onMetadataLoaded(metadata.xlim, metadata.ylim, metadata.chromosomes);
        }
        this.setState(Object.assign({geqSignificance: this.props.geqSignificance}, metadata));
      });
  }

  componentDidMount() {
    this.fetchData();
  }

  private toRelative(absloc: number) {
    const c = this.state.chromosomes.find((d) => d.start <= absloc && d.end >= absloc);
    return {
      name: c.name,
      location: absloc - c.shift
    };
  }

  componentDidUpdate() {
    if (!this.state.chromosomes) {
      return;
    }
    if (this.state.geqSignificance !== this.props.geqSignificance) {
      this.fetchData();
    }
    this.xscale.domain(this.state.xlim);
    this.yscale.domain(this.state.ylim);
    this.xaxis.tickValues(this.state.chromosomes.map((d) => Math.floor((d.start+d.end)/2)));
    this.xaxis.tickFormat((center: number) => {
      return this.state.chromosomes.find((d) => center >= d.start && center <= d.end).name;
    });

    const $parent = select(this.parent);
    $parent.select('g.datavisyn-manhattanplot-xaxis').call(this.xaxis);
    $parent.select('g.datavisyn-manhattanplot-yaxis').call(this.yaxis);
    const margin = this.props.margin;

    const sigline = this.yscale(this.props.geqSignificance);
    const $lineArea = $parent.select('rect.datavisyn-manhattanplot-significance-hidden');
    const $line = $parent.select('line.datavisyn-manhattanplot-significance').call(drag().on('drag', () => {
      const y = Math.max(margin.top, Math.min(this.props.height-margin.bottom,d3event.y));

      $line.attr('y1', y);
      $line.attr('y2', y);
      $lineArea.attr('y', y).attr('height', (this.props.height-margin.bottom-y));
      const sig = this.yscale.invert(y);
      if (this.props.onSignificanceChanged) {
        this.props.onSignificanceChanged(sig);
      }
    })).attr('y1', sigline)
      .attr('y2', sigline);
    $lineArea.attr('y', sigline).attr('height', (this.props.height-margin.bottom-sigline));

    const onBrushEnd = ($elem) => {
        const event = (d3event as D3BrushEvent<any>);
        const s : [number, number] = event.selection as any;
        if (!event.sourceEvent) {
          return; // Only transition after input.
        }

        if (s) {
          if (this.props.snapToChromosome) {
            const absloc = Math.floor(this.xscale.invert(s[0]));
            const c = this.state.chromosomes.find((d) => d.start <= absloc && d.end >= absloc);

            $elem.transition().call(event.target.move, [c.start, c.end].map(this.xscale));
            if (this.props.onWindowChanged) {
              this.props.onWindowChanged({fromChromosome: c.name, fromLocation: c.start - c.shift, toChromosome: c.name, toLocation: c.end - c.shift});
            }
          } else if (this.props.onWindowChanged) {
            const from = this.toRelative(Math.floor(this.xscale.invert(s[0])));
            const to = this.toRelative(Math.ceil(this.xscale.invert(s[1])));
            this.props.onWindowChanged({fromChromosome: from.name, fromLocation: from.location, toChromosome: to.name, toLocation: to.location});
          }
        } else {
          if (this.props.onWindowChanged) {
            this.props.onWindowChanged(null);
          }
        }
      };

    $parent.select('g.datavisyn-manhattanplot-brush').call(brushX().on('end', function() {
      onBrushEnd(select(this));
    }).extent([[margin.left, margin.top], [this.props.width - margin.right, this.props.height - margin.bottom]]));

    if (this.props.detailWindow) {
      const detailWindow = this.props.detailWindow;
      const x1 = this.xscale(detailWindow[0]);
      const x2 = this.xscale(detailWindow[1]);
      const width = Math.max(x2-x1, 1);
      $parent.select('rect.datavisyn-manhattanplot-detail-window')
        .attr('x', x1)
        .attr('y', margin.top)
        .attr('width', width)
        .attr('height', this.props.height - margin.bottom - margin.top);
    }
  }

  render() {
    const margin = this.props.margin;
    const image = {
      width: this.props.width - margin.left - margin.right,
      height: this.props.height - margin.top - margin.bottom
    };

    return <svg ref={(div) => this.parent = div as SVGSVGElement} width={this.props.width} height={this.props.height}>
      <g style={{pointerEvents: 'none'}}>
        <image x={margin.left} y={margin.top} width={image.width} height={image.height} preserveAspectRatio="none" xlinkHref={`${this.props.serverUrl}/manhattan?plain=true&geq_significance=${this.props.geqSignificance}&width=${image.width}&height=${image.height}`} />
        <g className="datavisyn-manhattanplot-yaxis" transform={`translate(${margin.left},0)`} />
        <text transform={`translate(${margin.left/4}, ${image.height/2}) rotate(270)`}>{this.props.yAxisLabel}</text>
        <text transform={`translate(${image.width/2}, ${image.height + margin.top + margin.bottom * 0.75})`}>{this.props.xAxisLabel}</text>
        <g className="datavisyn-manhattanplot-xaxis" transform={`translate(0,${image.height+margin.top})`} />
        <rect className="datavisyn-manhattanplot-significance-hidden" x={margin.left} y={margin.top + image.height} width={image.width} height="0" style={{fill: 'rgba(0,0,0,0.1)'}} />
      </g>
      <line x1="0" x2="100%" className="datavisyn-manhattanplot-significance" style={{stroke: 'black', strokeWidth: 3, cursor: 'ns-resize'}}/>
      <rect className="datavisyn-manhattanplot-detail-window" />
      <g className="datavisyn-manhattanplot-brush" />
    </svg>;
  }
}
