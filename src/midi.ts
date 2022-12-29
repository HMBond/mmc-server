import { Output } from 'midi';
import { createRequire } from 'module';
import { MidiMessage } from './types';
const require = createRequire(import.meta.url);

export function connectMidi() {
  const midi = require('midi');
  const output: Output = new midi.Output();
  output.openPort(0);
  console.log(`[MMC-server] MIDI port out: ${output.getPortName(0)}`);
  return output;
}

export function note(output: Output, message: MidiMessage) {
  const { channel, note, velocity, action } = message;
  const pitch = getPitch(note);
  if (action === 'play') {
    output.sendMessage([0x90, pitch, 0x40]);
  } else {
    output.sendMessage([0x80, pitch, 0x00]);
  }
}

export function pitchBend(output: Output, message: MidiMessage) {
  const { channel, value } = message;
  const pitchBend = parseInt(`E${(channel - 1).toString(16)}`, 16);
  const midiValue = Math.floor((value * 127 + 127) / 2);
  output.sendMessage([pitchBend, 0, midiValue]);
}

/**
 * Convert a note (e.g. "C4") to a MIDI pitch number (0 - 127).
 */
export const getPitch: (note: string) => number = (function () {
  const regexp = /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i;
  // prettier-ignore
  const noteToScaleIndex = {
		cbb: -2, cb: -1, c: 0, "c#": 1, cx: 2,
		dbb: 0, db: 1, d: 2, "d#": 3, dx: 4,
		ebb: 2, eb: 3, e: 4, "e#": 5, ex: 6,
		fbb: 3, fb: 4, f: 5, "f#": 6, fx: 7,
		gbb: 5, gb: 6, g: 7, "g#": 8, gx: 9,
		abb: 7, ab: 8, a: 9, "a#": 10, ax: 11,
		bbb: 9, bb: 10, b: 11, "b#": 12, bx: 13,
	};

  return (note) => {
    const split = regexp.exec(note);
    const pitch = split[1];
    const octave = split[2];
    const index = noteToScaleIndex[pitch.toLowerCase()];
    return index + (parseInt(octave, 10) + 1) * 12;
  };
})();
