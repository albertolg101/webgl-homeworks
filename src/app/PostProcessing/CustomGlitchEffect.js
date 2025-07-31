import { GlitchEffect } from "postprocessing";

export class CustomGlitchEffect extends GlitchEffect {
    _onEnter;
    _onLeave;
    _wasCbCalled = false;

    constructor({ onEnter, onLeave, ...props } = {}) {
        super(props);
        this._onEnter = onEnter;
        this._onLeave = onLeave;
    }

    update(renderer, inputBuffer, deltaTime) {
        super.update(renderer, inputBuffer, deltaTime);
        if (this.active) {
            if (!this._wasCbCalled && this._onEnter) {
                this._onEnter();
            }
            this._wasCbCalled = true;
        } else {
            if (this._wasCbCalled && this._onLeave) {
                this._onLeave();
            }
            this._wasCbCalled = false;
        }
    }
}