import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.renderer = new Renderer('baseCanvas', 'dirtCanvas');
        this.input = new InputHandler(this.renderer.dirtCanvas);
        
        // ゲーム状態の管理
        this.state = {
            gemHp: 100,
            dust: 0,
            isGameOver: false,
            score: 0
        };
        
        this.mode = 'hammer'; // 'hammer' または 'brush'
        this.lastTimestamp = 0;

        this.init();
    }

    init() {
        // レイヤーと入力の初期化
        this.renderer.initLayers();
        this.input.init();

        // 入力イベントのリスナー登録
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
        
        // ゲームループ開始
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    // 毎フレーム実行されるループ（パーティクル描画用）
    gameLoop(timestamp) {
        if (!this.state.isGameOver) {
            // 1. パーティクルの更新と描画
            this.renderer.updateAndDrawParticles();
            
            // 2. ステータス表示の更新（頻度を抑える場合は調整）
            this.updateStatsUI();
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    executeHammer(pos) {
        // 1. 泥を削る
        this.renderer.erase(pos.x, pos.y, 6);
        
        // 2. パーティクル生成（叩いた瞬間の飛び散り）
        this.renderer.createHammerParticles(pos.x, pos.y);

        // 3. 宝石ダメージ判定
        if (this.renderer.checkHitGem(pos.x, pos.y)) {
            this.state.gemHp -= 15; // ダメージ量
            // TODO: ここで画面シェイクなどの演出を呼び出す
        }

        // 4. 環境変化（粉塵の増加）
        this.state.dust += 10;
        this.renderer.updateDustEffect(this.state.dust);

        this.checkGameOver();
    }

    executeBrush(pos, lastPos) {
        // 1. 泥を削る（線状）
        this.renderer.erase(pos.x, pos.y, 2.5, true, lastPos?.x, lastPos?.y);
        
        // 2. 環境変化（ブラシは少しずつ汚れる）
        this.state.dust += 0.1;
        this.renderer.updateDustEffect(this.state.dust);
    }

    checkGameOver() {
        if (this.state.gemHp <= 0) {
            this.state.gemHp = 0;
            this.state.isGameOver = true;
            setTimeout(() => alert("宝石が壊れてしまいました..."), 100);
        }
    }

    updateStatsUI() {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.innerText = `宝石HP: ${Math.floor(this.state.gemHp)}% | 粉塵: ${Math.floor(this.state.dust)}`;
        }
    }

    setupUI() {
        const btnHammer = document.getElementById('btnHammer');
        const btnBrush = document.getElementById('btnBrush');

        // モード切替
        btnHammer.onclick = () => { this.mode = 'hammer'; this.updateButtonUI(); };
        btnBrush.onclick = () => { this.mode = 'brush'; this.updateButtonUI(); };
        
        // 掃除アクション（水をまく）の追加
        const clearBtn = document.createElement('button');
        clearBtn.innerText = "水をまく";
        clearBtn.style.marginLeft = "10px";
        clearBtn.onclick = () => {
            this.state.dust = 0;
            this.renderer.updateDustEffect(0);
        };
        document.querySelector('.controls').appendChild(clearBtn);

        this.updateButtonUI();
    }

    updateButtonUI() {
        const btnHammer = document.getElementById('btnHammer');
        const btnBrush = document.getElementById('btnBrush');
        if (btnHammer && btnBrush) {
            btnHammer.classList.toggle('active', this.mode === 'hammer');
            btnBrush.classList.toggle('active', this.mode === 'brush');
        }
    }
}

// ゲームインスタンスの生成
new Game();
