// particle.js

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    // 初期速度はランダムにして飛び散る方向をバラバラにする
    this.vx = (Math.random() - 0.5) * 4; 
    this.vy = (Math.random() - 2) * 4; // 上方向に飛び出しやすく
    this.color = color;
    // 寿命（フレーム数）。ランダムにして消えるタイミングをずらす
    this.life = 30 + Math.random() * 20; 
    this.initialLife = this.life;
    this.gravity = 0.2; // 重力
    this.friction = 0.98; // 空気抵抗
  }

  update() {
    // 物理演算の適用
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // 寿命を減らす
    this.life--;
  }

  draw(ctx) {
    // 寿命に応じて透明度を変化させる（Fading）
    const alpha = this.life / this.initialLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    // ドット絵らしく、小さな四角形を描画。
    // 座標は整数値に丸めると、よりクッキリとしたドット感が出る。
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 2, 2); 
    ctx.globalAlpha = 1; // 透明度を元に戻す
  }

  get isDead() {
    return this.life <= 0;
  }
}
