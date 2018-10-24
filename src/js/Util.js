
export class Util { //工具类
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