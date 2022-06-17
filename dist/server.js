"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const child_process = __importStar(require("child_process"));
const socket_io_1 = __importDefault(require("socket.io"));
const wav_encoder_1 = __importDefault(require("wav-encoder"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
app.use('/', express_1.default.static(path_1.default.join(__dirname, 'dist')));
const server = http_1.default.createServer(app);
const port = 8080;
server.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
// WebSocketサーバの起動
const io = new socket_io_1.default.Server(server);
// クライアントが接続したときの処理
io.on('connection', (socket) => {
    let sampleRate = 44100;
    let buffer = [];
    // 録音開始の合図を受け取ったときの処理
    socket.on('start', (data) => {
        const sampleRate = data.sampleRate;
        console.log(`Sample Rate ${sampleRate}`);
    });
    // PCMデータを受信したときの処理
    socket.on('send_pcm', (data) => {
        const itr = Object.values(data);
        const buf = new Array(Object.keys(data).length);
        for (let i = 0; i < buf.length; i++) {
            buf[i] = itr[i];
        }
        buffer = buffer.concat(buf);
        console.log(buffer);
    });
    socket.on('stop', (data, ack) => {
        const f32array = toF32Array(buffer);
        const date = Date.now();
        const filename = `dist/wav/${String(date)}.wav`;
        exportWAV(f32array, sampleRate, filename);
        ack({ filename: filename });
        const smilePath = '/Users/ssakai/prog/node-web-audio-api-test/util/opensmile/build/progsrc/smilextract/SMILExtract';
        const configPath = '/Users/ssakai/prog/node-web-audio-api-test/util/opensmile/config/demo/demo1_energy.conf';
        const outputPath = `/Users/ssakai/prog/node-web-audio-api-test/public/output/${String(date)}.csv`;
        child_process.exec(`${smilePath} -C ${configPath} -I ${filename} -O ${outputPath}`, (error, stdout, stderr) => {
            if (error) {
                return console.log('ERROR: ', error);
            }
            console.log('STDOUT: ', stdout);
            console.log('STDERR: ', stderr);
        });
    });
});
const toF32Array = (buf) => {
    const buffer = new ArrayBuffer(buf.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < buf.length; i++) {
        view[i] = buf[i];
    }
    return new Float32Array(buffer);
};
const exportWAV = (data, sampleRate, filename) => {
    const audioData = {
        sampleRate: sampleRate,
        channelData: [data]
    };
    wav_encoder_1.default.encode(audioData).then((buffer) => {
        fs_1.default.writeFile(filename, Buffer.from(buffer), (e) => {
            if (e) {
                console.log(e);
            }
            else {
                console.log(`Successfully saved ${filename}`);
            }
        });
    });
};
