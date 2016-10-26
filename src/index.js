"use strict";
var CanvasScatterplot = (function () {
    function CanvasScatterplot(data, canvas) {
        this.data = data;
        this.canvas = canvas;
    }
    CanvasScatterplot.prototype.render = function () {
        var c = this.canvas;
        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
    };
    return CanvasScatterplot;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CanvasScatterplot;
//# sourceMappingURL=index.js.map