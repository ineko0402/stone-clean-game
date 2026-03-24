export class Renderer {
    constructor(baseId, dirtId) {
        this.baseCanvas = document.getElementById(baseId);
        this.dirtCanvas = document.getElementById(dirtId);
        this.baseCtx = this.baseCanvas.getContext('2d');
        this.dirtCtx = this.dirtCanvas.getContext('2d');
    }

    initLayers() {
        // 下層：宝石（仮のドット描画）
        this.baseCtx.fillStyle = '#00e5ff';
        this.baseCtx.fillRect(24, 24, 16, 16);
        this.baseCtx.fillStyle = '#fff';
        this.baseCtx.fillRect(26, 26, 4, 4);

        // 上層：泥の生成
        this.drawDirt();
    }

    drawDirt() {
        this.dirtCtx.fillStyle = '#5d4037';
        this.dirtCtx.fillRect(0, 0, 64, 64);
        // ランダムなドットで質感を出す
        for (let i = 0; i < 150; i++) {
            this.dirtCtx.fillStyle = Math.random() > 0.5 ? '#4e342e' : '#6d4c41';
            this.dirtCtx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
        }
    }

    // 削り実行
    erase(x, y, radius, isLine = false, lastX = null, lastY = null) {
        const ctx = this.dirtCtx;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
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
}
