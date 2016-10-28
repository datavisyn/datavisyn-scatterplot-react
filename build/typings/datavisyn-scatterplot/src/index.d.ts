/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */
import './style.scss';
import { AxisScale } from 'd3-axis';
import * as d3scale from 'd3-scale';
import { ZoomScale } from 'd3-zoom';
import { ISymbol } from './symbol';
import * as _symbol from './symbol';
/**
 * a d3 scale essentially
 */
export interface IScale extends AxisScale<number>, ZoomScale {
    range(range: number[]): any;
    range(): number[];
    domain(): number[];
    domain(domain: number[]): any;
    invert(v: number): number;
    copy(): IScale;
}
export interface IAccessor<T> {
    (v: T): number;
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
    x?: IAccessor<T>;
    /**
     * y accessor of the data
     * default: d.y
     * @param d
     */
    y?: IAccessor<T>;
    /**
     * d3 x scale
     * default: linear scale with a domain from 0...100
     */
    xscale?: IScale;
    /**
     * d3 y scale
     * default: linear scale with a domain from 0...100
     */
    yscale?: IScale;
    /**
     * symbol used to render an data point
     * default: steelblue circle
     */
    symbol?: ISymbol<T>;
    /**
     * the radius in pixel in which a mouse click will be searched
     * default: 10
     */
    clickRadius?: number;
    /**
     * delay before a tooltip will be shown after a mouse was moved
     * default: 500
     */
    tooltipDelay?: number;
    /**
     * delay before a full redraw is shown during zooming
     */
    zoomDelay?: number;
    /**
     * shows the tooltip
     * @param parent the scatterplot html element
     * @param items items to show, empty to hide tooltip
     * @param x the x position relative to the plot
     * @param y the y position relative to the plot
     */
    showTooltip?(parent: HTMLElement, items: T[], x: number, y: number): any;
    /**
     * hook when the selection has changed
     * default: none
     */
    onSelectionChanged?(): any;
    /**
     * determines whether the given mouse is a selection or panning event
     * default: event.ctrlKey || event.altKey
     */
    isSelectEvent?(event: MouseEvent): boolean;
}
/**
 * reasons why a new render pass is needed
 */
export declare enum ERenderReason {
    DIRTY = 0,
    SELECTION_CHANGED = 1,
    ZOOMED = 2,
    PERFORM_SCALE_AND_TRANSLATE = 3,
    AFTER_SCALE_AND_TRANSLATE = 4,
    PERFORM_TRANSLATE = 5,
    AFTER_TRANSLATE = 6,
    PERFORM_SCALE = 7,
    AFTER_SCALE = 8,
}
/**
 * a class for rendering a scatterplot in a canvas
 */
export default class Scatterplot<T> {
    private parent;
    private props;
    private normalized2pixel;
    private canvasDataLayer;
    private canvasSelectionLayer;
    private tree;
    private selectionTree;
    /**
     * timout handle when the tooltip is shown
     * @type {number}
     */
    private showTooltipHandle;
    private lasso;
    private currentTransform;
    private zoomStartTransform;
    private zommHandle;
    constructor(data: T[], parent: HTMLElement, props?: IScatterplotOptions<T>);
    /**
     * returns the current selection
     */
    /**
     * sets the current selection
     * @param selection
     */
    selection: T[];
    /**
     * clears the selection, same as .selection=[]
     */
    clearSelection(): void;
    /**
     * shortcut to add items to the selection
     * @param items
     */
    addToSelection(items: T[]): void;
    /**
     * shortcut to remove items from the selection
     * @param items
     */
    removeFromSelection(items: T[]): void;
    private selectWithTester(tester);
    private checkResize();
    resized(): void;
    private transformedScales();
    private getMouseNormalizedPos(pixelpos?);
    private transformedNormalized2PixelScales();
    private onZoomStart();
    private onZoomEnd();
    private onZoom();
    private onDragStart();
    private onDrag();
    private onDragEnd();
    private onClick(event);
    private showTooltip(pos);
    private onMouseMove(event);
    private onMouseLeave(event);
    render(reason?: ERenderReason, transformDelta?: {
        x: number;
        y: number;
        k: number;
    }): void;
    private renderAxes(xscale, yscale);
    private renderTree(ctx, tree, renderer, xscale, yscale, isNodeVisible, useAggregation, debug?);
}
/**
 * reexport d3 scale
 */
export declare const scale: typeof d3scale;
export declare const symbol: typeof _symbol;
export declare function create<T>(data: T[], canvas: HTMLCanvasElement): Scatterplot<T>;
