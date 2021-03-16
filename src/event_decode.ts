import BN from 'bn.js';
import { decodeEvent, EventMsg } from './events';

const decodeLayout = (decoded: EventMsg) => {
  if (decoded) {
    for (const [field, event] of Object.entries(decoded)) {
      for (const [key, value] of Object.entries(event)) {
        if (value instanceof BN) {
          decoded[field][key] = value.toString();
        }

        if (typeof value === 'object' && value.hasOwnProperty('_bn')) {
          decoded[field][key] = value.toString();
        }
      }
    }
    return decoded as EventMsg;
  }
  return null;
};

export class EventDecode {
  static decode(bytes: Buffer) {
    const decoded = decodeEvent(bytes) as EventMsg;
    const event = decodeLayout(decoded);
    if (event) {
      return Object.keys(event).map((type) => {
        return {
          type,
          data: event[type],
        };
      });
    }
    return null;
  }
}
