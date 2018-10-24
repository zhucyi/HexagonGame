import { Util } from './Util';
import { Hexagon } from './Hexagon';
import { Irregular } from './Irregular';

export class Interaction { //基础交互类
    constructor(ctx) {
        this.ctx = ctx
        this.isPhone = 'ontouchstart' in window
        this.target = null
        this.stage = null
        this.moving = false
        this.oriPoint = {}
        this.mappingPoints = [] //被拖拽的 对应到舞台上的点
        this.fullLines = [] //满一行的点线
        this.score = 0
    }
    scoring(type, counts) { //type:1,2每次放下一个+20，每次消除一行每个格子+2
        Util.saveBg(this.ctx, 0, 0, can.width, can.height)
        let scores = type === 1 ? 20 : 2 * counts
        document.querySelector('#score').innerHTML = this.score
        this.score += scores
        let point = Object.assign(this.target.cp)
        let opacity = 1
        let textHandle
        return new Promise((res, rej) => {
            let scoreFunc = () => {
                if (opacity > 0) {
                    Util.putBg(this.ctx, 0, 0)
                    this.ctx.textAlign = 'center'
                    this.ctx.textBaseline = 'middle'
                    this.ctx.fillStyle = `rgba(51, 51, 51,${opacity})`
                    this.ctx.font = 'normal normal bold 20px Microsoft YaHei';
                    this.ctx.fillText(`+${scores}`, point.x, point.y);
                    point.x -= 1 * opacity
                    point.y -= 1 * opacity
                    opacity -= 0.02
                    textHandle && window.cancelAnimationFrame(textHandle)
                    textHandle = window.requestAnimationFrame(scoreFunc)
                } else {
                    Util.saveBg(this.ctx, 0, 0, can.width, can.height)
                    textHandle && window.cancelAnimationFrame(textHandle)
                    res()
                }
            }
            textHandle = window.requestAnimationFrame(scoreFunc)
        })
    }
    _isOver() {
        let cells = this.stage.cells
        let target = this.target
        for (let point of cells) {
            if (!point.done) {
                continue
            }
            let destPoi = [point]
            let targetPoi = target.points
            point: //循环-判断每一个点
            for (let index = 0, len = targetPoi.length; index < len; index++) {
                if (!targetPoi[index].dirctions) {
                    continue
                }
                let dirs = targetPoi[index].dirctions
                let dirPoint = destPoi[index]
                // dirs://循环-判断方向
                for (let ite of dirs) {
                    let p = dirPoint.mark[ite]
                    if (p === -1 || !p.done) {
                        destPoi.splice(1)
                        break point;
                    } else {
                        destPoi.push(p)
                    }
                }
                if (destPoi.length === targetPoi.length) {
                    return false
                }
            }
        }
        return true
    }
    _getLines(point, ids) { //获取消除行
        let dirs = [0, 1, 2]
        for (let item of dirs) {
            let lineRes = this._getLine(point, item, ids)
            if (lineRes.res) {
                this.fullLines.push(lineRes.arr)
            }
        }
    }
    _getLine(point, dirction, ids) {
        let p0 = point.mark[dirction]
        let p0Arr = [point]
        while (p0 != -1) {
            if (p0.done) {
                return {
                    res: false
                }
            }
            if (typeof ids[p0.id] === 'number' && ids[p0.id] > 0) {
                return {
                    res: false
                }
            }
            p0Arr.push(p0)
            p0 = p0.mark[dirction]
        }
        let p3 = point.mark[dirction + 3]
        let p3Arr = [point]
        while (p3 != -1) {
            if (p3.done) {
                return {
                    res: false
                }
            }
            if (typeof ids[p3.id] === 'number' && ids[p3.id] > 0) {
                return {
                    res: false
                }
            }
            p3Arr.push(p3)
            p3 = p3.mark[dirction + 3]
        }
        let resArr = Array.prototype.concat.call([], p3Arr.reverse(), p0Arr.splice(1))
        ids[point.id]++
        return {
            res: resArr.length > 1,
            arr: resArr
        }
    }
    _locate(x, y, arr) {
        let min = Infinity,
            order = -1
        arr.forEach((item, index) => {
            let cal = Math.pow(item.x - x, 2) + Math.pow(item.y - y, 2)
            if (min > cal) {
                min = cal
                order = index
            }
        })
        return order
    }
    _findPoints() {
        let negOne = false,
            isPaint = false
        let mousePosi = this.target.cp
        let order = this._locate(mousePosi.x, mousePosi.y, this.stage.cells) //目标点
        let point = this.stage.cells[order]
        let destPoi = [point]
        let targetPoi = this.target.points
        if (!point.done) {
            isPaint = true;
            return {
                negOne,
                isPaint,
                destPoi
            }
        }
        for (let index = 0, len = targetPoi.length; index < len; index++) {
            if (!targetPoi[index].dirctions) {
                continue
            }
            let dirs = targetPoi[index].dirctions
            let dirPoint = destPoi[index]
            for (let ite of dirs) {
                let p = dirPoint.mark[ite]
                if (p === -1) {
                    negOne = true;
                    return {
                        negOne,
                        isPaint,
                        destPoi
                    }
                } else if (!p.done) {
                    isPaint = true;
                    return {
                        negOne,
                        isPaint,
                        destPoi
                    }
                } else {
                    destPoi.push(p)
                }
            }
        }
        return {
            negOne,
            isPaint,
            destPoi
        }
    }
    _canDrop() {
        let finds = this._findPoints()
        if (finds.negOne || finds.isPaint) {
            return {
                res: false
            }
        }
        let mappingPoints = finds.destPoi

        let bound = this.target.getBoundRect()
        let sbound = this.stage.getBoundRect()
        let inBound = !(bound.min.x + this.stage.r < sbound.min.x ||
            bound.min.y + this.stage.r < sbound.min.y ||
            bound.max.x - this.stage.r > sbound.max.x ||
            bound.max.y - this.stage.r > sbound.max.y)
        return {
            res: (mappingPoints.indexOf(-1) < 0) && inBound,
            mappingPoints: mappingPoints
        }
    }
    _produceIrregular() {
        this.target = new Irregular(this.ctx, this.stage.width / 2, this.stage.height + 50, this.stage.r, 4, this.stage.border)
        this.target.init().draw()
    }
    _fill(canDrop) { //填满并且消除
        this.mappingPoints = canDrop.mappingPoints
        let ids = {} //匹配的id和对应这个点能消除的行数
        this.mappingPoints.forEach(item => {
            item.done = false
            item.color = this.target.color
            ids[item.id] = 0
            new Hexagon(this.ctx, item.x, item.y, this.stage.r, this.target.color, this.target.border)
                .draw(false, false)
        })
        this.fullLines.splice(0)
        this.mappingPoints.forEach(item => {
            this._getLines(item, ids)
        })
    }
    _EliminateLines() { //消除一行
        let counts = 0
        if (this.fullLines.length > 0) {
            this.fullLines.forEach(item => {
                item.forEach(p => {
                    counts++
                    p.done = true
                    // p.color =>p.color
                    p.color = this.stage.fill
                    new Hexagon(this.ctx, p.x, p.y, this.stage.r, this.stage.fill, this.stage.border)
                        .draw(false, false)
                })
            })
            return this.scoring(2, counts)
        } else {
            return this.scoring(1)
        }
    }
    drop() {
        let canDrop = this._canDrop()
        if (!canDrop.res) {
            Util.putBg(this.ctx, 0, 0)
            this.target = this.target.move(this.oriPoint.x, this.oriPoint.y).draw()
            return
        }
        Util.putBg(this.ctx, 0, 0)
        this._fill(canDrop)
        // this._EliminateLines() // 消除行
        this._EliminateLines().then(() => {
            // Util.saveBg(ctx, 0, 0, can.width, can.height)
            this._produceIrregular()
            if (this._isOver()) {
                setTimeout(() => {
                    alert('游戏结束')
                }, 100)
            }
            this.oriPoint = {}
        }).catch(e => {
            console.log(e)
        })
    }
    _drawShadow() { //移动目标再棋盘上填满对应的阴影
        let canDrop = this._canDrop()
        if (!canDrop.res) {
            return
        }
        this.mappingPoints = canDrop.mappingPoints
        this.mappingPoints.forEach(item => {
            new Hexagon(this.ctx, item.x, item.y, this.stage.r, '#f5f5f5', this.target.color)
                .draw(false, false)
        })
    }
    follow() {
        Util.clearAll(this.ctx)
        Util.putBg(this.ctx, 0, 0)
        this._drawShadow()
        this.target.draw()
        let animate = window.requestAnimationFrame(this.follow)
        window.cancelAnimationFrame(animate)
    }
    move(e) {
        e.preventDefault()
        let mousePosi = this.mousePosi(e, -50)
        this.moving = true
        this.target.move(mousePosi.x, mousePosi.y)
        this.follow()
    }
    // 鼠标位置点转化
    mousePosi(e, offset = 0) {
        let point = {
            x: 0,
            y: 0
        }
        if (this.isPhone && e.changedTouches.length > 0) {
            point.x = e.changedTouches[0].clientX
            point.y = e.changedTouches[0].clientY + offset
        } else {
            point.x = e.clientX
            point.y = e.clientY
        }
        return point
    }
    bindEvent(target, stage) {
        this.target = target
        this.stage = stage
        let event = {
            start: 'mousedown',
            move: 'mousemove',
            end: 'mouseup'
        }
        if (this.isPhone) {
            event = {
                start: 'touchstart',
                move: 'touchmove',
                end: 'touchend'
            }
        }
        let move = this.move.bind(this)
        can.addEventListener(event.start, e => {
            let mousePoint = this.mousePosi(e)
            if (this.ctx.isPointInPath(mousePoint.x, mousePoint.y)) {
                this.oriPoint = {
                    x: this.target.cp.x,
                    y: this.target.cp.y
                }
                can.addEventListener(event.move, move)
            }
            e.preventDefault()
        })
        can.addEventListener(event.end, e => {
            can.removeEventListener(event.move, move)
            if (this.moving) {
                this.drop()
                this.moving = false
            }
            e.preventDefault()
        })
    }
}