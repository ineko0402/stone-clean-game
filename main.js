import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.renderer = new Renderer('baseCanvas', 'dirtCanvas');
        this.input = new InputHandler(this.renderer.dirtCanvas);
        
        this.state = {
            gemHp: 100,
            dust: 0,
            isGameOver: false
        };
        
        this.mode = 'hammer';
        this.init();
    }

    init() {
        this.renderer.initLayers();
        this.input.init();

        this.input.onStroke = (pos, isFirst, lastPos) => {
            if (this.state.isGameOver) return;

            if (this.mode === 'hammer') {
                if (isFirst) {
                    this.executeHammer(pos);
                }
            } else {
                this.executeBrush(pos, lastPos);
            }
        };

        this.setupUI();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    gameLoop(timestamp) {
        if (!this.state.isGameOver) {
            this.renderer.updateAndDrawParticles();
            this.updateStatsUI();
        }
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    executeHammer(pos) {
        // --- メリット: 広範囲消去 ---
        // ブラシの約5倍の半径（12px）で一気に泥を消し去る
        const hammerRadius = 12;
        this.renderer.erase(pos.x, pos.y, hammerRadius);
        
        // 破片パーティクルも多めに生成
        this.renderer.createHammerParticles(pos.x, pos.y);

        // --- デメリット: 精密性の欠如 ---
        // 叩いた中心点だけでなく、消去範囲内に宝石があるかチェック
        // 範囲が広いため、宝石の「縁」を叩いてもダメージ判定になりやすくなります
        if (this.checkGemInRange(pos.x, pos.y, hammerRadius)) {
            this.state.gemHp -= 15;
            // 画面が揺れるクラス付与（style.cssに.shakeがある場合）
            const container = document.querySelector('.canvas-container');
            container.classList.add('shake');
            setTimeout(() => container.classList.remove('shake'), 100);
        }

        this.state.dust += 15;
        this.renderer.updateDustEffect(this.state.dust);
        this.checkGameOver();
    }

    // 指定範囲内に宝石があるか簡易チェック
    checkGemInRange(x, y, radius) {
        // 中点、上下左右の5点で簡易的に宝石ヒットを判定
        const points = [
            {x: x, y: y},
            {x: x - radius/2, y: y},
            {x: x + radius/2, y: y},
            {x: x, y: y - radius/2},
            {x: x, y: y + radius/2}
        ];
        return points.some(p => this.renderer.checkHitGem(p.x, p.y));
    }

    executeBrush(pos, lastPos) {
        // ブラシは精密（半径2.5）
        this.renderer.erase(pos.x, pos.y, 2.5, true, lastPos?.x, lastPos?.y);
        this.state.dust += 0.2;
        this.renderer.updateDustEffect(this.state.dust);
    }

    // (以下、updateStatsUI, checkGameOver, setupUI, updateButtonUI は前回同様)
    updateStatsUI() {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.innerText = `宝石HP: ${Math.floor(this.state.gemHp)}% | 粉塵: ${Math.floor(this.state.dust)}`;
        }
    }

    checkGameOver() {
        if (this.state.gemHp <= 0) {
            this.state.gemHp = 0;
            this.state.isGameOver = true;
            setTimeout(() => alert("宝石が砕けてしまいました..."), 100);
        }
    }

    setupUI() {
        const btnHammer = document.getElementById('btnHammer');
        const btnBrush = document.getElementById('btnBrush');
        btnHammer.onclick = () => { this.mode = 'hammer'; this.updateButtonUI(); };
        btnBrush.onclick = () => { this.mode = 'brush'; this.updateButtonUI(); };
        
        const clearBtn = document.createElement('button');
        clearBtn.innerText = "水をまく";
        clearBtn.onclick = () => {
            this.state.dust = 0;
            this.renderer.updateDustEffect(0);
        };
        document.querySelector('.controls').appendChild(clearBtn);
        this.updateButtonUI();
    }

    updateButtonUI() {
        document.getElementById('btnHammer').classList.toggle('active', this.mode === 'hammer');
        document.getElementById('btnBrush').classList.toggle('active', this.mode === 'brush');
    }
}

new Game();
