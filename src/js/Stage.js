import { Util } from './Util';
import { Hexagon } from './Hexagon';

export class Stage { //舞台类
    constructor(ctx, width, height, r = 10, fill, border) {
        this.ctx = ctx;
        this.width = width
        this.height = height
        this.r = r
        this.fill = fill || '#fff'
        this.border = border || '#eee'
        this.mistake = 0.1 //精度误差范围
        this.cp = {}
        this.lastDp = {}
        this.dp = {} //正被探测的点
        this.dCells = [] //需要被探测的点
        this.cells = []
        this.boundRect = {}
    }
    init() {
        this.mistake = this.r * this.mistake
        this.cp = {
            x: this.width / 2,
            y: this.height / 2
        }
        this.dp = Object.assign(this.cp, {
            mark: [false, false, false, false, false, false]
        }, //网格标记-用来判重构建网
            {
                done: false
            })
        //以x轴为正，逆时针排点
        this.dCells.push(this.dp)
        this._detectPoints()
        return this
    }
    _detectPoints() {
        while (this.dCells.length > 0) {
            this.dp = this.dCells.shift()
            if (!this.dp.done) {
                this.dp.mark.forEach((item, index) => {
                    if (!item) {
                        let subPoint = this._getSubPoint(index),
                            dirctions = this._excludeSource(index, [false, false, false, false, false, false]);
                        let verify = this._verifyPoint(subPoint)
                        if (verify.isPushed) {
                            let dCells = Array.prototype.concat.call([], this.dCells, this.cells)
                            this.dp.mark[index] = dCells[verify.order]
                        } else if (verify.isOut) {
                            this.dp.mark[index] = -1
                        } else {
                            subPoint = Object.assign(subPoint, {
                                mark: dirctions
                            }, {
                                    done: false
                                })
                            this.dCells.push(subPoint)
                            this.dp.mark[index] = subPoint
                        }
                    }
                })
                this.dp.done = true
                this.dp.color = this.fill
                this.dp.id = Util.randomId()
            }
            this.cells.push(this.dp)
        }
    }
    _getSubPoint(order) {
        let R = +(2 * this.r * Math.cos(Math.PI / 6)).toFixed(4)
        let dp = this.dp
        return {
            x: +(dp.x + R * Math.cos(Math.PI / 6 + Math.PI / 3 * order)).toFixed(4),
            y: +(dp.y - R * Math.sin(Math.PI / 6 + Math.PI / 3 * order)).toFixed(4)
        }
    }
    _excludeSource(index, dir) { //排除来源节点
        let map = [3, 4, 5, 0, 1, 2] //主从节点对应关系
        dir[map[index]] = this.dp
        return dir
    }
    _verifyPoint(p) { //判断点 已经在待探索数组中 已经越界
        let dCells = Array.prototype.concat.call([], this.dCells, this.cells)
        let isPushed = false
        let order = -1
        for (let i = 0, len = dCells.length; i < len; i++) {
            if (Math.abs(dCells[i].x - p.x) <= this.mistake && Math.abs(dCells[i].y - p.y) <= this.mistake) {
                isPushed = true
                order = i
                break
            }
        }
        let isOut = p.x - this.r < 0 || p.x + this.r > this.width || p.y - this.r < 0 || p.y + this.r >
            this.height
        return {
            isPushed: isPushed,
            isOut: isOut,
            order: order
        }
    }
    draw() {
        this.cells.forEach(item => {
            new Hexagon(this.ctx, item.x, item.y, this.r, this.fill, this.border).draw(false, false)
            // ctx.fillStyle = 'red'
            // ctx.font = "10px";
            // ctx.fillText(`${item.x},${parseInt(item.y)}`, item.x - this.r / 2, item.y);
        })
        return this
    }
    getBoundRect() {
        let min = {
            x: this.cells[0].x,
            y: this.cells[0].y
        },
            max = {
                x: this.cells[0].x,
                y: this.cells[0].y
            }
        this.cells.forEach(item => {
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
}