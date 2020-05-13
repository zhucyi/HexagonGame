require('./assets/css/reset.css');
require('./assets/css/index.css');

import { Util } from './js/Util';
import { Stage } from './js/Stage';
import { Interaction } from './js/Interaction';
import { Irregular } from './js/Irregular';

let can, ctx;

// const VConsole = require('vconsole')
// new VConsole();

document.addEventListener('DOMContentLoaded', () => {
  can = document.querySelector('#can');
  ctx = can.getContext('2d');
  console.dir(can);

  // let width = screen.availWidth,
  //   height = screen.availHeight;
  // can.width = width;
  // can.height = height;

  can.width = can.clientWidth;
  can.height = can.clientHeight;
  const stageDelt = 0.2 * can.height;
  const irregularDelt = 0.1 * can.height;

  let stage = new Stage(
    ctx,
    can.width,
    can.height - stageDelt,
    20,
    '#fff',
    '#bbb'
  );
  stage.init().draw();

  let ia = new Interaction(ctx);
  Util.saveBg(ctx, 0, 0, can.width, can.height);

  let ir = new Irregular(
    ctx,
    can.width / 2,
    can.height - irregularDelt,
    stage.r,
    4,
    stage.border
  );
  ir.init().draw();
  ia.bindEvent(ir, stage);
});
