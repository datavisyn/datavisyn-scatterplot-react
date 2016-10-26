

class CanvasScatterplot {
  constructor(data, canvas) {
    this._data = data;
    this._canvas = canvas;
  }

  render() {
    const c = this._canvas;

    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

  }


}

export default CanvasScatterplot;
