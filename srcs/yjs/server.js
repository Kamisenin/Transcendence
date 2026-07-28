import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import http from 'node:http';

const port = process.env.PORT || 1234;
const host = process.env.HOST || '0.0.0.0';

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Yjs WebSocket Server is running!');
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(port, host, () => {
    console.log(`Serveur Yjs à l'écoute sur http://${host}:${port}`);
});