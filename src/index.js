
let can = document.querySelector('#can')
let ctx = can.getContext('2d')
class Hexagon { //六边形类
    constructor(ctx, x, y, r = 10) {
        this.points = []
        this.perpendicular = 0
        this.ctx = ctx
        this.x = x
        this.y = y
        this.r = r
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
    draw(begin, close, fill) { //判断是不是需要一笔画成
        this._getPoints()
        let points = this.points
        if (!begin) {
            this.ctx.beginPath()
        }
        this.ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1, len = points.length; i < len; i++) {
            this.ctx.lineTo(points[i].x, points[i].y)
        }
        this.ctx.strokeStyle = "blue"
        this.ctx.fillStyle = fill ? fill : '#fff'
        this.ctx.fill()
        if (!close) {
            this.ctx.closePath()
        }
        this.ctx.stroke();
        return this
    }
}

class Stage { //舞台类
    constructor(width, height, r = 10) {
        this.width = width
        this.height = height
        this.r = r
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
    randomId() {
        return (~~(Math.random() * (1 << 30))).toString(16)
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
                this.dp.id = this.randomId()
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
            new Hexagon(ctx, item.x, item.y, this.r).draw()
            ctx.fillStyle = 'red'
            ctx.font = "10px";
            ctx.fillText(`${item.x},${parseInt(item.y)}`, item.x - this.r / 2, item.y);
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
        this.target = null
        this.stage = null
        this.bg = null
        this.moving = false
        this.oriPoint = {}
        this.mappingPoints = [] //被拖拽的 对应到舞台上的点
        this.fullLines = [] //满一行的点线
        this.score = 0
    }
    clearAll() {
        ctx.clearRect(0, 0, can.width, can.height)
    }
    saveBg(x, y, width, height) {
        this.bg = ctx.getImageData(x, y, width, height)
    }
    putBg(x, y) {
        ctx.putImageData(this.bg, x, y)
    }
    Scoring(lineArr) {

    }
    removeLines(point, ids) { //消除
        let dirs = [0, 1, 2]
        for (let item of dirs) {
            let lineRes = this.getLine(point, item, ids)
            if (lineRes.res) {
                this.fullLines.push(lineRes.arr)
            }
        }
    }
    getLine(point, dirction, ids) {
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
            res: resArr.length === 1 ? false : true,
            arr: resArr
        }
    }
    locate(x, y, arr) {
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
    findPoints(e, target, stage) {
        let negOne = false,
            isPaint = false
        let order = this.locate(e.clientX, e.clientY, this.stage.cells) //目标点
        let point = this.stage.cells[order]
        let destPoi = [point]
        let targetPoi = target.points
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
    canDrop(e, target, stage) {
        let finds = this.findPoints(e, target, stage)
        if (finds.negOne || finds.isPaint) {
            return {
                res: false
            }
        }
        let mappingPoints = finds.destPoi
        let bound = target.getBoundRect()
        let sbound = stage.getBoundRect()
        let inBound = !(bound.min.x + stage.r < sbound.min.x ||
            bound.min.y + stage.r < sbound.min.y ||
            bound.max.x - stage.r > sbound.max.x ||
            bound.max.y - stage.r > sbound.max.y)
        return {
            res: (mappingPoints.indexOf(-1) < 0) && inBound,
            mappingPoints: mappingPoints
        }
    }
    drop(e) {
        let canDrop = this.canDrop(e, this.target, this.stage)
        if (!canDrop.res) {
            this.putBg(0, 0)
            this.target = this.target.move(this.oriPoint.x, this.oriPoint.y).draw()
            return
        }
        this.putBg(0, 0)
        this.mappingPoints = canDrop.mappingPoints
        let ids = {}//匹配的id和对应这个点能消除的行数
        this.mappingPoints.forEach(item => {
            item.done = false
            ids[item.id] = 0
            new Hexagon(ctx, item.x, item.y, this.stage.r).draw(false, false, this.target.color)
        })
        this.fullLines.splice(0)
        this.mappingPoints.forEach(item => {
            this.removeLines(item, ids)
        })
        if (this.fullLines.length > 0) {
            this.fullLines.forEach(item => {
                item.forEach(p => {
                    p.done = true
                    new Hexagon(ctx, p.x, p.y, this.stage.r).draw(false, false, '#fff')
                })
            })
        }

        this.saveBg(0, 0, can.width, can.height)
        // this.target.move(point.x, point.y).draw()

        this.target = new Irregular(can.width - 60, can.height / 2, this.stage.r, 4)
        this.target.init().draw()

        this.oriPoint = {}
    }
    bindEvent(target, stage) {
        this.target = target
        this.stage = stage
        let follow = () => {
            this.clearAll()
            this.putBg(0, 0)
            this.target.draw()
            let item = window.requestAnimationFrame(follow)
            window.cancelAnimationFrame(item)
        }
        let move = e => {
            e.preventDefault()
            this.moving = true
            this.target.move(e.clientX, e.clientY)
            follow()
        }
        if (document.ontouchstart) {
            can.addEventListener('touchstart', e => {
                alert()
                e.preventDefault()
                if (ctx.isPointInPath(e.clientX, e.clientY)) {
                    this.oriPoint = {
                        x: this.target.cp.x,
                        y: this.target.cp.y
                    }
                    can.addEventListener('touchmove', move)
                }
            })
            can.addEventListener('touchend', e => {
                e.preventDefault()
                can.removeEventListener('mousemove', move)
                if (this.moving) {
                    this.drop(e)
                    this.moving = false
                }
            })

        } else {
            can.addEventListener('mousedown', e => {
                e.preventDefault()
                if (ctx.isPointInPath(e.clientX, e.clientY)) {
                    this.oriPoint = {
                        x: this.target.cp.x,
                        y: this.target.cp.y
                    }
                    can.addEventListener('mousemove', move)
                }
            })
            can.addEventListener('mouseup', e => {
                e.preventDefault()
                can.removeEventListener('mousemove', move)
                if (this.moving) {
                    this.drop(e)
                    this.moving = false
                }
            })
        }
    }
}

class Irregular { //随机拼接多边形类
    constructor(x, y, r = 10, maxLength = 3) {
        this.cp = {
            x,
            y
        }
        this.r = r
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
        console.log(this, '\r\n', this.points)
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
    _randomColor() {
        return "#" + (~~(Math.random() * (1 << 24))).toString(16)
    }
    draw() {
        (!this.color) && (this.color = this._randomColor())
        this.points.forEach((item, index, arr) => {
            // let color = this._randomColor()
            if (index === 0) {
                new Hexagon(ctx, item.x, item.y, this.r).draw(false, false, this.color)
            } else if (index === arr.length - 1) {
                new Hexagon(ctx, item.x, item.y, this.r).draw(true, false, this.color)
            } else {
                new Hexagon(ctx, item.x, item.y, this.r).draw(true, false, this.color)
            }
        })
        this.points.forEach(item => {
            ctx.fillStyle = 'black'
            ctx.font = "10px";
            ctx.fillText(`${item.x},${parseInt(item.y)}`, item.x - this.r / 2, item.y);
        })
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

(() => {
    let stage = new Stage(can.width - 100, can.height, 20)
    stage.init().draw()

    let bound = stage.getBoundRect()
    ctx.beginPath()
    ctx.moveTo(bound.min.x, bound.min.y)
    ctx.lineTo(bound.max.x, bound.min.y)
    ctx.lineTo(bound.max.x, bound.max.y)
    ctx.lineTo(bound.min.x, bound.max.y)
    ctx.closePath()
    ctx.stroke()
    console.log(stage)

    let ia = new Interaction()
    ia.saveBg(0, 0, can.width, can.height)

    let ir = new Irregular(can.width - 50, can.height / 2, stage.r, 4)
    ir.init().draw()
    ia.bindEvent(ir, stage)
})()