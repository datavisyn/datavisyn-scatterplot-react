/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */
import { SymbolType } from 'd3-shape';
/**
 * a symbol renderer renderes a bunch of data points using `render` at the end `done` will be called
 */
export interface ISymbolRenderer<T> {
    render(x: number, y: number, d: T): any;
    done(): any;
}
/**
 * rendering mode for different kind of renderings
 */
export declare enum ERenderMode {
    NORMAL = 0,
    SELECTED = 1,
    HOVER = 2,
}
/**
 * factory for creating symbols renderers
 */
export interface ISymbol<T> {
    /**
     * @param ctx the context to use
     * @param mode the current render mode
     * @returns a symbol renderer
     */
    (ctx: CanvasRenderingContext2D, mode: ERenderMode): ISymbolRenderer<T>;
}
export declare const d3SymbolCircle: SymbolType;
export declare const d3SymbolCross: SymbolType;
export declare const d3SymbolDiamond: SymbolType;
export declare const d3SymbolSquare: SymbolType;
export declare const d3SymbolStar: SymbolType;
export declare const d3SymbolTriangle: SymbolType;
export declare const d3SymbolWye: SymbolType;
/**
 * generic wrapper around d3 symbols for rendering
 * @param symbol the symbol to render
 * @param fillStyle the style applied
 * @param size the size of the symbol
 * @returns {function(CanvasRenderingContext2D): undefined}
 */
export declare function d3Symbol(symbol?: SymbolType, fillStyle?: string, size?: number): ISymbol<any>;
/**
 * circle symbol renderer (way faster than d3Symbol(d3symbolCircle)
 * @param fillStyle
 * @param size
 * @returns {function(CanvasRenderingContext2D): undefined}
 */
export declare function circleSymbol(fillStyle?: string, size?: number): ISymbol<any>;
