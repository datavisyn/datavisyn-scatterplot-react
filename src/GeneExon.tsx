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

const AVERAGE_TEXT_LENGTH = 70;

class MappedGene {
  y: number;
  freeSpaceBefore: number;
  freeSpaceAfter: number;

  constructor(public readonly data: IGene, public readonly start: number, public readonly end: number) {

  }

  get length() {
    return this.end - this.start;
  }

  get enoughSpaceForLabel() {
    return (this.length + this.freeSpaceBefore + this.freeSpaceAfter) > AVERAGE_TEXT_LENGTH;
  }
}

export interface IGeneExonViewProps {
  serverUrl: string;
  absLocationMin: number;
  absLocationMax: number;
  genes: IGene[];
  margin?: {left: number; right: number};
  minLength?: number;
}

enum EDetailLevel {
  low, medium, high
}


class GeneExon extends React.Component<{gene: MappedGene, detailLevel: EDetailLevel},{}> {
  render() {
    const {data, start, end, enoughSpaceForLabel} = this.props.gene;
    const name = (data.strand === '+') ? data.gene_name + '→' : '←' + data.gene_name;
    const length = end - start;

    let detailLevel = this.props.detailLevel;
    let y = this.props.gene.y;

    if (detailLevel !== EDetailLevel.low && !enoughSpaceForLabel) {
      detailLevel = EDetailLevel.low;
      y += 11;
    }

    switch (detailLevel) {
      case EDetailLevel.high:
        return <g transform={`translate(${start},0)`} className="gene">
          <title>{name}</title>
          <text textAnchor="middle" x={length/2}>{name}</text>
          <path d={`M0,0l0,30 M0,15l${length},0 M${length},0l0,30`}/>
        </g>;
      case EDetailLevel.medium:
        y += 11;
        return <g transform={`translate(${start},${y})`} className="gene">
          <title>{name}</title>
          <text textAnchor="middle" x={length/2} y="-3">{name}</text>
          <line x2={length}/>
        </g>;
      case EDetailLevel.low:
        return <line x1={start} y1={y} x2={end} y2={y}>
          <title>{name}</title>
        </line>;
    }
  }
}


function decideDetailLevel(genes: MappedGene[]) {
  //ignoring really really small ones
  const {sum, count} = genes.reduce((({sum, count}, gene) => {
    const l = gene.end - gene.start;
    if (l > 5) {
      sum += l;
      count += 1;
    }
    return {sum, count};
  }), {sum: 0, count: 0});
  if (count === 0) {
    return EDetailLevel.low;
  }
  const avg = sum / count;
  return avg > 10 ? EDetailLevel.medium: EDetailLevel.low;
}

/**
 * align the given genes in multiple levels such that they don't overlap
 * @param genes the given genes
 * @param height height per gene
 * @returns the total height needed
 */
function computeYValues(genes: MappedGene[], height: number) {
  //assume they are sorted
  const levels: MappedGene[] = [];
  outer: for (const gene of genes) {
    for (let i = 0; i < levels.length; ++i) {
      const occuppiedBy = levels[i];
      const occuppiedTill = Math.ceil(occuppiedBy.end + 1);
      if (occuppiedTill < gene.start) {
        //can put it here
        gene.y = i * height;
        occuppiedBy.freeSpaceAfter = gene.freeSpaceBefore = (gene.start - occuppiedTill) / 2;
        levels[i] = gene;
        continue outer;
      }
    }
    //doesn't fit to any level so far, create a new one
    gene.freeSpaceBefore = +Infinity;
    levels.push(gene);
    gene.y = (levels.length - 1) * height;
  }
  levels.forEach((gene) => gene.freeSpaceAfter = +Infinity);
  return levels.length * height;
}

export default class GeneExonView extends React.Component<IGeneExonViewProps,{}> {
  static defaultProps = {
    margin: {
      left: 50,
      right: 10
    },
    minLength: 1
  };

  private svg: SVGSVGElement;

  constructor(props?: IGeneExonViewProps, context?: any) {
    super(props, context);
  }

  componentDidMount() {
    this.forceUpdate(); // since now styled
  }

  render() {
    const {genes, absLocationMin, absLocationMax, minLength} = this.props;
    const width = (this.svg ? this.svg.clientWidth : 500) - this.props.margin.left - this.props.margin.right;
    const isInView = (start: number, end: number) => {
      return !(start >= width || end < 0);
    };
    const scale = (absLocation: number) => ((absLocation - absLocationMin) / (absLocationMax - absLocationMin)) * width;
    const isVisible = (gene: MappedGene) => {
      const length = gene.end - gene.start;
      return length >= minLength && isInView(gene.start, gene.end);
    };
    const visible = genes.map((g) => new MappedGene(g, scale(g.abs_start), scale(g.abs_end))).filter(isVisible).sort((a, b) => a.start - b.start);

    const detailLevel = decideDetailLevel(visible);
    const height = computeYValues(visible, detailLevel === EDetailLevel.low ? 4 : (detailLevel === EDetailLevel.medium ? 20 : 30));

    return <svg ref={(svg) => this.svg = svg as SVGSVGElement} className="datavisyn-gene-exon" width="100%"
                height={height}>
      <defs>
        <clipPath id="datavisyn-gene-exon-clip">
          <rect width={width} height="100%"/>
        </clipPath>
      </defs>
      <g transform={`translate(${this.props.margin.left},0)`} clipPath="url(#datavisyn-gene-exon-clip)">
        {visible.map((gene) => <GeneExon gene={gene} key={gene.data.gene_name} detailLevel={detailLevel}/>)}
      </g>
    </svg>;
  }
}
