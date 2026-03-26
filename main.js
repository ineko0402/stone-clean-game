import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.renderer = new Renderer('baseCanvas', 'dirtCanvas');
        this.input = new InputHandler(this.renderer.dirtCanvas);
        this.init();
    }

    init() {
        // 宝石のサイズパターン（5種類）を設定
        const sizePatterns = [
            { w: 12, h: 12 },
            { w: 16, h: 16 },
            { w: 20, h: 20 },
            { w: 24, h: 24 },
            { w: 16, h: 20 }
        ];
        const pattern = sizePatterns[Math.floor(Math.random() * sizePatterns.length)];
        
        // キャンバス(64x64)からはみ出さないように配置
        const maxX = 64 - pattern.w - 4; // 少し余裕を持たせる
        const maxY = 64 - pattern.h - 4;
        const x = 4 + Math.floor(Math.random() * (maxX - 4));
        const y = 4 + Math.floor(Math.random() * (maxY - 4));

        this.state = {
            gem: { x, y, w: pattern.w, h: pattern.h },
            gemHp: 100,
            dust: 0,
            isGameOver: false,
            isCleared: false,
            cleanPercent: 0
        };
        this.mode = 'hammer';
        
        this.renderer.initLayers(this.state.gem);
        this.input.init();

        this.input.onStroke = (pos, isFirst, lastPos) => {
            if (this.state.isGameOver || this.state.isCleared) return;

            if (this.mode === 'hammer') {
                if (isFirst) this.executeHammer(pos);
            } else {
                this.executeBrush(pos, lastPos);
            }
        };

        this.setupUI();
        // 判定用タイマー（1秒間に2回チェック）
        this.checkTimer = setInterval(() => this.calculateProgress(), 500);
        
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    // 宝石の上の泥がどれくらい消えたか計算
    calculateProgress() {
        if (this.state.isGameOver || this.state.isCleared) return;

        const { x, y, w, h } = this.state.gem;
        // 宝石の範囲のピクセルデータを取得
        const imgData = this.renderer.dirtCtx.getImageData(x, y, w, h).data;
        let clearPixels = 0;
        const totalPixels = w * h;

        for (let i = 3; i < imgData.length; i += 4) {
            if (imgData[i] === 0) clearPixels++; // アルファ値が0なら消去済み
        }

        this.state.cleanPercent = (clearPixels / totalPixels) * 100;

        // 95%以上綺麗になったらクリア
        if (this.state.cleanPercent >= 95) {
            this.state.isCleared = true;
            this.showResult("発掘成功！宝石を見つけました！");
        }
    }

    executeHammer(pos) {
        const hammerRadius = 12;
        this.renderer.erase(pos.x, pos.y, hammerRadius);
        this.renderer.createHammerParticles(pos.x, pos.y);

        if (this.checkGemInRange(pos.x, pos.y, hammerRadius)) {
            this.state.gemHp -= 20;
            document.querySelector('.canvas-container').classList.add('shake');
            setTimeout(() => document.querySelector('.canvas-container').classList.remove('shake'), 100);
        }

        this.state.dust += 10;
        this.renderer.updateDustEffect(this.state.dust);
        this.checkGameOver();
    }

    executeBrush(pos, lastPos) {
        this.renderer.erase(pos.x, pos.y, 2.5, true, lastPos?.x, lastPos?.y);
        this.state.dust += 0.1;
        this.renderer.updateDustEffect(this.state.dust);
    }

    checkGemInRange(x, y, radius) {
        const points = [{x, y}, {x:x-radius/2, y}, {x:x+radius/2, y}, {x, y:y-radius/2}, {x, y:y+radius/2}];
        return points.some(p => this.renderer.checkHitGem(p.x, p.y));
    }

    checkGameOver() {
        if (this.state.gemHp <= 0) {
            this.state.gemHp = 0;
            this.state.isGameOver = true;
            this.showResult("宝石が砕けてしまいました...");
        }
    }

    showResult(message) {
        clearInterval(this.checkTimer);
        setTimeout(() => {
            alert(`${message}\n残りHP: ${Math.floor(this.state.gemHp)}%`);
            if(confirm("もう一度挑戦しますか？")) {
                location.reload(); // リスタート（簡易実装）
            }
        }, 100);
    }

    gameLoop() {
        if (!this.state.isGameOver && !this.state.isCleared) {
            this.renderer.updateAndDrawParticles();
            this.updateStatsUI();
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    updateStatsUI() {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.innerText = `HP: ${Math.floor(this.state.gemHp)}% | 清掃率: ${Math.floor(this.state.cleanPercent)}% | 粉塵: ${Math.floor(this.state.dust)}`;
        }
    }

    setupUI() {
        document.getElementById('btnHammer').onclick = () => { this.mode = 'hammer'; this.updateButtonUI(); };
        document.getElementById('btnBrush').onclick = () => { this.mode = 'brush'; this.updateButtonUI(); };
        this.updateButtonUI();
    }

    updateButtonUI() {
        document.getElementById('btnHammer').classList.toggle('active', this.mode === 'hammer');
        document.getElementById('btnBrush').classList.toggle('active', this.mode === 'brush');
    }
}

new Game();
