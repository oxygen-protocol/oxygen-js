import { PublicKey } from "@solana/web3.js";
import BN from 'bn.js';
import {
  AccountHeader,
  assetToken,
  AssetToken,
  LiqudationDiscounts,
  ParsedAccountInfo
} from './state';
import { struct, u16, u32, u8, Layout } from 'buffer-layout';
import { accountHeaderType, publicKey, u64, zeros, reserve } from '../types';

export const AssetStateReserved = 1024;

export type AssetState = {
  account_header: AccountHeader;
  protocol: PublicKey;
  authority: PublicKey;
  enabled: Boolean;
  authority_nonce: number;
  id: number;
  native_decimals: number;
  asset_decimals: number;
  min_asset_size: number;
  oxy_lot_size: BN;
  future_days: number;
  ltv_params: {
    initial_ltv: BN,
    reset_ltv: BN,
    maintenance_ltv: BN,
    critical_ltv: BN,
  },
  initial_ltv: BN;
  maintenance_ltv: BN;
  price: BN;

  native: AssetToken;
  oxy: AssetToken;
  debt: AssetToken;
  future: AssetToken;

  lending_program: PublicKey;
  lend_pending_settles: PublicKey;
  lending_market: PublicKey;
  lending_fee_vault: PublicKey;
  trade_rebate_vault: PublicKey;
  price_provider_option: BN;
  price_provider: {
    dex_market: PublicKey;
    last_update: BN;
  }

};

export const ltvParamsLayout = struct([
  u64('initial_ltv'),
  u64('reset_ltv'),
  u64('maintenance_ltv'),
  u64('critical_ltv'),
], 'ltv_params');

export type LtvParams = {
  initial_ltv: BN;
  reset_ltv: BN;
  maintenance_ltv: BN;
  critical_ltv: BN;
}


const deferredRiskParams = struct([
  u64('update_at_slot'),
  u8('min_asset_size'),
  zeros(7),
  u64('oxy_lot_size'),
  ltvParamsLayout,
]);

const priceProvider = struct([
  publicKey('dex_market'),
  u64('last_update')
], 'price_provider');

export const AssetStateLayout = struct([
  accountHeaderType('account_header'),
  reserve(AssetStateReserved),
  publicKey('protocol'),
  publicKey('authority'),
  u16('id'),
  u8('enabled'),
  u8('authority_nonce'),
  u8('native_decimals'),
  u8('asset_decimals'),
  u8('min_asset_size'),
  zeros(1),
  u64('asset_lot_size'),
  u32('future_days'),
  zeros(4),
  ltvParamsLayout,
  u64('price'),
  u64('price_ttl'),

  assetToken('native'),
  assetToken('oxy'),
  assetToken('debt'),
  assetToken('future'),

  publicKey('lending_program'),
  publicKey('lending_market'),

  publicKey('lending_fee_vault'),
  publicKey('trade_rebate_vault'),

  publicKey('lend_pending_settles'),

  LiqudationDiscounts,

  u64('deferred_risk_params_option'),
  deferredRiskParams,

  u64('price_provider_option'),
  priceProvider,
]);

export class ParsedAssetState extends ParsedAccountInfo<AssetState> {
  decoder(): Layout {
    return AssetStateLayout;
  }

  hasPriceProviderMarket() : boolean {
    return this.state.price_provider_option.gtn(0);
  }
}
