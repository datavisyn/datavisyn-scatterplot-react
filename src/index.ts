

export default class CanvasScatterplot {
  constructor(private data: any[], private canvas: HTMLCanvasElement) {
  }

  render() {
    const c = this.canvas;

    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

  }


}
