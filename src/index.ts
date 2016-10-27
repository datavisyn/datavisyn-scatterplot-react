import {axisLeft, axisBottom, AxisScale} from 'd3-axis';
import * as d3scale from 'd3-scale';
import {select, mouse, event as d3event} from 'd3-selection';
import {zoom, zoomTransform, ZoomScale} from 'd3-zoom';
import {quadtree, Quadtree, QuadtreeInternalNode, QuadtreeLeaf} from 'd3-quadtree';
import {circleSymbol, ISymbol, ISymbolRenderer, ERenderMode} from './symbol';
import * as _symbol from './symbol';
import merge from './merge';
import {findAll, forEach as forEachInNode, isLeafNode, hasOverlap, ABORT_TRAVERSAL, CONTINUE_TRAVERSAL} from './quadtree';
import Lasso from './lasso';

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
  tooltip?(d:T): string;
}

const NORMALIZED_RANGE = [0, 100];

enum ERenderReason {
  DIRTY,
  SELECTION_CHANGED,
  TRANSLATED,
  SCALED,
  PERFORM_SCALE,
  PERFORM_TRANSLATE
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

  private normalized2pixel = {
    x: d3scale.scaleLinear().domain(NORMALIZED_RANGE),
    y: d3scale.scaleLinear().domain(NORMALIZED_RANGE)
  };

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

  private lasso = new Lasso();

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
    //work on a normalized dimension to avoid hazzling
    const domain2normalizedX = this.xscale.copy().range(NORMALIZED_RANGE);
    const domain2normalizedY = this.yscale.copy().range(NORMALIZED_RANGE);
    this.tree = quadtree(data, (d) => domain2normalizedX(this.options.x(d)), (d) => domain2normalizedY(this.options.y(d)));
    this._selection = quadtree([], this.tree.x(), this.tree.y());
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

  onSelectionChanged(self:Scatterplot<T>) {
    // hook dummy
  }

  get selection() {
    return this._selection.data();
  }

  set selection(selection:T[]) {
    if (selection.length === 0) {
      if (this._selection.size() === 0) {
        return;
      }
      this._selection = quadtree([], this.tree.x(), this.tree.y());
      this.onSelectionChanged(this);
      this.render(ERenderReason.SELECTION_CHANGED);
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
      this.onSelectionChanged(this);
      this.render(ERenderReason.SELECTION_CHANGED);
    }
  }

  addToSelection(items:T[]) {
    if (items.length === 0) {
      return;
    }
    this._selection.addAll(items);
    this.onSelectionChanged(this);
    this.render(ERenderReason.SELECTION_CHANGED);
  }

  removeFromSelection(items:T[]) {
    if (items.length === 0) {
      return;
    }
    this._selection.removeAll(items);
    this.onSelectionChanged(this);
    this.render(ERenderReason.SELECTION_CHANGED);
  }

  private transformedScales() {
    const transform = zoomTransform(this.canvas);
    const xscale = transform.rescaleX(this.xscale);
    const yscale = transform.rescaleY(this.yscale);
    return {xscale, yscale};
  }

  resized() {
    this.render(ERenderReason.DIRTY);
  }

  render(reason = ERenderReason.DIRTY) {
    if(this.checkResize()) {
      //check resize
      return this.resized();
    }

    const c = this.canvas,
      ctx = this.ctx,
      margin = this.options.margin,
      bounds = {x0: margin.left, y0: margin.top, x1: c.clientWidth - margin.right, y1: c.clientHeight - margin.bottom};

    if (reason === ERenderReason.DIRTY) {
      this.xscale.range([bounds.x0, bounds.x1]);
      this.yscale.range([bounds.y1, bounds.y0]);
      this.normalized2pixel.x.range(this.xscale.range());
      this.normalized2pixel.y.range(this.yscale.range());
    }
    //transform scale
    const { xscale, yscale} = this.transformedScales();

    if (reason !== ERenderReason.SELECTION_CHANGED) {
      this.renderAxes(xscale, yscale);
    }

    const { n2pX, n2pY} = this.transformedNormalized2PixelScales();
    const nx = (v) => n2pX.invert(v),
      ny = (v) => n2pY.invert(v);
    //inverted y scale
    const isNodeVisible = hasOverlap(nx(bounds.x0), ny(bounds.y1), nx(bounds.x1), ny(bounds.y0));

    ctx.clearRect(0, 0, c.width, c.height);

    ctx.save();

    ctx.rect(bounds.x0, bounds.y0, bounds.x1 - bounds.x0, bounds.y1 - bounds.y0);
    ctx.clip();

    this.renderPoints(ctx, xscale, yscale, isNodeVisible, reason);

    ctx.restore();

    this.lasso.render(ctx);
  }

