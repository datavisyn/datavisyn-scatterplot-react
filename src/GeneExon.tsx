/**
 * Created by sam on 16.01.2017.
 */


import * as React from 'react';
import {IWindow} from 'datavisyn-scatterplot-react/src/ManhattanPlot';


export interface IExon {
  start: number;
  end: number;
  abs_start: number;
  abs_end: number;
}

export interface IGene {
  gene_name: string;
  strand: string; //+ or -
  start: number;
  end: number;
  abs_start: number;
  abs_end: number;
  exons?: IExon[];
}

export interface IGeneExonViewProps {
  serverUrl: string;
  absLocationMin: number;
  absLocationMax: number;
  genes: IGene[];
}

class GeneExon extends React.Component<{gene: IGene, details: boolean, scale(absPos: number): number},{}> {
  render() {
    const {gene, details, scale} = this.props;
    const name = (gene.strand === '+') ? gene.gene_name + '→' : '←' + gene.gene_name;
    const start = scale(gene.abs_start);
    const end = scale(gene.abs_end);
    const length = end - start;
    if (details) {
      return <g transform="translate({start},0)">
        <title>{name}</title>
        <text textAnchor="middle" x="{start+length/2}">{name}</text>
        <path d="M0,0L0,30 M0,15L{length},15 M{length},0L{length},30"/>
        // TODO show all exons
      </g>;
    } else {
      return <g transform="translate({start},0)">
        <title>{name}</title>
        <path d="M0,0L0,30 M0,15L{length},15 M{length},0L{length},30"/>
      </g>;
    }
  }
}

export default class GeneExonView extends React.Component<IGeneExonViewProps,{}> {
  private svg: SVGSVGElement;
  private width = 500;

  componentDidMount() {
    const width = this.svg.clientWidth;
    if (width !== this.width) {
      this.width = width;
      this.forceUpdate();
    }
  }

  private scale(absLocation: number) {
    const {absLocationMin, absLocationMax} = this.props;
    return ((absLocation - absLocationMin) / (absLocationMax - absLocationMin)) * this.width;
  }

  render() {
    const {genes} = this.props;
    return <svg ref={(svg) => this.svg = svg as SVGSVGElement}>
      {genes.map((gene) => <GeneExon gene={gene} details={false} key={gene.gene_name}scale={this.scale.bind(this)}/>)}
    </svg>;
  }
}
