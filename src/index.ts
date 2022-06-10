import express from 'express';
import http from 'http';

const app: express.Express = express();
app.get("/", (req: express.Request, res: express.Response) => {
    res.send('Hello World');
})
const port: number = 8080;
const server = http.createServer(app);
server.listen(port, () => {
    console.log('Start server on port 8080');
})
