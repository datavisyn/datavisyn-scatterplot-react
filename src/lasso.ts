/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */

import {line as d3line, curveLinearClosed} from 'd3-shape';
import {polygonHull, polygonContains} from 'd3-polygon';
import {extent} from 'd3-array';
import {hasOverlap, ITester} from './quadtree';

declare type IPoint = [number, number];

export default class Lasso {
  private line = d3line().curve(curveLinearClosed);
  private points:IPoint[] = [];

  start(x:number, y:number) {
    this.clear();
    this.points.push([x, y]);
  }

  drag(x:number, y:number) {
    this.points.push([x, y]);
  }

  end(x:number, y:number) {
    this.clear();
  }

  clear() {
    this.points = [];
  }

  tester(p2nX:(p:number)=>number, p2nY:(p:number)=>number): ITester {
    if (this.points.length < 3) {
      return null;
    }
    const polygon = polygonHull(this.points.map(([x,y]) => <[number, number]>[p2nX(x), p2nY(y)]));
    const [x0, x1] = extent(polygon, (d) => d[0]);
    const [y0, y1] = extent(polygon, (d) => d[1]);
    return {
      test: (x:number, y:number) => polygonContains(polygon, [x, y]),
      testArea: hasOverlap(x0, y0, x1, y1)
    };
  }

  render(ctx:CanvasRenderingContext2D) {
    if (this.points.length === 0) {
      return;
    }
    ctx.save();

    this.line.context(ctx)(this.points);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();

    function renderPoint([x,y]: IPoint) {
      ctx.moveTo(x, y);
      ctx.arc(x, y, 3, 0, Math.PI * 2);
    }

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.stroke();

    ctx.beginPath();
    renderPoint(this.points[0]);
    renderPoint(this.points[this.points.length - 1]);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}
