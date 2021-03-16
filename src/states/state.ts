import BN from 'bn.js';
import { seq, struct, u8, Layout, u32, u16 } from 'buffer-layout';
import {
  accountHeaderType,
  optional_u64,
  OptionalU64,
  publicKey,
  u64,
  zeros,
  u128,
  reserve
} from './types';
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';



import { Market } from '@project-serum/serum';

const PendingSettlesStateReserved = 1024;

const WalletStateReserved = 512;
const PoolStateReserved = 512;
const AgreementBookReserved = 128;

type Class<T> = new (...args: any[]) => T;

export async function decodeAccountInfo<T, R extends ParsedAccountInfo<T>>(
  connection: Connection,
  address: PublicKey,
  account: Class<R>,
): Promise<R | null> {
  const accInfo = await connection.getAccountInfo(address);
  if (accInfo?.data) {
    return new account(address, accInfo);
  }
  return null;
}

export function getMarketEventQueueAddress(market: Market): PublicKey {
  /* eslint dot-notation: ["error", { "allowPattern": "^(_[a-z]+)+$" }] */
  return market['_decoded'].eventQueue;
}

type AccountInfoContainer = {
  address: PublicKey;
  container: AccountInfo<Buffer>;
};

export abstract class ParsedAccountInfo<T> {
  public accountInfo: AccountInfoContainer;
  private _state: T;

  constructor(address: PublicKey, accountInfo: AccountInfo<Buffer>) {
    this.accountInfo = { container: accountInfo, address };
    this._state = this.decode(accountInfo.data);
  }

  decode(bytes: Buffer): T {
    return this.decoder().decode(bytes);
  }

  get owner(): PublicKey {
    return this.accountInfo.container.owner;
  }

  get address(): PublicKey {
    return this.accountInfo.address;
  }

  abstract decoder(): Layout;

  get state(): T {
    return this._state;
  }
}

export const enum TRADE_SIDE {
  BUY = 0,
  SELL = 1,
}

export const isAskTradeSide = (side: TRADE_SIDE) => side === TRADE_SIDE.SELL;

export const MAX_ASSETS_COUNT = 128;
export const PROTOCOL_ASSET_COUNT = 512;
export const MAX_TIERS_COUNT = 10;
export const FEE_TIERS_LEN = 241;

export const ProtocolStateLayoutSize = 17968;
export const AssetStateLayoutSize = 1904;
export const PoolStateLayoutSize = 11432;
export const WalletStateLayoutSize = 2336;
export const AgreementBookLayoutSize = 2104;
export const ViabilityStateLayoutSize = 13544;

export const LiquidationTier = struct([u64('amount'), u64('discount')]);

export const LiqudationDiscounts = struct(
  [u8('count'), zeros(7), seq(LiquidationTier, MAX_TIERS_COUNT, 'tiers')],
  'liquidation_discounts',
);

export const FeeTier = struct([
  u64('amount'),
  u64('lend_fee'),
  u64('borrow_fee'),
]);

export type FeeTierType = {
  amount: BN;
  lend_fee: BN;
  borrow_fee: BN;
};

export type FeeTableType = {
  tiers: FeeTierType[];
};

export const assetToken = (property) =>
  struct([publicKey('mint'), publicKey('vault')], property);

export enum AccountingStep {
  Uninitialized = 0,
  CollectingSnapshot,
  CalculatingTotals,
  Complete,
}
export enum LiquidationStateStep {
  Uninitialized = 0,
  SanitizePool,
  CollectOverdueDebts,
  CalculateRequiredAmount,
  Netting,
  ProvideAndSendCollateral,
}

export type PoolLiquidation = {
  state_flag: BN;
  step: LiquidationStateStep;

  required_amounts: Array<{
    usd_value: BN;
    oxy_amount: BN;
  }>;
  initial_slot: BN;
  initiator: PublicKey;
  sanitize_slot: BN;
  repaid_part: BN;
  retain_part: BN;
  released_value: BN;
  released_future_value: BN;

  required_assets: BN;
  overdue_debt: BN;
  required_to_call: BN;
  repaid_by_pool: BN;
};

