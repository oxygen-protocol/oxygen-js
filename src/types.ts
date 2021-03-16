//@ts-nocheck
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import {PublicKey} from '@solana/web3.js';
import { greedy, Layout, seq, u8 } from 'buffer-layout';


export function i8(property?: string) : BufferLayout.Int {
  return new BufferLayout.Int(1, property);
}

export const reserve = (len) => {
  return seq(u8(), len, 'reserved');
};

class Zeros extends BufferLayout.Blob {
    decode(b, offset) {
        const slice = super.decode(b, offset);
        if (!slice.every((v) => v === 0)) {
            throw new Error('nonzero padding bytes');
        }
        return slice;
    }
}

export function zeros(length) {
    return new Zeros(length);
}

class PublicKeyLayout extends BufferLayout.Blob {
    constructor(property) {
      super(32, property);
    }

    decode(b, offset) {
      return new PublicKey(super.decode(b, offset));
    }

    encode(src, b, offset) {
      return super.encode(src.toBuffer(), b, offset);
    }
}

/**
 * Layout for a public key
 */
export const publicKey = (property = 'publicKey') => {
    return new PublicKeyLayout(property);
};

/**
 * Layout for a 64bit unsigned value
 */
export const uint64 = (property = 'uint64') => {
    return BufferLayout.blob(8, property);
};

export type OptionalU64 = BN | undefined;

export function optional_u64(property, isAligned = true) {
    return new COptionU64(property, isAligned);
}

class TradeAssetSide extends BufferLayout.Blob {
  constructor(property) {
    super(4, property);
  }

  decode(b, offset) {
    const val = super.decode(b, offset);
    return val.readUInt32BE() === 0 ? 'base' : 'quote';
  }
}
export function tradeAssetSide(property) {
  return new TradeAssetSide(property);
}

export function accountHeaderType(property) {
    return BufferLayout.struct([
        BufferLayout.u32('stateType'),
        zeros(4),
        publicKey('pubkey'),
        u64('version')
    ], property)
}

class BNLayout extends BufferLayout.Blob {

    originalDecode(b, offset) {
        return super.decode(b, offset);
    }

    originalEncode(src, b, offset) {
        return super.encode(src, b, offset);
    }

    decode(b, offset) {
        return new BN(this.originalDecode(b,offset), 10, 'le');
    }
    encode(src, b, offset) {
        src = src instanceof BN ? src : new BN(src);
        return this.originalEncode(src.toArrayLike(Buffer, 'le', this.span), b, offset);
    }
}

export const zeroPubKey = new PublicKey(0);

export function u64(property = 'u64') {
    return new BNLayout(8, property);
}
export function u128(property = 'u128') {
  return new BNLayout(16, property);
}

export class COptionU64 extends BufferLayout.Structure {
    constructor(property, isAligned, decodePrefixes) {
        const fields = [
            BufferLayout.u8('option'),
        ];
        if (isAligned)
            fields.push(zeros(7));
        fields.push(u64('value'));
        super(fields, property, decodePrefixes);
    }

    encode(src, b, offset) {
        const source = {
            'option': 0,
            'value': new BN(0)
        }

        if (src) {
            source['option'] = 1;
            source['value'] = new BN(src);
        }

        return super.encode(source, b, offset);
    }

    decode(b, offset) {
        const decoded = super.decode(b, offset);
        if (decoded['option'] === 1) {
            return decoded['value'];
        } else {
            return undefined;
        }
    }
}

export function autovec<T>(ty: Layout<T>, property?: string): Layout {
  return seq(ty, greedy(ty.span), property);
}
