// renderer.js

import { Particle } from './particle.js';

export class Renderer {
    constructor(baseId, dirtId) {
        this.baseCanvas = document.getElementById(baseId);
        this.dirtCanvas = document.getElementById(dirtId);
        
        // 読み取り最適化のため willReadFrequently を追加
        this.baseCtx = this.baseCanvas.getContext('2d');
        this.dirtCtx = this.dirtCanvas.getContext('2d', { willReadFrequently: true });
        
        // 当たり判定専用のオフスクリーンCanvas
        this.collisionCanvas = document.createElement('canvas');
        this.collisionCanvas.width = 64;
        this.collisionCanvas.height = 64;
        this.collisionCtx = this.collisionCanvas.getContext('2d', { willReadFrequently: true });
        
        this.particles = [];
    }

    initLayers(gem) {
        // 1. 宝石の描画（ベースレイヤー）
        this.baseCtx.fillStyle = gem.type.color;
        this.baseCtx.fillRect(gem.x, gem.y, gem.w, gem.h);
        
        // 輝き（左上の方に小さく配置）
        this.baseCtx.fillStyle = '#ffffff';
        const shineSize = Math.max(2, Math.floor(gem.w / 4));
        this.baseCtx.fillRect(gem.x + 2, gem.y + 2, shineSize, shineSize);

        // レア度が3以上ならもう一つ輝きを追加
        if (gem.type.rarity >= 3) {
            this.baseCtx.fillRect(gem.x + gem.w - 4, gem.y + gem.h - 4, 3, 3);
        }
        
        this.currentGem = gem; // 保存しておく
        
        // 2. 当たり判定マップの作成
        this.collisionCtx.clearRect(0, 0, 64, 64);
        this.collisionCtx.fillStyle = '#ff0000';
        this.collisionCtx.fillRect(gem.x, gem.y, gem.w, gem.h);

        // 3. 泥の生成
        this.drawDirt();
    }

    drawDirt() {
        this.dirtCtx.globalCompositeOperation = 'source-over';
        this.dirtCtx.fillStyle = '#5d4037';
        this.dirtCtx.fillRect(0, 0, 64, 64);
        
        for (let i = 0; i < 200; i++) {
            this.dirtCtx.fillStyle = Math.random() > 0.5 ? '#4e342e' : '#6d4c41';
            this.dirtCtx.fillRect(
                Math.floor(Math.random() * 64), 
                Math.floor(Math.random() * 64), 
                2, 2
            );
        }
    }

    // 勝利時のキラキラ演出
    createVictorySparkles() {
        if (!this.currentGem) return;
        const { x, y, w, h } = this.currentGem;
        
        for (let i = 0; i < 50; i++) {
            const sx = x + Math.random() * w;
            const sy = y + Math.random() * h;
            const p = new Particle(sx, sy, '#fff');
            p.vx = (Math.random() - 0.5) * 1.5;
            p.vy = (Math.random() - 0.5) * 1.5 - 1.0;
            p.life = 1.0 + Math.random();
            this.particles.push(p);
        }
    }

    // 指定座標が宝石（当たり判定マップ）の上かチェック
    checkHitGem(x, y) {
        // 座標を整数に丸めて取得
        const pixel = this.collisionCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        return pixel[0] > 0; // 赤成分(R)があれば宝石とみなす
    }

    // 削り処理
    erase(x, y, radius, isLine = false, lastX = null, lastY = null) {
        const ctx = this.dirtCtx;
        ctx.save();
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (isLine && lastX !== null) {
            // ブラシ（線）の場合は、少しずつ透明にするためにアルファ値を下げる
            // PowerWash風の「徐々に消える」感
            ctx.globalAlpha = 0.3; 
            ctx.lineWidth = radius * 2;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            // ハンマー（円）の場合は一気に消す
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    // マイルストーン達成時のエフェクト
    triggerMilestoneFlash() {
        const el = document.getElementById('milestoneEffect');
        if (!el) return;
        el.classList.remove('milestone-flash');
        void el.offsetWidth; // 読み込み強制でアニメーションをリセット
        el.classList.add('milestone-flash');
    }

    // ハンマー打撃時のパーティクル生成
    createHammerParticles(x, y) {
        // 叩いた位置の泥の色を取得（透明ならスキップ）
        const pixel = this.dirtCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        if (pixel[3] === 0) return; 

        const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

        // 15個の破片を生成
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    // パーティクルの更新と描画
    updateAndDrawParticles() {
        if (this.particles.length === 0) return;

        const ctx = this.dirtCtx;
        
        // 【重要】透明化モードを解除して、色を描画できる状態にする
        const prevOperation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'source-over';

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.draw(ctx);

            if (p.isDead) {
                this.particles.splice(i, 1);
            }
        }

        // モードを元に戻す（eraseメソッドとの干渉を防ぐ）
        ctx.globalCompositeOperation = prevOperation;
    }

    // 粉塵エフェクト（CSSフィルタによる視覚変化）
    updateDustEffect(level) {
        const blur = Math.min(level / 20, 2); // 最大2pxのボケ
        const bright = 100 + Math.min(level / 2, 50); // 最大150%の明るさ
        this.dirtCanvas.style.filter = `blur(${blur}px) brightness(${bright}%) contrast(${100 - level/4}%)`;
    }
}
