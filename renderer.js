export class Renderer {
    constructor(baseId, dirtId) {
        this.baseCanvas = document.getElementById(baseId);
        this.dirtCanvas = document.getElementById(dirtId);
        this.baseCtx = this.baseCanvas.getContext('2d');
        this.dirtCtx = this.dirtCanvas.getContext('2d');
        
        // 当たり判定専用のオフスクリーンCanvas
        this.collisionCanvas = document.createElement('canvas');
        this.collisionCanvas.width = 64;
        this.collisionCanvas.height = 64;
        this.collisionCtx = this.collisionCanvas.getContext('2d');
    }

    initLayers() {
        // 1. 宝石の描画
        this.baseCtx.fillStyle = '#00e5ff'; // 水色
        this.baseCtx.fillRect(24, 24, 16, 16);
        
        // 2. 当たり判定マップの作成（宝石と同じ位置を赤く塗る）
        this.collisionCtx.fillStyle = '#ff0000';
        this.collisionCtx.fillRect(24, 24, 16, 16);

        // 3. 泥の生成
        this.drawDirt();
    }

    drawDirt() {
        this.dirtCtx.globalCompositeOperation = 'source-over';
        this.dirtCtx.fillStyle = '#5d4037';
        this.dirtCtx.fillRect(0, 0, 64, 64);
        for (let i = 0; i < 150; i++) {
            this.dirtCtx.fillStyle = Math.random() > 0.5 ? '#4e342e' : '#6d4c41';
            this.dirtCtx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
        }
    }

    // 指定座標が宝石の上かチェック
    checkHitGem(x, y) {
        const pixel = this.collisionCtx.getImageData(x, y, 1, 1).data;
        return pixel[0] > 0; // 赤成分があれば宝石
    }

    // 削り処理
    erase(x, y, radius, isLine = false, lastX = null, lastY = null) {
        const ctx = this.dirtCtx;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        if (isLine && lastX !== null) {
            ctx.lineWidth = radius * 2;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 画面の汚れ（粉塵）を視覚化
    updateDustEffect(level) {
        // 泥Canvasの透明度を少し下げる、または全体に白い靄をかける
        this.dirtCanvas.style.filter = `contrast(${100 + level}%) brightness(${100 + level/2}%)`;
    }
}
