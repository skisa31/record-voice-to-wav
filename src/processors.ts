class MyWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    };

    process(inputs: Float32Array[], outputs: Float32Array[], parameters: {}) {
        const input: Float32Array = inputs[0];
        const output: Float32Array = outputs[0];

        const numberOfChannels: number = output.length;

        for (let channel: number = 0; channel < numberOfChannels; channel++) {
            if (input[channel]) {
                output[channel].set(input[channel]);
            }
        }
        const voice: Float32Array = output;
        const voiceBuffer: ArrayBuffer = voice.buffer;

        return true;
    };
};

registerProcessor('my-worklet-processor', MyWorkletProcessor);
