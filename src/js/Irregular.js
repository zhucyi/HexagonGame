import { Util } from './Util';
import { Hexagon } from './Hexagon';

export class Irregular { //随机拼接多边形类
    constructor(ctx, x, y, r = 10, maxLength = 3, border) {
        this.ctx = ctx
        this.cp = {
            x,
            y
        }
        this.r = r
        this.border = border || '#fff'
        this.color = ''
        this.mistake = 0.1
        this.boundRect = {}
        this.dp = null
        this.dirNum = 0
        this.dirction = {} //随机结果判重
        this.hexCount = Math.floor(Math.random() * maxLength) + 1
        this.points = []
    }
    init() {
        this.mistake = this.mistake * this.r
        this.points.push(this.cp)
        while (this.hexCount > 0) {
            let point = this._detectPoint()
            this.points.push(point)
            // 记录派生关系
            if (this.dp.dirctions) {
                this.dp.dirctions.push(this.dirNum)
            } else {
                this.dp.dirctions = [this.dirNum]
            }
            this.hexCount--
        }
        this.getBoundRect()
        return this
    }
    _detectPoint() {
        this._randomDetectPoint()
        let point = this._getSubPoint(this.dirNum)
        if (this._verifyPoint(point)) {
            point = this._detectPoint.bind(this)()
        }
        return point
    }
    _randomDetectPoint() {
        let pointNumber = Math.floor(Math.random() * (this.points.length - 1))
        let dirction = Math.floor(Math.random() * 5)

        if (!this.dirction[pointNumber]) {
            this.dirction[pointNumber] = [false, false, false, false, false, false]
            this.dirction[pointNumber][dirction] = true
            this.dp = this.points[pointNumber]
            this.dirNum = dirction
            return
        }
        let trues = this.dirction[pointNumber].toString().match(/true/g).length
        if (trues === this.dirction[pointNumber].length) {
            this._randomDetectPoint.bind(this)()
            return
        }
        while (this.dirction[pointNumber][dirction]) {
            dirction = (dirction + 1) % 6
        }
        this.dp = this.points[pointNumber]
        this.dirNum = dirction
    }
    _getSubPoint(order) {
        let R = +(2 * this.r * Math.cos(Math.PI / 6)).toFixed(4)
        let dp = this.dp
        return {
            x: +(dp.x + R * Math.cos(Math.PI / 6 + Math.PI / 3 * order)).toFixed(4),
            y: +(dp.y - R * Math.sin(Math.PI / 6 + Math.PI / 3 * order)).toFixed(4)
        }
    }
    _verifyPoint(p) { //判断点 已经在待探索数组中
        let dCells = Array.prototype.concat.call([], this.points)
        let isPushed = false
        for (let item of dCells) {
            if (Math.abs(item.x - p.x) < this.mistake && Math.abs(item.y - p.y) < this.mistake) {
                isPushed = true
                break
            }
        }
        return isPushed
    }
    draw() {
        (!this.color) && (this.color = Util.randomColor())
        this.points.forEach((item, index, arr) => {
            if (index === 0) {
                new Hexagon(this.ctx, item.x, item.y, this.r, this.color, this.border)
                    .draw(false, false)
            } else if (index === arr.length - 1) {
                new Hexagon(this.ctx, item.x, item.y, this.r, this.color, this.border)
                    .draw(true, false)
            } else {
                new Hexagon(this.ctx, item.x, item.y, this.r, this.color, this.border)
                    .draw(true, false)
            }
        })
        // this.points.forEach(item => {
        //     ctx.fillStyle = 'black'
        //     ctx.font = '10px';
        //     ctx.fillText(`${item.x},${parseInt(item.y)}`, item.x - this.r / 2, item.y);
        // })
        return this
    }
    getBoundRect() {
        let min = {
            x: this.points[0].x,
            y: this.points[0].y
        },
            max = {
                x: this.points[0].x,
                y: this.points[0].y
            }
        this.points.forEach(item => {
            if (item.x < min.x) {
                min.x = item.x
            }
            if (item.y < min.y) {
                min.y = item.y
            }
            if (item.x > max.x) {
                max.x = item.x
            }
            if (item.y > max.y) {
                max.y = item.y
            }
        })
        this.boundRect = {
            min: {
                x: min.x - this.r,
                y: min.y - this.r
            },
            max: {
                x: max.x + this.r,
                y: max.y + this.r
            }
        }
        return this.boundRect
    }
    move(x, y) {
        let deltX = this.cp.x - x,
            deltY = this.cp.y - y
        this.cp = {
            x,
            y
        }
        this.points.forEach((item, index, arr) => {
            item.x = item.x - deltX
            item.y = item.y - deltY
        })
        return this
    }
}