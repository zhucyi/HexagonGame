require('./reset.css')
require('./index.css')

import { Util } from './js/Util';
import { Stage } from './js/Stage';
import { Interaction } from './js/Interaction';
import { Irregular } from './js/Irregular';

let can, ctx

// const VConsole = require('vconsole')
// new VConsole();

document.addEventListener('DOMContentLoaded', () => {
    can = document.querySelector('#can')
    ctx = can.getContext('2d')

    let width = screen.availWidth,
        height = screen.availHeight
    can.width = width
    can.height = height

    let stage = new Stage(ctx, can.width, can.height - 200, 20, '#ffffff', '#bbbbbb')
    stage.init().draw()

    let ia = new Interaction(ctx)
    Util.saveBg(ctx, 0, 0, can.width, can.height)

    let ir = new Irregular(ctx, can.width / 2, can.height - 100, stage.r, 4, stage.border)
    ir.init().draw()
    ia.bindEvent(ir, stage)
});