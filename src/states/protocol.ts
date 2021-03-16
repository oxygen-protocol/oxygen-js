import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  AccountHeader,
  assetToken,
  FeeTableType,
  FeeTier,
  MAX_TIERS_COUNT,
  PROTOCOL_ASSET_COUNT,
  ParsedAccountInfo,
} from './../state';
import { seq, struct, u16, u8, Layout } from 'buffer-layout';
import { accountHeaderType, publicKey, u64, zeros, reserve } from './../types';
import { zeroPubKey } from './../types';

export type ProtocolState = {
  account_header: AccountHeader;
  owner: PublicKey;
  trade_program: PublicKey;
  base_currency_mint: PublicKey;
  lending_program: PublicKey;
  authority: PublicKey;
  nonce: number;
  assets_count: number;
  assets: PublicKey[];
  slot_in_day: BN;
  fee_mint: PublicKey;
  fee_vault: PublicKey;
  fee_table: FeeTableType;
  viability_ttl: BN;
};

export const ProtocolStateReserved = 1024;
export const ProtocolStateLayout = struct([
  accountHeaderType('account_header'),
  reserve(ProtocolStateReserved),
  publicKey('owner'),
  publicKey('authority'),
  publicKey('trade_program'),
  publicKey('lending_program'),
  u16('assets_count'),
  u8('nonce'),
  u8('base_currency_decimals'),
  seq(publicKey(), PROTOCOL_ASSET_COUNT, 'assets'),
  zeros(4),
  u64('slot_in_day'),
  u64('protocol_token_option'),
  assetToken('protocol_token'),
  struct(
    [u8('count'), zeros(7), seq(FeeTier, MAX_TIERS_COUNT, 'tiers')],
    'fee_table',
  ),
  u64('viability_ttl'),
  u64('risk_param_defer_min_slots'),
  publicKey('base_currency_mint'),
]);

export class ParsedProtocolState extends ParsedAccountInfo<ProtocolState> {
  public getProtocolAssets(): PublicKey[] {
    return this.state.assets.filter(publicKey => !publicKey.equals(zeroPubKey));
  }

  decoder(): Layout {
    return ProtocolStateLayout;
  }
}
