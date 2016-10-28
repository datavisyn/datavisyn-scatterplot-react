/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */

import './style.scss';
import {axisLeft, axisBottom, AxisScale} from 'd3-axis';
import * as d3scale from 'd3-scale';
import {select, mouse, event as d3event} from 'd3-selection';
import {zoom as d3zoom, zoomTransform, ZoomScale} from 'd3-zoom';
import {drag as d3drag} from 'd3-drag';
import {quadtree, Quadtree, QuadtreeInternalNode, QuadtreeLeaf} from 'd3-quadtree';
import {circleSymbol, ISymbol, ISymbolRenderer, ERenderMode} from './symbol';
import * as _symbol from './symbol';
import merge from './merge';
import {findAll, forEachLeaf, isLeafNode, hasOverlap, getTreeSize, findByTester, getFirstLeaf, ABORT_TRAVERSAL, CONTINUE_TRAVERSAL, IBoundsPredicate, ITester} from './quadtree';
import Lasso from './lasso';
import {cssprefix} from './constants';
import showTooltip from './tooltip';

/**
 * a d3 scale essentially
 */
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

/**
 * scatterplot options
 */
export interface IScatterplotOptions<T> {
  /**
   * margin for the scatterplot area
   * default (left=40, top=10, right=10, bottom=20)
   */
  margin?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  };

  /**
   * min max scaling factor
   * default: 0.5, 4
   */
  scaleExtent?: [number, number];

  /**
   * x accessor of the data
   * default: d.x
   * @param d
   */
  x:IAccessor<T>;

  /**
   * y accessor of the data
   * default: d.y
   * @param d
   */
  y:IAccessor<T>;

  /**
   * d3 x scale
   * default: linear scale with a domain from 0...100
   */
  xscale?:IScale;

  /**
   * d3 y scale
   * default: linear scale with a domain from 0...100
   */
  yscale?:IScale;

  /**
   * symbol used to render an data point
   * default: steelblue circle
   */
  symbol?:ISymbol<T>;

  /**
   * the radius in pixel in which a mouse click will be searched
   * default: 10
   */
  clickRadius?: number;

  /**
   * delay before a tooltip will be shown after a mouse was moved
   * default: 300
   */
  tooltipDelay?: number;

  /**
   * shows the tooltip
   * @param parent the scatterplot html element
   * @param items items to show, empty to hide tooltip
   * @param x the x position relative to the plot
   * @param y the y position relative to the plot
     */
  showTooltip?(parent: HTMLElement, items:T[], x: number, y: number);

  /**
   * hook when the selection has changed
   * default: none
   */
  onSelectionChanged?(scatterplot:Scatterplot<T>);

  /**
   * determines whether the given mouse is a selection or panning event
   * default: event.ctrlKey || event.altKey
   */
  isSelectEvent?(event:MouseEvent) : boolean; //=> event.ctrlKey || event.altKey
}

//normalized range the quadtree is defined
const NORMALIZED_RANGE = [0, 100];

/**
 * reasons why a new render pass is needed
 */
enum ERenderReason {
  DIRTY,
  SELECTION_CHANGED,
  TRANSLATED,
  SCALED,
  PERFORM_SCALE, //performing a scale operation
  PERFORM_TRANSLATE
}


/**
 * a class for rendering a scatterplot in a canvas
 */
export default class Scatterplot<T> {

  private props:IScatterplotOptions<T> = {
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

    xscale : <IScale>d3scale.scaleLinear().domain([0, 100]),
    yscale: <IScale>d3scale.scaleLinear().domain([0, 100]),

    symbol: <ISymbol<T>>circleSymbol(),

    tooltipDelay: 300,
    showTooltip: showTooltip,

    onSelectionChanged: ()=>undefined,

    isSelectEvent: (event:MouseEvent) => event.ctrlKey || event.altKey
  };


  private normalized2pixel = {
    x: d3scale.scaleLinear().domain(NORMALIZED_RANGE),
    y: d3scale.scaleLinear().domain(NORMALIZED_RANGE)
  };
  private canvas:HTMLCanvasElement;
  private tree:Quadtree<T>;
  private selectionTree:Quadtree<T>;

  /**
   * timout handle when the tooltip is shown
   * @type {number}
   */
  private showTooltipHandle = -1;

  private lasso = new Lasso();

