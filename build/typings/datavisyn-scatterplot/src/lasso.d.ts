import { ITester } from './quadtree';
export default class Lasso {
    private line;
    private points;
    start(x: number, y: number): void;
    drag(x: number, y: number): void;
    end(x: number, y: number): void;
    clear(): void;
    tester(p2nX: (p: number) => number, p2nY: (p: number) => number): ITester;
    render(ctx: CanvasRenderingContext2D): void;
}
