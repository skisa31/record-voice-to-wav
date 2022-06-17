"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var exports = { "__esModule": true };
Object.defineProperty(exports, "__esModule", { value: true });
// const socket_io_client_1 = __importDefault(require("socket.io-client")); commonjsの機能だけどエラーが出たのでコメントアウト
const port = 8080;
// const socket = (0, socket_io_client_1.default)(`http://localhost:${port}`); 7行目に伴いコメントアウト
const socket = io.connect(); // 9行目の代わりに接続
let processor;
let localstream;
function startRecording() {
    console.log('Start recording');
    let context = new window.AudioContext();
    const sampleRate = context.sampleRate;
    socket.emit('start', {
        'sampleRate': sampleRate
    });
    const media = {
        audio: true,
        video: false
    };
    navigator.mediaDevices.getUserMedia(media).then((stream) => {
        localstream = stream;
        const source = context.createMediaStreamSource(localstream);
        processor = context.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(context.destination);
        processor.onaudioprocess = (e) => {
            const voice = e.inputBuffer.getChannelData(0);
            socket.emit('send_pcm', voice.buffer);
        };
        /*
        context.audioWorklet.addModule('processors.js').then(() => {
            const worklet: AudioWorkletNode = new AudioWorkletNode(context, 'my-worklet-processor');
            worklet.connect(context.destination);
        });
        */
    }).catch((e) => {
        console.log(e);
    });
}
function stopRecording() {
    console.log('stop recording');
    processor.disconnect();
    processor.onaudioprocess = null;
    // processor = null;
    localstream.getTracks().forEach((track) => {
        track.stop();
    });
    socket.emit('stop', '', (res) => {
        console.log(`Audio data is saved as ${res.filename}`);
    });
}