  constructor(data:T[], private parent:HTMLElement, props?:IScatterplotOptions<T>) {
    this.props = merge(this.props, props);

    //init dom
    parent.innerHTML = `
      <canvas></canvas>
      <svg class="${cssprefix}-axis-left" style="width: ${this.props.margin.left + 2}px;">
        <g transform="translate(${this.props.margin.left},0)"><g>
      </svg>
      <svg class="${cssprefix}-axis-bottom" style="height: ${this.props.margin.bottom}px;">
        <g><g>
      </svg>
    `;
    parent.classList.add(cssprefix);

    this.canvas = <HTMLCanvasElement>parent.children[0];

    //register zoom
    const zoom = d3zoom()
      .on('zoom', this.onZoom.bind(this))
      .on('end', this.onZoomEnd.bind(this))
      .scaleExtent(this.props.scaleExtent)
      .filter(() => d3event.button === 0 && !this.props.isSelectEvent(<MouseEvent>d3event));

    const drag = d3drag()
      .on('start', this.onDragStart.bind(this))
      .on('drag', this.onDrag.bind(this))
      .on('end', this.onDragEnd.bind(this))
      .filter(() => d3event.button === 0 && this.props.isSelectEvent(<MouseEvent>d3event));

    //need to use d3 for d3.mouse to work
    select(this.canvas)
      .call(zoom)
      .call(drag)
      .on('click', () => this.onClick(d3event))
      .on('mouseleave', () => this.onMouseLeave(d3event))
      .on('mousemove', () => this.onMouseMove(d3event));

    //generate a quad tree out of the data
    //work on a normalized dimension to avoid hazzling
    const domain2normalizedX = this.props.xscale.copy().range(NORMALIZED_RANGE);
    const domain2normalizedY = this.props.yscale.copy().range(NORMALIZED_RANGE);

    this.tree = quadtree(data, (d) => domain2normalizedX(this.props.x(d)), (d) => domain2normalizedY(this.props.y(d)));
    this.selectionTree = quadtree([], this.tree.x(), this.tree.y());
  }


  private get ctx() {
    return this.canvas.getContext('2d');
  }


  /**
   * returns the current selection
   */
  get selection() {
    return this.selectionTree.data();
  }

  /**
   * sets the current selection
   * @param selection
     */
  set selection(selection:T[]) {
    if (selection == null) {
      selection = []; //ensure valid value
    }
    //this.lasso.clear();
    if (selection.length === 0) {
      this.clearSelection();
      return;
    }
    //find the delta
    var changed = false;
    const s = this.selection;
    selection.forEach((s_new) => {
      const i = s.indexOf(s_new);
      if (i < 0) { //new
        this.selectionTree.add(s_new);
        changed = true;
      } else {
        s.splice(i, 1); //mark as used
      }
    });
    changed = changed || s.length > 0;
    //remove removed items
    this.selectionTree.removeAll(s);

    if (changed) {
      this.props.onSelectionChanged(this);
      this.render(ERenderReason.SELECTION_CHANGED);
    }
  }

  /**
   * clears the selection, same as .selection=[]
   */
  clearSelection() {
    this.selectionTree = quadtree([], this.tree.x(), this.tree.y());
    this.props.onSelectionChanged(this);
    this.render(ERenderReason.SELECTION_CHANGED);
  }

  /**
   * shortcut to add items to the selection
   * @param items
   */
  addToSelection(items:T[]) {
    if (items.length === 0) {
      return;
    }
    this.selectionTree.addAll(items);
    this.props.onSelectionChanged(this);
    this.render(ERenderReason.SELECTION_CHANGED);
  }

  /**
   * shortcut to remove items from the selection
   * @param items
   */
  removeFromSelection(items:T[]) {
    if (items.length === 0) {
      return;
    }
    this.selectionTree.removeAll(items);
    this.props.onSelectionChanged(this);
    this.render(ERenderReason.SELECTION_CHANGED);
  }

  private selectWithTester(tester:ITester) {
    const selection = findByTester(this.tree, tester);
    this.selection = selection;
  }