  private onZoom() {
    // TODO more intelligent depending on zoom kind
    // intermediate zoom just move the context
    this.render(ERenderReason.SCALED);
  }

  private onZoomEnd() {
    this.render(ERenderReason.SCALED);
  }

  private onClick(event:MouseEvent) {
    const {x, y, clickRadius} = this.getMouseNormalizedPos();

    //find closest data item
    //TODO implement a find all to select more than one item
    const closest = findAll(this.tree, x, y, clickRadius);
    this.selection = closest;
  }

  private getMouseNormalizedPos(pixelpos = mouse(this.canvas)) {
    const { n2pX, n2pY, transform} = this.transformedNormalized2PixelScales();

    function rangeRange(s:IScale) {
      const range = s.range();
      return Math.abs(range[1] - range[0]);
    }

    const computeClickRadius = () => {
      //compute the data domain radius based on xscale and the scaling factor
      const view = this.options.clickRadius;
      const viewSize = transform.k * Math.min(rangeRange(this.normalized2pixel.x), rangeRange(this.normalized2pixel.y));
      const normalizedSize = NORMALIZED_RANGE[1];
      //tranform from view to data without translation
      const normalized = view / viewSize * normalizedSize;
      //const view = this.xscale(base)*transform.k - this.xscale.range()[0]; //skip translation
      console.log(view, viewSize, transform.k, normalizedSize, normalized);
      return normalized;
    };

    const clickRadius = computeClickRadius();
    return {x: n2pX.invert(pixelpos[0]), y: n2pY.invert(pixelpos[1]), clickRadius};
  }

  private transformedNormalized2PixelScales() {
    const transform = zoomTransform(this.canvas);
    const n2pX = transform.rescaleX(this.normalized2pixel.x);
    const n2pY = transform.rescaleY(this.normalized2pixel.y);
    return {transform, n2pX, n2pY};
  };

  private showTooltip(pos:[number, number]) {
    //highlight selected item
    const {x, y, clickRadius} = this.getMouseNormalizedPos(pos);
    const items = findAll(this.tree, x, y, clickRadius);
    //TODO highlight item(s) in the plot
    this.canvas.title = items.map(this.options.tooltip).join('\n');
  }

  private onMouseMove(event:MouseEvent) {
    const that = this;
    //clear old
    clearTimeout(this.showTooltipHandle);
    const pos = mouse(this.canvas);
    //TODO find a more efficient way or optimize the timing
    this.showTooltipHandle = setTimeout(this.showTooltip.bind(this, pos), this.options.tooltipDelay);
  }

  private onMouseLeave(event:MouseEvent) {
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

  private renderPoints(ctx:CanvasRenderingContext2D, xscale:IScale, yscale:IScale, isNodeVisible:(x0:number, y0:number, x1:number, y1:number)=>boolean, reason = ERenderReason.DIRTY) {
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

    function visitTree(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>, x0:number, y0:number, x1:number, y1:number) {
      if (!isNodeVisible(x0, y0, x1, y1)) {
        return ABORT_TRAVERSAL;
      }
      if (isLeafNode(node)) { //is a leaf
        forEachInNode(node, (d) => renderer.render(xscale(x(d)), yscale(y(d)), d));
      }
      return CONTINUE_TRAVERSAL;
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
}

/**
 * reexport d3 scale
 */
export const scale = d3scale;
export const symbol = _symbol;

export function create<T>(data:T[], canvas:HTMLCanvasElement):Scatterplot<T> {
  return new Scatterplot(data, canvas);
}
