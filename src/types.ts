export type Message = MidiMessage | ShareMessage;

export interface MidiMessage {
  type: 'note' | 'pitchbend';
  channel: number;
  note?: string;
  velocity?: number;
  action?: 'stop' | 'play';
  value?: number;
}

export interface ShareMessage {
  type: 'share';
  payload: any;
}

export interface ErrorResponse {
  type: 'error';
  status: number;
  message: string;
}
