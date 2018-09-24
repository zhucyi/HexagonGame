require('./reset.css')
require('./index.css')
let can, ctx

// const VConsole = require('vconsole')
// new VConsole();

class Util { //工具类
    static bg = null;
    static StepGradientColor(start, end, steps, cur) {
        let reg = /(.{2})(.{2})(.{2})/
        let starts = start.substr(1).match(reg)
        let ends = end.substr(1).match(reg)
        let res = []
        starts.forEach((item, index) => {
            let delt = (parseInt(ends[index], 16) - parseInt(starts[index]), 16) / steps
            starts[index] = parseInt(starts[index], 16)
            res.push((parseInt(starts[index], 16) + cur * delt).toString(16))
        })
        return '#' + res.join()
    }
    static randomColor() {
        return "#" + (~~(Math.random() * (1 << 24))).toString(16)
    }
    static randomId() {
        return (~~(Math.random() * (1 << 30))).toString(36)
    }
    static clearAll(ctx) {
        ctx.clearRect(0, 0, can.width, can.height)
    }
    static saveBg(ctx, x, y, width, height) {
        Util.bg = ctx.getImageData(x, y, width, height)
    }
    static putBg(ctx, x, y) {
        ctx.putImageData(Util.bg, x, y)
    }
}

class Hexagon { //六边形类
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

class Stage { //舞台类
    constructor(width, height, r = 10, fill, border) {
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
            new Hexagon(ctx, item.x, item.y, this.r, this.fill, this.border).draw(false, false)
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

class Interaction { //基础交互类
    constructor() {
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
        Util.saveBg(ctx, 0, 0, can.width, can.height)
        let scores = type === 1 ? 20 : 2 * counts
        document.querySelector('#score').innerHTML = this.score
        this.score += scores
        let point = Object.assign(this.target.cp)
        let opacity = 1
        let textHandle
        return new Promise((res, rej) => {
            let scoreFunc = function () {
                if (opacity > 0) {
                    Util.putBg(ctx, 0, 0)
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillStyle = `rgba(51, 51, 51,${opacity})`
                    ctx.font = 'normal normal bold 20px Microsoft YaHei';
                    ctx.fillText(`+${scores}`, point.x, point.y);
                    point.x -= 1 * opacity
                    point.y -= 1 * opacity
                    opacity -= 0.02
                    textHandle && window.cancelAnimationFrame(textHandle)
                    textHandle = window.requestAnimationFrame(scoreFunc)
                } else {
                    Util.saveBg(ctx, 0, 0, can.width, can.height)
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
        this.target = new Irregular(this.stage.width / 2, this.stage.height + 50, this.stage.r, 4, this.stage.border)
        this.target.init().draw()
    }
    _fill(canDrop) { //填满并且消除
        this.mappingPoints = canDrop.mappingPoints
        let ids = {} //匹配的id和对应这个点能消除的行数
        this.mappingPoints.forEach(item => {
            item.done = false
            item.color = this.target.color
            ids[item.id] = 0
            new Hexagon(ctx, item.x, item.y, this.stage.r, this.target.color, this.target.border)
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
                    console.log(p.color, this.stage.fill)
                    p.color = this.stage.fill
                    new Hexagon(ctx, p.x, p.y, this.stage.r, this.stage.fill, this.stage.border)
                        .draw(false, false)
                })
            })
            return this.scoring(2, counts)
        }else{
            return this.scoring(1)
        }
    }
    drop() {
        let canDrop = this._canDrop()
        if (!canDrop.res) {
            Util.putBg(ctx, 0, 0)
            this.target = this.target.move(this.oriPoint.x, this.oriPoint.y).draw()
            return
        }
        Util.putBg(ctx, 0, 0)
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
        }).catch(e=>{
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
            new Hexagon(ctx, item.x, item.y, this.stage.r, '#f5f5f5', this.target.color)
                .draw(false, false)
        })
    }
    follow() {
        Util.clearAll(ctx)
        Util.putBg(ctx, 0, 0)
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
            if (ctx.isPointInPath(mousePoint.x, mousePoint.y)) {
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

class Irregular { //随机拼接多边形类
    constructor(x, y, r = 10, maxLength = 3, border) {
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
                new Hexagon(ctx, item.x, item.y, this.r, this.color, this.border)
                    .draw(false, false)
            } else if (index === arr.length - 1) {
                new Hexagon(ctx, item.x, item.y, this.r, this.color, this.border)
                    .draw(true, false)
            } else {
                new Hexagon(ctx, item.x, item.y, this.r, this.color, this.border)
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

document.addEventListener('DOMContentLoaded', () => {
    can = document.querySelector('#can')
    ctx = can.getContext('2d')

    let width = screen.availWidth,
    height = screen.availHeight
    can.width = width
    can.height = height

    let stage = new Stage(can.width, can.height - 200, 20, '#ffffff', '#bbbbbb')
    stage.init().draw()

    let ia = new Interaction()
    Util.saveBg(ctx, 0, 0, can.width, can.height)

    let ir = new Irregular(can.width / 2, can.height - 100, stage.r, 4, stage.border)
    ir.init().draw()
    ia.bindEvent(ir, stage)
});