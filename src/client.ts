import io from 'socket.io-client'

const port: number = 8080;
const socket = io(`http://localhost:${port}`);
// const socket = io.connect();
let processor: ScriptProcessorNode;
let localstream: MediaStream;

function startRecording() {
    console.log('Start recording');
    let context = new window.AudioContext();
    const sampleRate: number = context.sampleRate; // AudioContextのサンプリングレート多分デフォルトは48000

    socket.emit('start', {
        'sampleRate': sampleRate
    });

    const media: { audio: boolean, video: boolean } = {
        audio: true,
        video: false
    };
    navigator.mediaDevices.getUserMedia(media).then((stream) => { // ブラウザへのアクセス要求
        localstream = stream;
        const source: MediaStreamAudioSourceNode = context.createMediaStreamSource(localstream);
        processor = context.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(context.destination);
        processor.onaudioprocess = (e) => {
            const voice: Float32Array = e.inputBuffer.getChannelData(0); // マイクから取得した音声をPCMデータに変換
            socket.emit('send_pcm', voice.buffer); // PCMデータをサーバへ送信
        };
        /*
        ScriptProcessorはAudioWorkletに置き換え推奨だけどまだ途中
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
    localstream.getTracks().forEach((track) => {
        track.stop();
    });
    socket.emit('stop', '', (res: { filename: string }) => {
        console.log(`Audio data is saved as ${res.filename}`);
    });
}