  private checkResize() {
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


  resized() {
    this.render(ERenderReason.DIRTY);
  }


  private transformedScales() {
    const transform = zoomTransform(this.canvas);
    const xscale = transform.rescaleX(this.props.xscale);
    const yscale = transform.rescaleY(this.props.yscale);
    return {xscale, yscale};
  }

  private getMouseNormalizedPos(pixelpos = mouse(this.canvas)) {
    const { n2pX, n2pY, transform} = this.transformedNormalized2PixelScales();

    function rangeRange(s:IScale) {
      const range = s.range();
      return Math.abs(range[1] - range[0]);
    }

    const computeClickRadius = () => {
      //compute the data domain radius based on xscale and the scaling factor
      const view = this.props.clickRadius;
      const viewSize = transform.k * Math.min(rangeRange(this.normalized2pixel.x), rangeRange(this.normalized2pixel.y));
      const normalizedSize = NORMALIZED_RANGE[1];
      //tranform from view to data without translation
      const normalized = view / viewSize * normalizedSize;
      //const view = this.props.xscale(base)*transform.k - this.props.xscale.range()[0]; //skip translation
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

  private onZoom() {
    // TODO more intelligent depending on zoom kind
    // intermediate zoom just move the context
    this.render(ERenderReason.PERFORM_SCALE);
  }

  private onZoomEnd() {
    this.render(ERenderReason.SCALED);
  }

  private onDragStart() {
    this.lasso.start(d3event.x, d3event.y);
    this.clearSelection();
  }

  private onDrag() {
    this.lasso.drag(d3event.x, d3event.y);

    const {n2pX, n2pY} = this.transformedNormalized2PixelScales();
    const tester = this.lasso.tester(n2pX.invert.bind(n2pX), n2pY.invert.bind(n2pY));
    if (tester) {
      this.selectWithTester(tester);
    } else {
      this.render(ERenderReason.SELECTION_CHANGED);
    }
  }

  private onDragEnd() {
    this.lasso.end(d3event.x, d3event.y);
    this.render(ERenderReason.SELECTION_CHANGED);
  }

  private onClick(event:MouseEvent) {
    if (event.button > 0) {
      //right button or something like that = reset
      this.selection = [];
      return;
    }
    const {x, y, clickRadius} = this.getMouseNormalizedPos();

    //find closest data item
    const closest = findAll(this.tree, x, y, clickRadius);
    this.selection = closest;
  }

  private showTooltip(pos:[number, number]) {
    //highlight selected item
    const {x, y, clickRadius} = this.getMouseNormalizedPos(pos);
    const items = findAll(this.tree, x, y, clickRadius);
    this.props.showTooltip(this.parent, items, pos[0], pos[1]);
  }

  private onMouseMove(event:MouseEvent) {
    //clear old
    clearTimeout(this.showTooltipHandle);
    const pos = mouse(this.canvas);
    //TODO find a more efficient way or optimize the timing
    this.showTooltipHandle = setTimeout(this.showTooltip.bind(this, pos), this.props.tooltipDelay);
  }

  private onMouseLeave(event:MouseEvent) {
    clearTimeout(this.showTooltipHandle);
    this.showTooltipHandle = -1;
  }

  render(reason = ERenderReason.DIRTY) {
    if (this.checkResize()) {
      //check resize
      return this.resized();
    }

    const c = this.canvas,
      ctx = this.ctx,
      margin = this.props.margin,
      bounds = {x0: margin.left, y0: margin.top, x1: c.clientWidth - margin.right, y1: c.clientHeight - margin.bottom};

    if (reason === ERenderReason.DIRTY) {
      this.props.xscale.range([bounds.x0, bounds.x1]);
      this.props.yscale.range([bounds.y1, bounds.y0]);
      this.normalized2pixel.x.range(this.props.xscale.range());
      this.normalized2pixel.y.range(this.props.yscale.range());
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

    function useAggregation(x0:number, y0:number, x1:number, y1:number) {
      x0 = n2pX(x0);
      y0 = n2pY(y0);
      x1 = n2pX(x1);
      y1 = n2pY(y1);
      const min_size = Math.max(Math.abs(x0 - x1), Math.abs(y0 - y1));
      return min_size < 5; //TODO tune depend on visual impact
    }

    this.renderPoints(ctx, xscale, yscale, isNodeVisible, useAggregation, reason);

    ctx.restore();

    this.lasso.render(ctx);
  }

  private renderAxes(xscale:IScale, yscale:IScale) {
    const left = axisLeft(yscale),
      bottom = axisBottom(xscale),
      $parent = select(this.parent);
    $parent.select('svg g').call(left);
    $parent.select('svg:last-of-type g').call(bottom);
  }

  private renderPoints(ctx:CanvasRenderingContext2D, xscale:IScale, yscale:IScale, isNodeVisible:IBoundsPredicate, useAggregation:IBoundsPredicate, reason = ERenderReason.DIRTY) {
    const {x, y} = this.props;
    var renderer:ISymbolRenderer<T> = null;

    //function debugNode(color:string, x0:number, y0:number, x1:number, y1:number) {
    //  ctx.closePath();
    //  ctx.fillStyle = 'steelblue';
    //  ctx.fill();
    //  ctx.fillStyle = color;
    //  x0 = xscale(x0);
    //  y0 = yscale(y0);
    //  x1 = xscale(x1);
    //  y1 = yscale(y1);
    //  ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x0 - x1), Math.abs(y0 - y1));
    //  ctx.beginPath();
    //
    //}

    var rendered = 0, aggregated = 0, hidden = 0;

    function visitTree(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>, x0:number, y0:number, x1:number, y1:number) {
      if (!isNodeVisible(x0, y0, x1, y1)) {
        hidden += getTreeSize(node);
        return ABORT_TRAVERSAL;
      }
      if (useAggregation(x0, y0, x1, y1)) {
        let d = getFirstLeaf(node);
        //console.log('aggregate', getTreeSize(node));
        rendered++;
        aggregated += getTreeSize(node) - 1;
        renderer.render(xscale(x(d)), yscale(y(d)), d);
        return ABORT_TRAVERSAL;
      }
      if (isLeafNode(node)) { //is a leaf
        rendered += forEachLeaf(<QuadtreeLeaf<T>>node, (d) => renderer.render(xscale(x(d)), yscale(y(d)), d));
      }
      return CONTINUE_TRAVERSAL;
    }

    ctx.save();

    renderer = this.props.symbol(ctx, ERenderMode.NORMAL);
    rendered = 0;
    this.tree.visit(visitTree);
    console.log('rendered', rendered, 'aggregated', aggregated, 'hidden', hidden, 'total', this.tree.size());
    renderer.done();

    //render selected - TODO maybe in own canvas for performance of selection changes
    renderer = this.props.symbol(ctx, ERenderMode.SELECTED);
    this.selectionTree.visit(visitTree);
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
