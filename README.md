# HexagonGame
六边形消消乐

## 运行
```
npm ci
npm run dev
```
f12将浏览器设置为移动端调试模式

#### 玩法：  
分为主舞台和方块生成区域
六边形每条边所在的垂线上填充满以后消除该行

#### 代码结构：  

 - Hexagon 六边形类  
最基础的类，用来绘画六边形
 - Stage 舞台类  
棋盘，即被拖拽到的舞台，由n多个六边形拼接而成
 - Irregular 随机拼接多边形类  
随机生成拼接的方块
 - Interaction 基础交互类  
拖拽操作事件，各种消除提示判断


#### 截图：  
![版本1](https://github.com/Zhuchaoyi/HexagonGame/raw/master/show/demo2.png)