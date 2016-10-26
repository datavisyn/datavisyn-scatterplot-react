"use strict";
var d3scale = require('d3-scale');
var d3shape = require('d3-shape');
function d3Symbol(symbol, fillStyle, size) {
    if (symbol === void 0) { symbol = d3shape.symbolCircle; }
    if (fillStyle === void 0) { fillStyle = 'steelblue'; }
    if (size === void 0) { size = 5; }
    return function (ctx, next) {
        ctx.fillStyle = fillStyle;
        var n;
        while ((n = next()) !== null) {
            ctx.translate(n.x, n.y);
            symbol.draw(ctx, size);
            ctx.translate(-n.x, -n.y);
        }
        ctx.fill();
    };
}
exports.d3Symbol = d3Symbol;
function circleSymbol(fillStyle, size) {
    if (fillStyle === void 0) { fillStyle = 'steelblue'; }
    if (size === void 0) { size = 5; }
    return function (ctx, next) {
        ctx.fillStyle = fillStyle;
        var r = Math.sqrt(size / Math.PI);
        var tau = 2 * Math.PI;
        var n;
        while ((n = next()) !== null) {
            ctx.arc(n.x, n.y, r, 0, tau);
        }
        ctx.fill();
    };
}
exports.circleSymbol = circleSymbol;
/**
 * a class for rendering a scatterplot in a canvas
 */
var CanvasScatterplot = (function () {
    function CanvasScatterplot(data, canvas) {
        this.data = data;
        this.canvas = canvas;
        this.x = function (v) { return v.x; };
        this.xscale = d3scale.scaleLinear().domain([0, 1]);
        this.y = function (v) { return v.y; };
        this.yscale = d3scale.scaleLinear().domain([0, 1]);
        this.symbol = circleSymbol();
    }
    CanvasScatterplot.prototype.checkResize = function () {
        var c = this.canvas;
        if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
            c.width = c.clientWidth;
            c.height = c.clientHeight;
            return true;
        }
        return false;
    };
    Object.defineProperty(CanvasScatterplot.prototype, "ctx", {
        get: function () {
            return this.canvas.getContext('2d');
        },
        enumerable: true,
        configurable: true
    });
    CanvasScatterplot.prototype.render = function () {
        var c = this.canvas, ctx = this.ctx;
        this.checkResize();
        ctx.clearRect(0, 0, c.width, c.height);
        this.xscale.range([0, c.width]);
        this.yscale.range([c.height, 0]);
        var l = this.data.length;
        var i = 0;
        //poor man iterator
        function next() {
            if (i === l) {
                return null;
            }
            var d = this.data[i++];
            return { x: this.xscale(this.x(d)), y: this.yscale(this.y(d)) };
        }
        ctx.save();
        this.symbol(ctx, next.bind(this));
        ctx.restore();
    };
    return CanvasScatterplot;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CanvasScatterplot;
/**
 * reexport d3 scale
 */
exports.scale = d3scale;
function create(data, canvas) {
    return new CanvasScatterplot(data, canvas);
}
exports.create = create;
//# sourceMappingURL=index.js.map