export type PoolViability = {
  is_clean: boolean;
  slot: BN;
  equity: BN;
  total_value: BN;
  total_liabilities: BN;
  total_weighted_cltv: BN;
  total_weighted_iltv: BN;
  total_weighted_rltv: BN;
  total_weighted_discount: BN;
  ltv: BN;

  prices: Array<BN>;
  amounts: Array<BN>;
  future_amounts: Array<BN>;
  liabilities: Array<BN>;
};

export type ViabilityState = {
  asset_count: BN;
  /// Flag used to keep track of the progress of the accounting operation.
  state_flag: BN;
  /// Current step of the accounting operation. Must be [`AccountingStep::Complete`] for the viability
  step: AccountingStep;
  /// Slot when the last accounting operation happened.
  slot: BN;

  /// Owner of accounting
  owner: PublicKey;
  /// Target pool
  pool: PublicKey;

  /// Equity of pool
  equity: BN;
  /// Total USD value of the wallet, including future value
  total_value: BN;
  /// Total future USD value of the wallet
  total_future_value: BN;
  /// Total liabilities of the wallet
  total_liabilities: BN;

  prices: Array<BN>;

  amounts: Array<BN>;
  future_amounts: Array<BN>;
  liabilities: Array<BN>;
  discounts: Array<BN>;
  cltv: Array<BN>;
  iltv: Array<BN>;
  rltv: Array<BN>;

  weights: Array<BN>;
  weighted_cltv: Array<BN>;
  weighted_iltv: Array<BN>;
  weighted_rltv: Array<BN>;
  weighted_discounts: Array<BN>;

  total_weighted_cltv: BN;
  total_weighted_iltv: BN;
  total_weighted_rltv: BN;
  ltv: BN;
  total_weighted_discount: BN;
};

export const PoolLiquidationState = struct(
  [
    u128('state_flag'),
    u32('step'),
    zeros(4),
    seq(
      struct([u64('usd_value'), u64('oxy_amount')]),
      MAX_ASSETS_COUNT,
      'required_amounts',
    ),
    u64('initial_slot'),
    publicKey('initiator'),
    u64('sanitize_slot'),
    u64('repaid_part'),
    u64('retain_part'),
    u64('released_value'),
    u64('released_future_value'),
    u128('required_assets'),
    u64('overdue_debt'),
    u64('required_to_call'),
    u64('repaid_by_pool'),
  ],
  'liquidation',
);

export const ViabilityStateLayout = struct([
  accountHeaderType('account_header'),
  u64('asset_count'),
  u128('state_flag'),
  u8('step'),
  zeros(7),
  u64('slot'),

  publicKey('owner'),
  publicKey('pool'),

  u64('equity'),
  u64('total_value'),
  u64('total_future_value'),
  u64('total_liabilities'),
  u64('total_iou_futures'),

  seq(u64(), MAX_ASSETS_COUNT, 'prices'),

  seq(u64(), MAX_ASSETS_COUNT, 'amounts'),
  seq(u64(), MAX_ASSETS_COUNT, 'future_amounts'),
  seq(u64(), MAX_ASSETS_COUNT, 'liabilities'),
  seq(u64(), MAX_ASSETS_COUNT, 'discounts'),
  seq(u64(), MAX_ASSETS_COUNT, 'mltv'),
  seq(u64(), MAX_ASSETS_COUNT, 'iltv'),
  seq(u64(), MAX_ASSETS_COUNT, 'rltv'),

  seq(u64(), MAX_ASSETS_COUNT, 'weights'),
  seq(u64(), MAX_ASSETS_COUNT, 'weighted_mltv'),
  seq(u64(), MAX_ASSETS_COUNT, 'weighted_iltv'),
  seq(u64(), MAX_ASSETS_COUNT, 'weighted_rltv'),
  seq(u64(), MAX_ASSETS_COUNT, 'weighted_discounts'),

  u64('total_weighted_mltv'),
  u64('total_weighted_iltv'),
  u64('total_weighted_rltv'),
  u64('total_weighted_ltv'),
  u64('total_weighted_discount'),
]);

