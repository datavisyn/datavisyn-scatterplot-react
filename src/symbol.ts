/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */

import {symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle, symbolWye} from 'd3-shape';

export interface ISymbolRenderer<T> {
  render(x:number, y:number, d:T);
  done();
}

export enum ERenderMode {
  NORMAL,
  SELECTED,
  HOVER
}

export interface ISymbol<T> {
  (ctx:CanvasRenderingContext2D, mode: ERenderMode): ISymbolRenderer<T>;
}

export const d3SymbolCircle = symbolCircle;
export const d3SymbolCross = symbolCross;
export const d3SymbolDiamond = symbolDiamond;
export const d3SymbolSquare = symbolSquare;
export const d3SymbolStar = symbolStar;
export const d3SymbolTriangle = symbolTriangle;
export const d3SymbolWye = symbolWye;

/**
 * generic wrapper around d3 symbols for rendering
 * @param symbol the symbol to render
 * @param fillStyle the style applied
 * @param size the size of the symbol
 * @returns {function(CanvasRenderingContext2D, IPoorManIterator): undefined}
 */
export function d3Symbol(symbol = d3SymbolCircle, fillStyle:string = 'steelblue', size = 5):ISymbol<any> {
  return (ctx:CanvasRenderingContext2D) => {
    //before
    ctx.beginPath();
    return {
      //during
      render: (x:number, y:number) => {
        ctx.translate(x, y);
        symbol.draw(ctx, size);
        ctx.translate(-x, -y);
      },
      //after
      done: () => {
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
    };
  };
}

/**
 * circle symbol renderer (way faster than d3Symbol(d3symbolCircle)
 * @param fillStyle
 * @param size
 * @returns {function(CanvasRenderingContext2D, IPoorManIterator): undefined}
 */
export function circleSymbol(fillStyle:string = 'steelblue', size = 20):ISymbol<any> {
  const r = Math.sqrt(size / Math.PI);
  const tau = 2 * Math.PI;

  const styles = {
    [ERenderMode.NORMAL]: fillStyle,
    [ERenderMode.HOVER]: 'orange',
    [ERenderMode.SELECTED]: 'red'
  };

  return (ctx:CanvasRenderingContext2D, mode : ERenderMode) => {
    //before
    ctx.beginPath();
    return {
      //during
      render: (x:number, y:number) => {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, tau);
      },
      //after
      done: () => {
        ctx.closePath();
        ctx.fillStyle = styles[mode];
        ctx.fill();
      }
    };
  };
}
