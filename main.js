import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.renderer = new Renderer('baseCanvas', 'dirtCanvas');
        this.input = new InputHandler(this.renderer.dirtCanvas);
        
        // ゲーム状態の初期化
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
            
            this.updateStats();
        };

        this.setupUI();
    }

    executeHammer(pos) {
        // 1. 削る
        this.renderer.erase(pos.x, pos.y, 6);
        
        // 2. 宝石ダメージ判定
        if (this.renderer.checkHitGem(pos.x, pos.y)) {
            this.state.gemHp -= 20;
            console.log("宝石にダメージ！ HP:", this.state.gemHp);
            // 本来はここで画面シェイクを呼ぶ
        }

        // 3. 粉塵が大幅に増える
        this.state.dust += 15;
    }

    executeBrush(pos, lastPos) {
        this.renderer.erase(pos.x, pos.y, 2.5, true, lastPos?.x, lastPos?.y);
        
        // ブラシは粉塵が少しずつ増える
        this.state.dust += 0.2;
    }

    updateStats() {
        if (this.state.gemHp <= 0) {
            this.state.gemHp = 0;
            this.state.isGameOver = true;
            alert("宝石が砕けてしまった！");
        }
        
        // 粉塵の視覚フィードバック
        this.renderer.updateDustEffect(this.state.dust);
        
        // UI更新（簡易版）
        document.getElementById('status').innerText = 
            `HP: ${Math.floor(this.state.gemHp)} | 汚れ: ${Math.floor(this.state.dust)}`;
    }

    setupUI() {
        const btnHammer = document.getElementById('btnHammer');
        const btnBrush = document.getElementById('btnBrush');

        btnHammer.onclick = () => { this.mode = 'hammer'; this.updateButtonUI(); };
        btnBrush.onclick = () => { this.mode = 'brush'; this.updateButtonUI(); };
        
        // 掃除ボタン（環境リセット）の追加想定
        const clearBtn = document.createElement('button');
        clearBtn.innerText = "水をまく";
        clearBtn.onclick = () => {
            this.state.dust = 0;
            this.renderer.updateDustEffect(0);
            this.updateStats();
        };
        document.querySelector('.controls').appendChild(clearBtn);
    }

    updateButtonUI() {
        document.getElementById('btnHammer').classList.toggle('active', this.mode === 'hammer');
        document.getElementById('btnBrush').classList.toggle('active', this.mode === 'brush');
    }
}

new Game();
