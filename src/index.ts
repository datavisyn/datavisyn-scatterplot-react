import * as d3axis from 'd3-axis';
import * as d3scale from 'd3-scale';
import * as d3shape from 'd3-shape';

export interface IScale {
  (v: number) : number;
  range(range: number[]);
}

export interface IAccessor<T> {
  (v: T) : number;
}

export interface IPoorManIterator {
  (): { x: number, y: number}; //null if end
}

export interface ISymbol {
  (ctx: CanvasRenderingContext2D, next: IPoorManIterator): void
}

export function d3Symbol(symbol = d3shape.symbolCircle, fillStyle: string = 'steelblue', size = 5) {
  return (ctx: CanvasRenderingContext2D, next: IPoorManIterator) => {
    ctx.fillStyle = fillStyle;
    var n : { x: number, y: number};
    while ((n = next()) !== null) {
      ctx.translate(n.x, n.y);
      symbol.draw(ctx, size);
      ctx.translate(-n.x, -n.y);
    }
    ctx.fill();
  }
}

export function circleSymbol(fillStyle: string = 'steelblue', size = 5) {
  return (ctx: CanvasRenderingContext2D, next: IPoorManIterator) => {
    ctx.fillStyle = fillStyle;

    const r = Math.sqrt(size / Math.PI);
    const tau = 2*Math.PI;

    var n : { x: number, y: number};
    while ((n = next()) !== null) {
      ctx.arc(n.x, n.y, r, 0, tau);
    }
    ctx.fill();
  }
}

/**
 * a class for rendering a scatterplot in a canvas
 */
export default class CanvasScatterplot<T> {
  x: IAccessor<T> = (v) => (<any>v).x;
  xscale : IScale = d3scale.scaleLinear().domain([0, 1]);
  y: IAccessor<T> = (v) => (<any>v).y;
  yscale : IScale = d3scale.scaleLinear().domain([0, 1]);

  symbol: ISymbol = circleSymbol();

  constructor(private data: T[], private canvas: HTMLCanvasElement) {

  }

  private checkResize() {
    const c = this.canvas;
    if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
      return true;
    }
    return false;
  }

  private get ctx() {
    return this.canvas.getContext('2d');
  }

  render() {
    const c = this.canvas,
      ctx = this.ctx;
    this.checkResize();

    ctx.clearRect(0, 0, c.width, c.height);
    this.xscale.range([0, c.width]);
    this.yscale.range([c.height, 0]);

    const l = this.data.length;
    var i = 0;

    //poor man iterator
    function next() {
      if (i === l) {
        return null;
      }
      const d = this.data[i++];
      return { x : this.xscale(this.x(d)), y: this.yscale(this.y(d)) };
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

export function create<T>(data: T[], canvas: HTMLCanvasElement): CanvasScatterplot<T> {
  return new CanvasScatterplot(data, canvas);
}
