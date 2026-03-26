import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { AudioManager } from './audio.js';

class Game {
    constructor() {
        this.renderer = new Renderer('baseCanvas', 'dirtCanvas');
        this.input = new InputHandler(this.renderer.dirtCanvas);
        this.audio = new AudioManager();
        
        // ブラウザ制限のため、初回のクリック/タッチでオーディオを開始する
        const initAudio = () => {
            this.audio.init();
            window.removeEventListener('mousedown', initAudio);
            window.removeEventListener('touchstart', initAudio);
        };
        window.addEventListener('mousedown', initAudio);
        window.addEventListener('touchstart', initAudio);

        this.init();
    }

    init() {
        // 宝石の種類定義（名前, 色, レア度, 出現率）
        const gemTypes = [
            { id: 'emerald', name: 'エメラルド', color: '#00e676', rarity: 1, weight: 50 },
            { id: 'ruby', name: 'ルビー', color: '#ff1744', rarity: 2, weight: 30 },
            { id: 'sapphire', name: 'サファイア', color: '#2979ff', rarity: 3, weight: 15 },
            { id: 'diamond', name: 'ダイヤモンド', color: '#f5f5f5', rarity: 5, weight: 5 }
        ];

        // 重み付きランダム選択
        const totalWeight = gemTypes.reduce((sum, g) => sum + g.weight, 0);
        let random = Math.random() * totalWeight;
        const gemType = gemTypes.find(g => {
            random -= g.weight;
            return random <= 0;
        }) || gemTypes[0];

        // 宝石のサイズパターン
        const sizePatterns = [
            { w: 12, h: 12 },
            { w: 16, h: 16 },
            { w: 20, h: 20 },
            { w: 24, h: 24 },
            { w: 16, h: 20 }
        ];
        const pattern = sizePatterns[Math.floor(Math.random() * sizePatterns.length)];
        
        const maxX = 64 - pattern.w - 4;
        const maxY = 64 - pattern.h - 4;
        const x = 4 + Math.floor(Math.random() * (maxX - 4));
        const y = 4 + Math.floor(Math.random() * (maxY - 4));

        // 通貨・アップグレード・進捗：localStorageから復元
        this.totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
        this.brushLevel = parseInt(localStorage.getItem('brushLevel')) || 1;
        this.currentStage = parseInt(localStorage.getItem('currentStage')) || 1;
        this.collection = JSON.parse(localStorage.getItem('gemCollection')) || [];
        
        // ブラシレベル設定 (半径px, 必要コイン)
        this.brushConfig = [
            { radius: 2.5, cost: 0 },
            { radius: 4.0, cost: 200 },
            { radius: 6.0, cost: 500 },
            { radius: 9.0, cost: 1200 },
            { radius: 13.0, cost: 3000 }
        ];

        // ステージに応じた難易度設定
        // ステージが上がるほど泥が硬くなる（一回で消える量が減る）
        this.dirtHardness = Math.max(0.05, 0.4 - (this.currentStage * 0.03));

        this.state = {
            gem: { ...pattern, x, y, type: gemType },
            gemHp: 100,
            dust: 0,
            isGameOver: false,
            isCleared: false,
            cleanPercent: 0,
            lastMilestone: 0,
            earnedCoins: 0
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
        // 判定用タイマー（1秒間に4回チェック - より滑らかに）
        this.checkTimer = setInterval(() => this.calculateProgress(), 250);
        
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    // 宝石の上の泥がどれくらい消えたか計算
    calculateProgress() {
        if (this.state.isGameOver || this.state.isCleared) return;

        const { x, y, w, h } = this.state.gem;
        const imgData = this.renderer.dirtCtx.getImageData(x, y, w, h).data;
        let clearPixels = 0;
        const totalPixels = w * h;

        for (let i = 3; i < imgData.length; i += 4) {
            if (imgData[i] === 0) clearPixels++;
        }

        const newPercent = (clearPixels / totalPixels) * 100;
        this.state.cleanPercent = newPercent;

        // マイルストーン検知 (25, 50, 75%)
        const milestone = Math.floor(newPercent / 25) * 25;
        if (milestone > this.state.lastMilestone && milestone < 100) {
            this.state.lastMilestone = milestone;
            this.renderer.triggerMilestoneFlash();
        }

        // 95%以上綺麗になったらクリア
        if (this.state.cleanPercent >= 95) {
            this.state.cleanPercent = 100; // 表示上は100%にする
            this.state.isCleared = true;
            this.showResult("発掘成功！", "素晴らしい宝石を見つけました！");
        }
    }

    executeHammer(pos) {
        const hammerRadius = 12;
        this.renderer.erase(pos.x, pos.y, hammerRadius);
        this.renderer.createHammerParticles(pos.x, pos.y);
        
        // サウンド
        this.audio.playHammer();

        if (this.checkGemInRange(pos.x, pos.y, hammerRadius)) {
            this.state.gemHp -= 20;
            this.audio.playDamage(); // 破損音
            document.querySelector('.canvas-container').classList.add('shake');
            setTimeout(() => document.querySelector('.canvas-container').classList.remove('shake'), 100);
        }

        this.state.dust += 10;
        this.renderer.updateDustEffect(this.state.dust);
        this.checkGameOver();
    }

    executeBrush(pos, lastPos) {
        const radius = this.brushConfig[this.brushLevel - 1].radius;
        this.renderer.erase(pos.x, pos.y, radius, true, lastPos?.x, lastPos?.y, this.dirtHardness);
        this.audio.playBrush(); // ブラシ音
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
            this.showResult("砕損...", "宝石が砕けてしまいました。");
        }
    }

    showResult(title, message) {
        clearInterval(this.checkTimer);
        this.updateStatsUI();
        
        let rank = 'D';
        let multiplier = 0;
        if (this.state.isCleared) {
            const hp = this.state.gemHp;
            if (hp >= 90) { rank = 'S'; multiplier = 10; }
            else if (hp >= 70) { rank = 'A'; multiplier = 5; }
            else if (hp >= 40) { rank = 'B'; multiplier = 2; }
            else { rank = 'C'; multiplier = 1; }

            // 次のステージへ & コレクションの更新
            this.currentStage++;
            localStorage.setItem('currentStage', this.currentStage);
            
            if (!this.collection.includes(this.state.gem.type.id)) {
                this.collection.push(this.state.gem.type.id);
                localStorage.setItem('gemCollection', JSON.stringify(this.collection));
            }
        }

        const basePoints = this.state.gem.type.rarity * 5;
        this.state.earnedCoins = basePoints * multiplier;
        this.totalCoins += this.state.earnedCoins;
        localStorage.setItem('totalCoins', this.totalCoins);

        const overlay = document.getElementById('resultOverlay');
        const titleEl = document.getElementById('resultTitle');
        const textEl = document.getElementById('resultText');
        const hpEl = document.getElementById('finalHp');
        const progEl = document.getElementById('finalProgress');
        const rankEl = document.getElementById('rankLabel');
        const gemNameEl = document.getElementById('gemName');

        titleEl.innerText = title;
        textEl.innerText = this.state.isCleared ? 
            `${message}（+${this.state.earnedCoins}コイン獲得！）` : message;
        hpEl.innerText = Math.floor(this.state.gemHp);
        progEl.innerText = Math.floor(this.state.cleanPercent);
        
        if (rankEl) {
            rankEl.innerText = rank;
            rankEl.className = `rank-badge rank-${rank.toLowerCase()}`;
        }
        if (gemNameEl) {
            gemNameEl.innerText = this.state.gem.type.name;
            gemNameEl.style.color = this.state.gem.type.color;
        }

        overlay.classList.remove('hidden');
        if (this.state.isCleared) {
            this.renderer.createVictorySparkles();
            this.audio.playClear(); // クリアメロディ
        }
    }

    gameLoop() {
        if (!this.state.isGameOver && !this.state.isCleared) {
            this.renderer.updateAndDrawParticles();
        }
        this.updateStatsUI();
        requestAnimationFrame(() => this.gameLoop());
    }

    updateStatsUI() {
        // HP ゲージ
        const hpGauge = document.getElementById('hpGauge');
        if (hpGauge) {
            const hp = this.state.gemHp;
            hpGauge.style.width = `${hp}%`;
            if (hp > 50) hpGauge.style.background = 'var(--hp-color)';
            else if (hp > 25) hpGauge.style.background = 'var(--hp-warn)';
            else hpGauge.style.background = 'var(--hp-crit)';
        }

        const percent = Math.floor(this.state.cleanPercent);
        const ring = document.getElementById('progressRing');
        const text = document.getElementById('percentText');
        if (ring && text) {
            text.innerText = `${percent}%`;
            const offset = 113.1 * (1 - percent / 100);
            ring.style.strokeDashoffset = offset;
        }

        const coinText = document.getElementById('coinText');
        if (coinText) coinText.innerText = this.totalCoins.toLocaleString();

        const stageText = document.getElementById('stageNum');
        if (stageText) stageText.innerText = this.currentStage;

        // ショップUI更新
        const brushText = document.getElementById('brushLevelText');
        const brushCost = document.getElementById('brushUpgradeCost');
        if (brushText && brushCost) {
            const config = this.brushConfig[this.brushLevel - 1];
            brushText.innerText = `Lv.${this.brushLevel} (${config.radius}px)`;
            
            if (this.brushLevel < this.brushConfig.length) {
                const nextConfig = this.brushConfig[this.brushLevel];
                brushCost.innerText = nextConfig.cost;
                document.getElementById('btnUpgradeBrush').disabled = this.totalCoins < nextConfig.cost;
            } else {
                brushCost.innerText = 'MAX';
                document.getElementById('btnUpgradeBrush').disabled = true;
            }
        }
    }

    setupUI() {
        document.getElementById('btnHammer').onclick = () => { this.mode = 'hammer'; this.updateButtonUI(); };
        document.getElementById('btnBrush').onclick = () => { this.mode = 'brush'; this.updateButtonUI(); };
        document.getElementById('btnRestart').onclick = () => { location.reload(); };
        
        document.getElementById('btnShopOpen').onclick = () => this.toggleShop(true);
        document.getElementById('btnShopClose').onclick = () => this.toggleShop(false);
        document.getElementById('btnUpgradeBrush').onclick = () => this.upgradeBrush();
        
        this.updateButtonUI();
    }

    toggleShop(show) {
        document.getElementById('shopOverlay').classList.toggle('hidden', !show);
    }

    upgradeBrush() {
        if (this.brushLevel < this.brushConfig.length) {
            const nextConfig = this.brushConfig[this.brushLevel];
            if (this.totalCoins >= nextConfig.cost) {
                this.totalCoins -= nextConfig.cost;
                this.brushLevel++;
                localStorage.setItem('totalCoins', this.totalCoins);
                localStorage.setItem('brushLevel', this.brushLevel);
                this.updateStatsUI();
            }
        }
    }

    updateButtonUI() {
        document.getElementById('btnHammer').classList.toggle('active', this.mode === 'hammer');
        document.getElementById('btnBrush').classList.toggle('active', this.mode === 'brush');
    }
}

new Game();
