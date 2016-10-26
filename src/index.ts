import * as d3axis from 'd3-axis';
import * as d3scale from 'd3-scale';
import * as d3shape from 'd3-shape';

export interface IScale {
  (v:number) : number;
  range(range:number[]);
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
    while ((n = next()) !== null) {
      ctx.arc(n.x, n.y, r, 0, tau);
    }
    ctx.fill();
  }
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

  private canvas: HTMLCanvasElement = document.createElement('canvas');
  private svg : SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg','svg');

  constructor(private data:T[], parent:HTMLElement) {
    parent.appendChild(this.canvas);
    parent.appendChild(this.svg);
    parent.style.position = 'relative';
    [this.canvas, this.svg].forEach((s : HTMLElement | SVGStylable, i: number) => {
      s.style.position = 'absolute';
      s.style.zIndex = String(i);
      s.style.width = '100%';
      s.style.height = '100%';
    })
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
      ctx = this.ctx;
    this.checkResize();

    ctx.clearRect(0, 0, c.clientWidth, c.clientWidth);
    this.xscale.range([0, c.clientWidth]);
    this.yscale.range([c.clientHeight, 0]);

    const l = this.data.length;
    var i = 0;

    //poor man iterator
    function next() {
      if (i === l) {
        return null;
      }
      const d = this.data[i++];
      return {x: this.xscale(this.x(d)), y: this.yscale(this.y(d)), v : d};
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