export const PoolViabilityState = struct(
  [
    u8('is_clean'),
    zeros(7),
    u64('slot'),
    u64('equity'),
    u64('total_value'),
    u64('total_future_value'),
    u64('total_liabilities'),
    u64('total_iou_futures'),
    u64('total_weighted_mltv'),
    u64('total_weighted_iltv'),
    u64('total_weighted_rltv'),
    u64('total_weighted_discount'),
    u64('total_weighted_ltv'),

    seq(u64(), MAX_ASSETS_COUNT, 'prices'),
    seq(u64(), MAX_ASSETS_COUNT, 'amounts'),
    seq(u64(), MAX_ASSETS_COUNT, 'future_amounts'),
    seq(u64(), MAX_ASSETS_COUNT, 'liabilities'),
  ],
  'viability',
);

export const PoolStateLayout = struct([
  accountHeaderType('account_header'),
  reserve(PoolStateReserved),
  publicKey('protocol'),
  publicKey('owner'),
  publicKey('authority'),
  u8('nonce'),
  zeros(7),
  u128('wallet_assets'),
  seq(publicKey(), MAX_ASSETS_COUNT, 'wallets'),
  seq(u16(), MAX_ASSETS_COUNT, 'wallets_ids'),
  PoolViabilityState,
  u64('staked_protocol_token'),
  PoolLiquidationState,
  u64('updated_at'),
]);

const AgreementLayout = struct([
  u64('slot'),
  u64('amount'),
  u64('rate'),
  u64('fee_amount'),
  u64('fee_tier'),
  u64('fee_balance'),
  u64('fee_percent'),
]);

export type AgreementType = {
  slot: BN;
  amount: BN;
  rate: BN;
};

export type AgreementBook = {
  protocol: PublicKey;
  pool: PublicKey;
  protocolAsset: PublicKey;
  wallet: PublicKey;
  isLend: number;
  count: number;
  agreements: AgreementType[];
};



export const AgreementBookLayout = struct([
  accountHeaderType('account_header'),
  reserve(AgreementBookReserved),
  publicKey('protocol'),
  publicKey('pool'),
  publicKey('asset'),
  publicKey('wallet'),
  u8('isLend'),
  u8('count'),
  zeros(6),
  seq(AgreementLayout, 32, 'agreements'),
]);

export const WalletBorrowStateLayout = struct(
  [u64('rate'), u64('amount'), u64('fee'), u64('tier')],
  'borrow',
);

export type WalletBorrowType = {
  rate: BN;
  amount: BN;
  fee: BN;
  tier: BN;
};

const MAX_TRADE_MARKETS = 10;

export type TradeConnection = {
  base_in_market: BN;
  quote_in_market: BN;
  base_balance_delta: BN;
  quote_balance_delta: BN;
  base_unhold_delta: BN;
  quote_unhold_delta: BN;
  base_tokens_returned: BN;
  quote_tokens_returned: BN;
  market: PublicKey;
  open_orders: PublicKey;
};

export type TradeState = {
  hold_amount: BN;
  markets_count: number;
  connections: TradeConnection[];
};

export const TradeLayout = struct(
  [
    u64('hold_amount'),
    u8('markets_count'),
    zeros(7),
    seq(
      struct([
        u64('base_in_market'),
        u64('quote_in_market'),

        u64('base_balance_delta'),
        u64('quote_balance_delta'),

        u64('base_unhold_delta'),
        u64('quote_unhold_delta'),

        u64('base_tokens_returned'),
        u64('quote_tokens_returned'),

        publicKey('market'),
        publicKey('open_orders'),
      ]),
      MAX_TRADE_MARKETS,
      'connections',
    ),
  ],
  'trade',
);

export const MAX_ASSET_PENDING_SETTLES = 512;

export const LendPendingSettle = struct(
  [publicKey('wallet'), u8('flags')],
  'walletElem',
);

export const LendPendingSettlesLayoutSize = 19064;

