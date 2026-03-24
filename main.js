import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.renderer = new Renderer('baseCanvas', 'dirtCanvas');
        this.input = new InputHandler(this.renderer.dirtCanvas);
        this.mode = 'hammer'; // or 'brush'
        this.init();
    }

    init() {
        this.renderer.initLayers();
        this.input.init();

        // 入力時のアクションを定義
        this.input.onStroke = (pos, isFirst, lastPos) => {
            if (this.mode === 'hammer') {
                if (isFirst) {
                    this.renderer.erase(pos.x, pos.y, 6); // ハンマーは点
                }
            } else {
                this.renderer.erase(pos.x, pos.y, 2.5, true, lastPos?.x, lastPos?.y); // ブラシは線
            }
        };

        this.setupUI();
    }

    setupUI() {
        const btnHammer = document.getElementById('btnHammer');
        const btnBrush = document.getElementById('btnBrush');
        const status = document.getElementById('status');

        const updateUI = () => {
            btnHammer.classList.toggle('active', this.mode === 'hammer');
            btnBrush.classList.toggle('active', this.mode === 'brush');
            status.innerText = `モード: ${this.mode === 'hammer' ? 'ハンマー' : 'ブラシ'}`;
        };

        btnHammer.onclick = () => { this.mode = 'hammer'; updateUI(); };
        btnBrush.onclick = () => { this.mode = 'brush'; updateUI(); };
    }
}

new Game();
