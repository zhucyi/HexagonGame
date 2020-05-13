/**
 * 工具类
 */
const colors = [
  '#f16d7a',
  '#e27386',
  '#f55066',
  '#ef5464',
  '#ae716e',
  '#cb8e85',
  '#cf8878',
  '#c86f67',
  '#f1ccb8',
  '#f2debd',
  '#b7d28d',
  '#dcff93',
  '#ff9b6a',
  '#f1b8e4',
  '#d9b8f1',
  '#f1ccb8',
  '#f1f1b8',
  '#b8f1ed',
  '#e29e4b',
  '#edbf2b',
  '#fecf45',
  '#f9b747',
  '#c17e61',
  '#ed9678',
  '#ffe543',
  '#e37c5b',
  '#ff8240',
  '#aa5b71',
  '#f0b631',
  '#cf8888',
];
export class Util {
  static bg = null;
  static StepGradientColor(start, end, steps, cur) {
    let reg = /(.{2})(.{2})(.{2})/;
    let starts = start.substr(1).match(reg);
    let ends = end.substr(1).match(reg);
    let res = [];
    starts.forEach((item, index) => {
      let delt =
        (parseInt(ends[index], 16) - parseInt(starts[index]), 16) / steps;
      starts[index] = parseInt(starts[index], 16);
      res.push((parseInt(starts[index], 16) + cur * delt).toString(16));
    });
    return '#' + res.join();
  }
  static randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
    // return '#' + (~~(Math.random() * (1 << 24))).toString(16);
  }
  static randomId() {
    return (~~(Math.random() * (1 << 30))).toString(36);
  }
  static clearAll(ctx) {
    ctx.clearRect(0, 0, can.width, can.height);
  }
  static saveBg(ctx, x, y, width, height) {
    Util.bg = ctx.getImageData(x, y, width, height);
  }
  static putBg(ctx, x, y) {
    ctx.putImageData(Util.bg, x, y);
  }
}
