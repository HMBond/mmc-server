import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { connectMidi, note, pitchBend } from './midi';
import { ErrorResponse, Message } from './types';

dotenv.config();

const wss = new WebSocketServer({
  port: parseInt(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
});
const midiOut = connectMidi();
const room: Map<string, WebSocket> = new Map();

wss.on('connection', (ws: WebSocket) => {
  const id = randomUUID();
  room.set(id, ws);

  ws.on('message', (data) => handleMessage(data, ws, id));

  if (process.env.ENVIRONMENT !== 'production') {
    console.log(`[MMC-server] New Connection, total: ${room.size}, id: ${id.slice(0, 5)}...`);
  }

  ws.send('Connected');

  ws.on('close', () => {
    room.delete(id);
  });
});

function handleMessage(data: RawData, ws: WebSocket, id: string) {
  try {
    const message: Message = JSON.parse(data.toString());
    if (message.type === 'note') {
      note(midiOut, message);
    }
    if (message.type === 'pitchbend') {
      pitchBend(midiOut, message);
    }
    if (message.type === 'share') {
      for (const [key, socket] of room) {
        if (key === id) continue;
        socket.send(JSON.stringify(message));
      }
    }
  } catch (error) {
    const message = '[MMC-server] could not parse message: ' + data.toString();
    if (process.env.ENVIRONMENT !== 'production') {
      console.log(message, error.stack);
    }
    sendError(ws, message);
    return;
  }
  if (process.env.ENVIRONMENT !== 'production') {
    console.log(`[MMC-server] received from ${id.slice(0, 5)}...: %s`, data);
  }
}

function sendError(ws: WebSocket, message: string, status = 500) {
  const error: ErrorResponse = {
    type: 'error',
    status,
    message,
  };
  ws.send(JSON.stringify(error));
}
