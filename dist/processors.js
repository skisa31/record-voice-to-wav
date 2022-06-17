"use strict";
class MyWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }
    ;
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const numberOfChannels = output.length;
        for (let channel = 0; channel < numberOfChannels; channel++) {
            if (input[channel]) {
                output[channel].set(input[channel]);
            }
        }
        const voice = output;
        const voiceBuffer = voice.buffer;
        return true;
    }
    ;
}
;
registerProcessor('my-worklet-processor', MyWorkletProcessor);
