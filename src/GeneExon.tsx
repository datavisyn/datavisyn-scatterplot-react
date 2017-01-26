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

export interface IMappedGene {
  data: IGene;
  start: number;
  end: number;
  y: number;
}

export interface IGeneExonViewProps {
  serverUrl: string;
  absLocationMin: number;
  absLocationMax: number;
  genes: IGene[];
  margin?: { left: number; right: number};
}

class GeneExon extends React.Component<{gene: IGene, start: number, end: number, y: number},{}> {
  render() {
    const {gene, start, end, y} = this.props;
    const name = (gene.strand === '+') ? gene.gene_name + '→' : '←' + gene.gene_name;
    const length = end - start;
    return <line x1={start} y1={y} x2={end} y2={y}>
      <title>{name}</title>
    </line>;
  }
}

class DetailedGeneExon extends React.Component<{gene: IGene, scale(absPos: number): number, y: number},{}> {
  render() {
    const {gene, scale} = this.props;
    const name = (gene.strand === '+') ? gene.gene_name + '→' : '←' + gene.gene_name;
    const start = scale(gene.abs_start);
    const end = scale(gene.abs_end);
    const length = end - start;
    // TODO show all exons
    return <g transform={`translate(${start},0)`}>
      <title>{name}</title>
       <text textAnchor="middle" x={start+length/2}>{name}</text>
      <path d={`M0,0l0,30 M0,15l${length},0 M${length},0l0,30`} stroke="black" strokeWidth={2}/>
    </g>;
  }
}

/**
 * align the given genes in multiple levels such that they don't overlap
 * @param genes the given genes
 * @param height height per gene
 * @returns the total height needed
 */
function computeYValues(genes: IMappedGene[], height: number) {
  //assume they are sorted
  const levels = [-Infinity];
  outer: for (const gene of genes) {
    for (let i = 0; i < levels.length; ++i) {
      const occuppiedTill = levels[i];
      if (occuppiedTill < gene.start) {
        //can put it here
        gene.y = i * height;
        levels[i] = gene.end;
        continue outer;
      }
    }
    //doesn't fit to any level so far, create a new one
    levels.push(gene.end);
    gene.y = (levels.length-1) * height;
  }
  return levels.length * height;
}

export default class GeneExonView extends React.Component<IGeneExonViewProps,{}> {
  static defaultProps = {
    margin: {
      left: 50,
      right: 10
    }
  };

  private svg: SVGSVGElement;

  constructor(props?: IGeneExonViewProps, context?: any) {
    super(props, context);
  }

  componentDidMount() {
    this.forceUpdate(); // since now styled
  }

  render() {
    const {genes, absLocationMin, absLocationMax} = this.props;
    const width = (this.svg ? this.svg.clientWidth : 500) - this.props.margin.left - this.props.margin.right;
    const isInView = (start: number, end: number) => {
      return !(start >= width || end < 0);
    };
    const scale = (absLocation: number) => ((absLocation - absLocationMin) / (absLocationMax - absLocationMin)) * width;
    const isVisible = (gene: IMappedGene) => {
      const length =  gene.end - gene.start;
      return length >= 1 && isInView(gene.start, gene.end);
    };
    const visible = genes.map((g) => ({data: g, start: scale(g.abs_start), end: scale(g.abs_end), y: 0})).filter(isVisible).sort((a,b) => a.start - b.start);
    const height = computeYValues(visible, 4);

    return <svg ref={(svg) => this.svg = svg as SVGSVGElement} className="datavisyn-gene-exon" width="100%" height={height}>
      <defs>
        <clipPath id="datavisyn-gene-exon-clip">
          <rect width={width} height="100%" />
        </clipPath>
      </defs>
      <g transform={`translate(${this.props.margin.left},0)`} clipPath="url(#datavisyn-gene-exon-clip)" stroke="black">
      {visible.map((gene) => <GeneExon gene={gene.data} key={gene.data.gene_name} start={gene.start} end={gene.end} y={gene.y}/>)}
      </g>
    </svg>;
  }
}
