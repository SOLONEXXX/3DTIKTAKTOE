import Peer, { type DataConnection } from 'peerjs';
import type { BoardSize, Player, TimeControl } from './types';

const ROOM_PREFIX = 'ttt3d-';
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export function generateRoomCode(length = 5): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export type NetMessage =
  | { type: 'init'; hostPlayer: Player; size: BoardSize; timeControl: TimeControl }
  | { type: 'move'; index: number; player: Player }
  | { type: 'resign'; player: Player }
  | { type: 'rematch-offer' }
  | { type: 'rematch-accept' }
  | { type: 'ping' };

export type ConnectionStatus =
  | 'idle'
  | 'waiting-for-peer'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

interface MultiplayerCallbacks {
  onStatusChange?: (status: ConnectionStatus, detail?: string) => void;
  onMessage?: (message: NetMessage) => void;
}

export class MultiplayerSession {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private callbacks: MultiplayerCallbacks;
  public isHost = false;
  public roomCode: string | null = null;

  constructor(callbacks: MultiplayerCallbacks = {}) {
    this.callbacks = callbacks;
  }

  private setStatus(status: ConnectionStatus, detail?: string) {
    this.callbacks.onStatusChange?.(status, detail);
  }

  private wireConnection(conn: DataConnection) {
    this.connection = conn;
    conn.on('open', () => this.setStatus('connected'));
    conn.on('data', (data) => {
      this.callbacks.onMessage?.(data as NetMessage);
    });
    conn.on('close', () => this.setStatus('disconnected'));
    conn.on('error', (err) => this.setStatus('error', err.message));
  }

  hostGame(): Promise<string> {
    this.isHost = true;
    const code = generateRoomCode();
    this.roomCode = code;
    this.setStatus('waiting-for-peer');

    return new Promise((resolve, reject) => {
      const peer = new Peer(ROOM_PREFIX + code);
      this.peer = peer;

      peer.on('open', () => resolve(code));
      peer.on('error', (err) => {
        this.setStatus('error', err.message);
        reject(err);
      });
      peer.on('connection', (conn) => {
        this.wireConnection(conn);
      });
    });
  }

  joinGame(code: string): Promise<void> {
    this.isHost = false;
    this.roomCode = code.toUpperCase();
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      const peer = new Peer();
      this.peer = peer;

      peer.on('open', () => {
        const conn = peer.connect(ROOM_PREFIX + this.roomCode, { reliable: true });
        this.wireConnection(conn);
        conn.on('open', () => resolve());
        conn.on('error', (err) => reject(err));
      });
      peer.on('error', (err) => {
        this.setStatus('error', err.message);
        reject(err);
      });
    });
  }

  send(message: NetMessage) {
    this.connection?.send(message);
  }

  destroy() {
    this.connection?.close();
    this.peer?.destroy();
    this.connection = null;
    this.peer = null;
  }
}
