import {axisLeft, axisBottom, AxisScale} from 'd3-axis';
import * as d3scale from 'd3-scale';
import {line as d3line} from 'd3-shape';
import {select, mouse, event as d3event} from 'd3-selection';
import {zoom, zoomTransform, ZoomScale} from 'd3-zoom';
import {quadtree, Quadtree, QuadtreeInternalNode, QuadtreeLeaf} from 'd3-quadtree';
import {circleSymbol, ISymbol, ISymbolRenderer, ERenderMode} from './symbol';
import * as _symbol from './symbol';
import merge from './merge';

export interface IScale extends AxisScale<number>, ZoomScale {
  range(range:number[]);
  range(): number[];
  domain(): number[];
  domain(domain:number[]);
  invert(v:number): number;
  copy(): IScale;
}

export interface IAccessor<T> {
  (v:T) : number;
}


export interface ISymbolRenderer<T> {
  render(x:number, y:number, d:T);
  done();
}

export interface IScatterplotOptions<T> {
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

  /**
   * x accessor of the data
   * @param d
   */
  x:IAccessor<T>;

  /**
   * y accessor of the data
   * @param d
   */
  y:IAccessor<T>;


  clickRadius?: number;

  tooltipDelay?: number;
  tooltip?(d: T): string;
}

/**
 * a class for rendering a scatterplot in a canvas
 */
export default class Scatterplot<T> {
  /**
   * x scale applied to value
   */
  xscale:IScale = d3scale.scaleLinear().domain([0, 100]);

  /**
   * y scale applied to valuee
   */
  yscale:IScale = d3scale.scaleLinear().domain([0, 100]);

  symbol:ISymbol<T> = circleSymbol();

  private canvas:HTMLCanvasElement;

  private options:IScatterplotOptions<T> = {
    margin: {
      left: 40,
      top: 10,
      bottom: 20,
      right: 10
    },
    clickRadius: 10,
    scaleExtent: [1 / 2, 4],
    x: (d) => (<any>d).x,
    y: (d) => (<any>d).y,
    tooltipDelay: 300,
    tooltip: (d) => JSON.stringify(d)
  };

  private zoom = zoom().on('zoom', this.onZoom.bind(this)).on('end', this.onZoomEnd.bind(this));

  private tree:Quadtree<T>;
  private _selection:Quadtree<T>;

  private showTooltipHandle = -1;

  constructor(data:T[], private parent:HTMLElement, options?:IScatterplotOptions<T>) {
    this.options = merge(this.options, options);

    //init dom
    parent.innerHTML = `
      <canvas style="position: absolute; z-index: 1; width: 100%; height: 100%;"></canvas>
      <svg style="pointer-events: none; position: absolute; z-index: 2; width: ${this.options.margin.left + 2}px; height: 100%;">
        <g transform="translate(${this.options.margin.left},0)"><g>
      </svg>
      <svg style="pointer-events: none; position: absolute; z-index: 3; width: 100%; height: ${this.options.margin.bottom}px; bottom: 0">
        <g><g>
      </svg>
    `;
    parent.style.position = 'relative';

    this.canvas = <HTMLCanvasElement>parent.children[0];

    //register zoom
    this.zoom
      .scaleExtent(this.options.scaleExtent);
    select(this.canvas)
      .call(this.zoom)
      .on('click', () => this.onClick(d3event))
      .on('mouseleave', () => this.onMouseLeave(d3event))
      .on('mousemove', () => this.onMouseMove(d3event));

    //generate a quad tree out of the data
    this.tree = quadtree(data, this.options.x, this.options.y);
    this._selection = quadtree([], this.options.x, this.options.y);
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

  get selection() {
    return this._selection.data();
  }

  set selection(selection:T[]) {
    if (selection.length === 0) {
      if (this._selection.size() === 0) {
        return;
      }
      this._selection = quadtree([], this.options.x, this.options.y);
      this.render();
      return;
    }
    //find the delta
    var changed = false;
    const s = this.selection;
    selection.forEach((s_new) => {
      const i = s.indexOf(s_new);
      if (i < 0) { //new
        this._selection.add(s_new);
        changed = true;
      } else {
        s.splice(i, 1); //mark as used
      }
    });
    changed = changed || s.length > 0;
    //remove removed items
    this._selection.removeAll(s);

    if (changed) {
      this.render();
    }
  }

  addToSelection(items:T[]) {
    if (items.length === 0) {
      return;
    }
    this._selection.addAll(items);
    this.render();
  }

  removeFromSelection(items:T[]) {
    if (items.length === 0) {
      return;
    }
    this._selection.removeAll(items);
    this.render();
  }

  private transformedScales() {
    const transform = zoomTransform(this.canvas);
    const xscale = transform.rescaleX(this.xscale);
    const yscale = transform.rescaleY(this.yscale);
    return {xscale, yscale};
  }

  render() {
    const c = this.canvas,
      ctx = this.ctx,
      margin = this.options.margin,
      bounds = {x0: margin.left, y0: margin.top, x1: c.clientWidth - margin.right, y1: c.clientHeight - margin.bottom};
    this.checkResize();

    this.xscale.range([bounds.x0, bounds.x1]);
    this.yscale.range([bounds.y1, bounds.y0]);

    //transform scale
    const { xscale, yscale} = this.transformedScales();

    this.renderAxes(xscale, yscale);

    ctx.clearRect(0, 0, c.width, c.height);

    ctx.save();

    ctx.rect(bounds.x0, bounds.y0, bounds.x1 - bounds.x0, bounds.y1 - bounds.y0);
    ctx.clip();

    this.renderPoints(ctx, xscale, yscale, bounds);

    ctx.restore();
  }

  private onZoom() {
    // TODO more intelligent depending on zoom kind
    // intermediate zoom just move the context
    this.render();
  }

  private onZoomEnd() {
    this.render();
  }

  private onClick(event:MouseEvent) {
    const {x, y} = this.getMouseDataPos();

    //find closest data item
    //TODO implement a find all to select more than one item
    const closest = this.tree.find(x, y, this.options.clickRadius);
    if (closest) {
      this.selection = [closest];
    } else {
      this.selection = [];
    }
  }

  private getMouseDataPos(pos = mouse(this.canvas)) {
    const {xscale, yscale} = this.transformedScales();
    return {x: xscale.invert(pos[0]), y: yscale.invert(pos[1])};
  }

  private showTooltip(pos: [number, number]) {
    const {x, y} = this.getMouseDataPos(pos);
    const item = this.tree.find(x, y, this.options.clickRadius);
    this.canvas.title = item ? this.options.tooltip(item) : '';
  }

  private onMouseMove(event:MouseEvent) {
    const that = this;
    //clear old
    clearTimeout(this.showTooltipHandle);
    const pos = mouse(this.canvas);
    this.showTooltipHandle = setTimeout(this.showTooltip.bind(this, pos), this.options.tooltipDelay);
  }

  private onMouseLeave(event: MouseEvent) {
    clearTimeout(this.showTooltipHandle);
    this.showTooltipHandle = -1;
  }

  private renderAxes(xscale:IScale, yscale:IScale) {
    const left = axisLeft(yscale),
      bottom = axisBottom(xscale),
      $parent = select(this.parent);
    $parent.select('svg g').call(left);
    $parent.select('svg:last-of-type g').call(bottom);
  }

  private renderPoints(ctx:CanvasRenderingContext2D, xscale:IScale, yscale:IScale, bounds:{x0: number, y0: number, x1: number, y1: number}) {
    const {x, y} = this.options;
    var renderer:ISymbolRenderer<T> = null;

    function debugNode(color:string, x0:number, y0:number, x1:number, y1:number) {
      ctx.closePath();
      ctx.fillStyle = 'steelblue';
      ctx.fill();
      ctx.fillStyle = color;
      x0 = xscale(x0);
      y0 = yscale(y0);
      x1 = xscale(x1);
      y1 = yscale(y1);
      ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x0 - x1), Math.abs(y0 - y1));
      ctx.beginPath();

    }

