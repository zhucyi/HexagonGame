
export class Hexagon { //六边形类
    constructor(ctx, x, y, r = 10, fill, border) {
        this.points = []
        this.perpendicular = 0
        this.ctx = ctx
        this.x = x
        this.y = y
        this.r = r
        this.fill = fill || '#ffffff'
        this.border = border || "#0000ff"
    }
    _getPoints() {
        this.perpendicular = this.r * Math.sin(Math.PI / 3)
        let angle = 0
        for (let i = 0; i < 6; i++) { //以x轴为正方向 递增60度
            this.points.push({
                x: this.x + this.r * Math.cos(angle),
                y: this.y + this.r * Math.sin(angle)
            })
            angle += Math.PI / 3
        }
    }
    draw(begin, close) { //判断是不是需要一笔画成
        this._getPoints()
        let points = this.points
        if (!begin) {
            this.ctx.beginPath()
        }
        this.ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1, len = points.length; i < len; i++) {
            this.ctx.lineTo(points[i].x, points[i].y)
        }
        this.ctx.strokeStyle = this.border
        this.ctx.fillStyle = this.fill
        this.ctx.fill()
        if (!close) {
            this.ctx.closePath()
        }
        this.ctx.stroke();
        return this
    }
}