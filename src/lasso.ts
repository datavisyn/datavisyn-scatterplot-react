import {line as d3line, curveCardinalClosed} from 'd3-shape';

declare type IPoint = [number, number];

export default class Lasso {
  private line = d3line().curve(curveCardinalClosed);
  private points: IPoint[] = [[100, 100],[200,200], [100, 300]];

  render(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) {
      return;
    }
    ctx.save();

    this.line.context(ctx)(this.points);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
    ctx.restore();
  }
}