    const dbounds = {
      x0: xscale.invert(bounds.x0),
      x1: xscale.invert(bounds.x1),
      //since y domain is inverted
      y1: yscale.invert(bounds.y0),
      y0: yscale.invert(bounds.y1),
    };

    function isVisible(x0:number, y0:number, x1:number, y1:number) {
      //if the 1er points are small than 0er or 0er bigger than 1er than outside
      if (x1 < dbounds.x0 || y1 < dbounds.y0 || x0 > dbounds.x1 || y0 > dbounds.y1) {
        //debugNode('rgba(255,0,0,0.2)', x0, y0, x1, y1);
        return false;
      }
      //debugNode('rgba(0,255,0,0.2)', x0, y0, x1, y1);
      //inside or partial overlap
      return true;
    }

    function visitTree(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>, x0:number, y0:number, x1:number, y1:number) {
      if (!(<any>node).length) { //is a leaf
        var leaf = <QuadtreeLeaf<T>>node;
        //see https://github.com/d3/d3-quadtree
        do {
          let d = leaf.data;
          renderer.render(xscale(x(d)), yscale(y(d)), d);
          //console.log(x(d), y(d), '=',xscale(x(d)), yscale(y(d)));
        } while ((leaf = leaf.next) != null);
        return true; //don't visit
      } else {
        //console.log(x0,y0,x1,y1, '=',xscale(x0), yscale(y0), xscale(x1), yscale(y1));
        //negate, since true means not visit
        return !isVisible(x0, y0, x1, y1);
      }
    }

    ctx.save();

    renderer = this.symbol(ctx, ERenderMode.NORMAL);
    this.tree.visit(visitTree);
    renderer.done();

    //render selected - TODO maybe in own canvas for performance of selection changes
    renderer = this.symbol(ctx, ERenderMode.SELECTED);
    this._selection.visit(visitTree);
    renderer.done();

    //a dummy path to clear the 'to draw' state
    ctx.beginPath();
    ctx.closePath();

    ctx.restore();
  }


  private renderLasso(ctx:CanvasRenderingContext2D) {
    ctx.save();

    ctx.restore();
  }
}

/**
 * reexport d3 scale
 */
export const scale = d3scale;
export const symbol = _symbol;

export function create<T>(data:T[], canvas:HTMLCanvasElement):Scatterplot<T> {
  return new Scatterplot(data, canvas);
}
