import express from 'express';
import http from 'http';
import path from 'path';
import * as child_process from 'child_process';
import socketio from 'socket.io';
import wavEncoder from 'wav-encoder';
import fs from 'fs';

const app: express.Express = express();
const port: number = 8080;
app.use('/', express.static(path.join(__dirname, 'dist')));
const server: http.Server = http.createServer(app).listen(port, () => {
    console.log(`app listening on port ${port}`);
});

// WebSocketサーバの起動
const io: socketio.Server = new socketio.Server(server);

// クライアントが接続したときの処理
io.on('connection', (socket: socketio.Socket) => {
    let sampleRate: number = 44100; // デフォルトの値，実際のサンプリングレートはclient.tsのstartRecordingのAudioContextで決まる，たぶん48000
    let buffer: Array<number> = []; // 受け取ったPCMデータが格納される

    // 録音開始の合図を受け取ったときの処理
    socket.on('start', (data: { sampleRate: number }) => {
        const sampleRate: number = data.sampleRate;
        console.log(`Sample Rate ${sampleRate}`);
    });

    // PCMデータを受信したときの処理
    socket.on('send_pcm', (data) => {
        const itr: Array<number> = Object.values(data);
        const buf: Array<number> = new Array(Object.keys(data).length);
        for (let i: number = 0; i < buf.length; i++) {
            buf[i] = itr[i];
        }
        buffer = buffer.concat(buf);
        // console.log(buffer);
    });

    // 終了合図を受け取ったときの処理
    socket.on('stop', (data, ack) => {
        const f32array: Float32Array = toF32Array(buffer);
        const date: number = Date.now();
        const filename: string = `dist/wav/${String(date)}.wav`; // 保存先のパス

        exportWAV(f32array, sampleRate, filename);
        ack({ filename: filename });
        const smilePath: string = `${__dirname}/util/opensmile/build/progsrc/smilextract/SMILExtract`; // SMILExtractのパス
        const configPath: string = `${__dirname}/util/opensmile/config/demo/demo1_energy.conf`; // configファイルのパス
        const outputPath: string = `${__dirname}/dist/output/${String(date)}.csv`; // openSMILEの結果の保存先

        child_process.exec(`${smilePath} -C ${configPath} -I ${filename} -O ${outputPath}`, (error, stdout, stderr) => {
            if (error) {
                return console.log('ERROR: ', error);
            }
            console.log('STDOUT: ', stdout);
            console.log('STDERR: ', stderr);
        });
    });
});

// バッファをFloat32Arrayに変換する関数
const toF32Array = (buf: Array<number>): Float32Array => {
    const buffer: ArrayBuffer = new ArrayBuffer(buf.length);
    const view: Uint8Array = new Uint8Array(buffer);
    for (let i: number = 0; i < buf.length; i++) {
        view[i] = buf[i];
    }
    return new Float32Array(buffer);
};

// wav-encoderを使ってFloat32Arrayをwavファイルに変換してfilenameに保存
const exportWAV = (data: Float32Array, sampleRate: number, filename: string): void => {
    const audioData: { sampleRate: number, channelData: Float32Array[] } = {
        sampleRate: sampleRate,
        channelData: [data]
    };
    wavEncoder.encode(audioData).then((buffer) => {
        fs.writeFile(filename, Buffer.from(buffer), (e) => {
            if (e) {
                console.log(e);
            } else {
                console.log(`Successfully saved ${filename}`);
            }
        });
    });
};
