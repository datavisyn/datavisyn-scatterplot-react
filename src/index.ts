import * as d3axis from 'd3-axis';
import * as d3scale from 'd3-scale';
import * as d3shape from 'd3-shape';
import * as d3selection from 'd3-selection';
import * as d3zoom from 'd3-zoom';

export interface IScale extends d3axis.AxisScale<number> {
  range(range: number[]);
  range(): number[];
}

export interface IAccessor<T> {
  (v:T) : number;
}

export interface IDataItem<T> {
  x: number;
  y: number;
  v: T;
}

export interface IPoorManIterator<T> {
  /**
   * @return the next data item or 'null' if end of iteration
   */
  (): IDataItem<T>;
}

export interface ISymbol<T> {
  (ctx:CanvasRenderingContext2D, next:IPoorManIterator<T>): void
}

/**
 * generic wrapper around d3 symbols for rendering
 * @param symbol the symbol to render
 * @param fillStyle the style applied
 * @param size the size of the symbol
 * @returns {function(CanvasRenderingContext2D, IPoorManIterator): undefined}
 */
export function d3Symbol(symbol = d3SymbolCircle, fillStyle:string = 'steelblue', size = 5):ISymbol<any> {
  return (ctx:CanvasRenderingContext2D, next:IPoorManIterator<any>) => {
    ctx.fillStyle = fillStyle;
    var n:{ x: number, y: number};

    while ((n = next()) !== null) {
      ctx.translate(n.x, n.y);
      symbol.draw(ctx, size);
      ctx.translate(-n.x, -n.y);
    }
    ctx.fill();
  }
}

/**
 * circle symbol renderer (way faster than d3Symbol(d3symbolCircle)
 * @param fillStyle
 * @param size
 * @returns {function(CanvasRenderingContext2D, IPoorManIterator): undefined}
 */
export function circleSymbol(fillStyle:string = 'steelblue', size = 5):ISymbol<any> {
  const r = Math.sqrt(size / Math.PI);
  const tau = 2 * Math.PI;

  return (ctx:CanvasRenderingContext2D, next:IPoorManIterator<any>) => {
    ctx.fillStyle = fillStyle;
    var n:IDataItem<any>;
    ctx.beginPath();
    while ((n = next()) !== null) {
      ctx.moveTo(n.y + r, n.y);
      ctx.arc(n.x, n.y, r, 0, tau);
    }
    ctx.fill();
  }
}

export interface IScatterplotOptions {
  /**
   * default: 20
   */
  margin?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  };

  scaleExtent?: [number, number];
}

/**
 * a class for rendering a scatterplot in a canvas
 */
export default class Scatterplot<T> {
  /**
   * x accessor of the data
   * @param d
   */
  x:IAccessor<T> = (d) => (<any>d).x;
  /**
   * x scale applied to value
   */
  xscale:IScale = d3scale.scaleLinear().domain([0, 1]);
  /**
   * y accessor of the data
   * @param d
   */
  y:IAccessor<T> = (d) => (<any>d).y;

  /**
   * y scale applied to value
   */
  yscale:IScale = d3scale.scaleLinear().domain([0, 1]);

  symbol:ISymbol<T> = circleSymbol();

  private canvas: HTMLCanvasElement;

  private options: IScatterplotOptions = {
    margin: {
      left: 40,
      top: 10,
      bottom: 20,
      right: 10
    },
    scaleExtent: [1 / 2, 4]
  };

  private zoom = d3zoom.zoom().on('zoom', this.onZoom.bind(this));

  constructor(private data:T[], private parent:HTMLElement, options?: IScatterplotOptions) {
    //TODO merge options

    //init dom
    parent.innerHTML = `
      <canvas style="position: absolute; z-index: 1; width: 100%; height: 100%;"></canvas>
      <svg style="position: absolute; z-index: 2; width: ${this.options.margin.left+2}px; height: 100%;">
        <g transform="translate(${this.options.margin.left},0)"><g>
      </svg>
      <svg style="position: absolute; z-index: 3; width: 100%; height: ${this.options.margin.bottom}px; bottom: 0">
        <g><g>
      </svg>
    `;
    parent.style.position = 'relative';

    this.canvas = <HTMLCanvasElement>parent.children[0];

    //register zoom
    this.zoom.scaleExtent(this.options.scaleExtent);
    d3selection.select(this.canvas).call(this.zoom);

  }

  checkResize() {
    const c = this.canvas;
    if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
      c.width = c.clientWidth;
      //this.svg.width = c.clientWidth;
      c.height = c.clientHeight;
      //this.svg.height = c.clientHeight;
      return true;
    }
    return false;
  }

  private get ctx() {
    return this.canvas.getContext('2d');
  }

  render() {
    const c = this.canvas,
      ctx = this.ctx,
      margin = this.options.margin,
      w = c.clientWidth - margin.left - margin.right,
      h = c.clientHeight - margin.top - margin.bottom;
    this.checkResize();

    this.xscale.range([margin.left, w]);
    this.yscale.range([h + margin.top, margin.top]);

    this.renderAxes();

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.rect(margin.left, margin.top, w, h);
    ctx.clip();
    //get current transform
    this.renderPoints(ctx);
    ctx.restore();
  }

  private onZoom() {
    this.render();
  }

  private renderAxes() {
    const left = d3axis.axisLeft(this.yscale),
      bottom = d3axis.axisBottom(this.xscale),
      $parent = d3selection.select(this.parent);
    $parent.select('svg g').call(left);
    $parent.select('svg:last-of-type g').call(bottom);
  }

  private renderPoints(ctx: CanvasRenderingContext2D){
    const l = this.data.length;
    const transform = d3zoom.zoomTransform(this.canvas);
    const tx = (d: T) => transform.x + transform.k*this.xscale(this.x(d));
    const ty = (d: T) => transform.y + transform.k*this.yscale(this.y(d));
    var i = 0;

    //poor man iterator
    function next() {
      if (i === l) {
        return null;
      }
      const d = this.data[i++];
      return {x: tx(d), y: ty(d), v : d};
    }
    ctx.save();
    this.symbol(ctx, next.bind(this));
    ctx.restore();
  }
}

/**
 * reexport d3 scale
 */
export const scale = d3scale;


export const d3SymbolCircle = d3shape.symbolCircle;
export const d3SymbolCross = d3shape.symbolCross;
export const d3SymbolDiamond = d3shape.symbolDiamond;
export const d3SymbolSquare = d3shape.symbolSquare;
export const d3SymbolStar = d3shape.symbolStar;
export const d3SymbolTriangle = d3shape.symbolTriangle;
export const d3SymbolWye = d3shape.symbolWye;

export function create<T>(data:T[], canvas:HTMLCanvasElement):Scatterplot<T> {
  return new Scatterplot(data, canvas);
}
