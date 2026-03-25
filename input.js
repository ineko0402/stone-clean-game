export class InputHandler {
    constructor(element) {
        this.element = element;
        this.isDown = false;
        this.lastPos = null;
        this.onStroke = () => {}; // 外部から処理を注入
    }

    init() {
        this.element.addEventListener('pointerdown', (e) => {
            this.isDown = true;
            const pos = this.getPos(e);
            this.onStroke(pos, true, null);
            this.lastPos = pos;
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDown) return;
            const pos = this.getPos(e);
            this.onStroke(pos, false, this.lastPos);
            this.lastPos = pos;
        });

        window.addEventListener('pointerup', () => {
            this.isDown = false;
            this.lastPos = null;
        });
    }

    getPos(e) {
        const rect = this.element.getBoundingClientRect();
        const scaleX = this.element.width / rect.width;
        const scaleY = this.element.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
}