export const LendPendingSettlesLayout = struct([
  accountHeaderType('account_header'),
  reserve(PendingSettlesStateReserved),
  publicKey('protocol'),
  publicKey('asset'),
  struct(
    [
      seq(LendPendingSettle, MAX_ASSET_PENDING_SETTLES, 'elems'),
      struct(
        [seq(u16(), MAX_ASSET_PENDING_SETTLES, 'slots'), u16('used')],
        'allocator',
      ),
    ],
    'list',
  ),
  zeros(6),
]);

export const WalletStateLayout = struct([
  accountHeaderType('account_header'),
  reserve(WalletStateReserved),
  publicKey('protocol'),
  publicKey('pool'),
  publicKey('asset'),

  u64('total_liabilities'),
  u64('total_amount'),
  u64('total_futures_amount'),

  publicKey('native'),
  publicKey('oxy'),
  publicKey('debt'),
  publicKey('future'),

  publicKey('lend_orders'),
  publicKey('borrow_orders'),

  publicKey('lend_agreements'),
  publicKey('borrow_agreements'),

  optional_u64('next_reroll_rate'),
  optional_u64('reroll_rate'),
  optional_u64('lend_out_percent'),

  WalletBorrowStateLayout,
  u8('lend_out_market_rate'),
  u16('lending_settle_idx'),
  zeros(5),
  TradeLayout,
  u64('iou_oxy'),
  u64('iou_futures'),
]);

export const LiquidatorStateLayout = struct([
  accountHeaderType('account_header'),

  publicKey('protocol'),
  publicKey('liquidator_pool'),
  publicKey('borrower_pool'),

  u64('part'),
  u128('wallets_flag'),
  u8('retained'),
  zeros(7),
  u64('liquidation_slot'),
]);

export enum StateType {
  Uninialized = 0,
  Protocol = 1,
  Asset,
  Pool,
  AgreementBook,
  Wallet,
  Liquidator,
}

export type AccountHeader = {
  stateType: StateType;
  pubkey: PublicKey;
  version: number;
};

export type AssetToken = {
  mint: PublicKey;
  vault: PublicKey;
};

export type PoolState = {
  account_header: AccountHeader;
  owner: PublicKey;
  protocol: PublicKey;
  authority: PublicKey;
  nonce: number;
  liquidation_state: PublicKey;
  wallet_assets: BN;
  fee_wallet: PublicKey;
  wallets: PublicKey[];
  wallets_ids: number[];
  viability: PoolViability;
  liquidation: PoolLiquidation;
  updated_at: BN;
};

export type ContractState = {
  account_header: AccountHeader;
  protocol: PublicKey;
  pool: PublicKey;
  wallet: PublicKey;
  asset: PublicKey;
  slot: BN;
  amount: BN;
  rate: BN;
};

export type PoolWalletState = {
  account_header: AccountHeader;
  protocol: PublicKey;
  pool: PublicKey;
  asset: PublicKey;
  total_liabilities: BN;
  total_amount: BN;

  native: PublicKey;
  oxy: PublicKey;
  debt: PublicKey;
  future: PublicKey;
  iou_oxy: BN;
  iou_futures: BN;

  lend_orders: PublicKey;
  borrow_orders: PublicKey;

  lend_agreements: PublicKey;
  borrow_agreements: PublicKey;

  next_reroll_rate: OptionalU64;
  reroll_rate: OptionalU64;

  borrow: WalletBorrowType;
  lend_out_market_rate: number;

  lend_out_percent: OptionalU64;
  trade: TradeState;
};

export type LiquidatorState = {
  account_header: AccountHeader;
  protocol: PublicKey;
  liquidator_pool: PublicKey;
  borrower_pool: PublicKey;
  part: BN;
  wallets_flag: BN;
  retained: boolean;
  liquidation_slot: BN;
};

export function encodeLayout(src: Object, layout: Layout): Buffer {
  const ret = Buffer.alloc(layout.span);
  if (layout instanceof Layout) layout.encode(src, ret);

  return ret;
}

export function decodeLayout<T>(buff: Buffer, layout: Layout): T | null {
    return layout.decode(buff) as T;
}
