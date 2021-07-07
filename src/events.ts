import {PublicKey} from '@solana/web3.js';
import BN from 'bn.js';
import {struct, u32, u8, union} from 'buffer-layout';
import {decodeLayout} from './states';
import {publicKey, tradeAssetSide, u128, u64} from './types';

export const EventLayoutField = 'event';
export const EventLayoutPayloadField = 'payload';
export const EventLayout = union(
  u32('code'),
  undefined,
  EventLayoutPayloadField,
);

const protocol = [publicKey('protocol')];
const poolKey = [...protocol, publicKey('pool')];
const assetKey = [...protocol, publicKey('asset')];
const poolAssetKey = [...assetKey, publicKey('pool'), publicKey('wallet')];
const fee = [
  u64('feeTier'),
  u64('feeTokenBalance'),
  u64('feePercent'),
  u64('feeAmount'),
];
const assetFields = [
  u64('assetAmount'),
  u64('assetBalance'),
  u64('assetPrice'),
];

const clearingFields = [
  u64('fromSlot'),
  u64('toSlot'),
  u64('interestAmount'),
  u64('interestRate'),
];

export type clearingFieldsType = {
  fromSlot: BN;
  toSlot: BN;
  interestAmount: BN;
  interestRate: BN;
};

const liabilityFields = [u64('liabilityBalance'), u64('liabilityAmount')];

const orderFields = [...assetFields, u64('rateAPY')];
const contractTerm = [u64('term')];

type assetKeyType = { protocol: PublicKey; asset: PublicKey };
type poolKeyType = { protocol: PublicKey; pool: PublicKey };
type poolAssetKeyType = poolKeyType & { asset: PublicKey; wallet: PublicKey };

type assetFieldsType = { assetAmount: BN; assetBalance: BN; assetPrice: BN };
type liabilityFieldsType = { liabilityBalance: BN; liabilityAmount: BN };

type orderFieldsType = assetFieldsType & { rateAPY: BN };

type feeType = { feeTier: BN; feeTokenBalance: BN; feeRate: BN; feeAmount: BN };

type contractTermType = { term: BN };

export enum ProtocolEventType {
  PROTOCOL_CREATED = 'protocolCreated',
  PROTOCOL_ASSET_CREATED = 'protocolAssetCreated',
  PROTOCOL_ASSET_PRICE = 'protocolAssetPrice',
  POOL_CREATED = 'poolCreated',
  POOL_ASSET_CREATED = 'poolAssetCreated',
  POOL_DEPOSIT = 'deposit',
  POOL_LEND = 'lend',
  POOL_BORROW = 'borrow',
  POOL_BORROW_MATCHED = 'borrowMatched',
  POOL_LEND_MATCHED = 'lendMatched',
  POOL_WITHDRAW = 'withdraw',
  POOL_REPAYMENT = 'repayment',
  POOL_AUTO_LENT_OUT = 'autoLentOut',
  POOL_ASSET_LEND_RATE = 'poolAssetLendRate',
  POOL_ASSET_BORROW_RATE = 'poolAssetBorrowRate',
  POOL_ASSET_LEND_PENDING_CANCEL = 'poolAssetLendPendingCancel',
  POOL_ASSET_BORROW_PENDING_CANCEL = 'poolAssetBorrowPendingCancel',
  POOL_CLEARING_LEND_AGREEMENT = 'poolClearingLendAgreement',
  POOL_ASSET_LEND_PENDING_CANCELLED = 'poolAssetLendPendingCancelled',
  POOL_ASSET_BORROW_PENDING_CANCELLED = 'poolAssetBorrowPendingCancelled',
  POOL_FEE_WALLET_CHANGED = 'poolFeeWalletChanged',
  POOL_TRADE_PLACE_ORDER = 'tradePlaceOrder',
  POOL_TRADE_CANCEL_ORDER = 'tradeCancelOrder',
  POOL_TRADE_SETTLE = 'tradeSettle',
  POOL_TRADE_FINALIZE_SETTLE = 'tradeFinalizeSettle',
}

const ProtocolCreatedEventLayout = struct([
  publicKey('protocol'),
  publicKey('owner'),
]);

export type ProtocolCreatedEvent = { protocol: PublicKey; owner: PublicKey };
EventLayout.addVariant(
  0,
  ProtocolCreatedEventLayout,
  ProtocolEventType.PROTOCOL_CREATED,
);

const ProtocolAssetCreatedEventLayout = struct([
  ...assetKey,
  u32('index'),
  u32('futureDays'),
  u64('iltv'),
  u64('mltv'),
  publicKey('nativeAsset'),
  u32('decimals'), // 8
  u8('minAssetSize'),
]);
export type ProtocolAssetCreatedEvent = assetKeyType & {
  index: number;
  futureDays: number;
  iltv: number;
  mltv: number;
  nativeAsset: PublicKey;
  decimals: number;
  minAssetSize: number;
};

EventLayout.addVariant(
  1,
  ProtocolAssetCreatedEventLayout,
  ProtocolEventType.PROTOCOL_ASSET_CREATED,
);

const PoolCreatedEventLayout = struct([...poolKey, publicKey('owner')]);
export type PoolCreatedEvent = poolKeyType & { owner: PublicKey };
EventLayout.addVariant(
  2,
  PoolCreatedEventLayout,
  ProtocolEventType.POOL_CREATED,
);

const PoolAssetCreated = struct([...poolAssetKey]);

export type PoolAssetCreatedEvent = poolAssetKeyType;
EventLayout.addVariant(
  3,
  PoolAssetCreated,
  ProtocolEventType.POOL_ASSET_CREATED,
);

const PoolDepositEventLayout = struct([
  ...poolAssetKey,
  ...assetFields,
  publicKey('fromNativeWallet'),
]);

export type PoolDepositEvent = poolAssetKeyType &
  assetFieldsType & { fromNativeWallet: PublicKey };

EventLayout.addVariant(
  4,
  PoolDepositEventLayout,
  ProtocolEventType.POOL_DEPOSIT,
);

const PoolLendOrderEventLayout = struct([...poolAssetKey, ...orderFields]);
const PoolBorrowOrderEventLayout = struct([
  ...poolAssetKey,
  ...orderFields,
  ...liabilityFields,
  ...fee,
]);

export type PoolLendOrderEvent = poolAssetKeyType & orderFieldsType;
export type PoolBorrowOrderEvent = poolAssetKeyType &
  orderFieldsType &
  liabilityFieldsType &
  feeType;

EventLayout.addVariant(
  5,
  PoolLendOrderEventLayout,
  ProtocolEventType.POOL_LEND,
);
EventLayout.addVariant(
  6,
  PoolBorrowOrderEventLayout,
  ProtocolEventType.POOL_BORROW,
);

const PoolBorrowMatchedEventLayout = struct([
  ...poolAssetKey,
  ...orderFields,
  ...liabilityFields,
  ...contractTerm,
]);

export type PoolBorrowMatchedEvent = poolAssetKeyType &
  orderFieldsType &
  liabilityFieldsType &
  contractTermType;
EventLayout.addVariant(
  7,
  PoolBorrowMatchedEventLayout,
  ProtocolEventType.POOL_BORROW_MATCHED,
);

const PoolLendMatchedEventLayout = struct([
  ...poolAssetKey,
  ...orderFields,
  ...contractTerm,
]);

export type PoolLendMatchedEvent = poolAssetKeyType &
  orderFieldsType &
  contractTermType;
EventLayout.addVariant(
  8,
  PoolLendMatchedEventLayout,
  ProtocolEventType.POOL_LEND_MATCHED,
);

// здесь может быть еще ltv, mltv
const WithdrawEventLayout = struct([
  ...poolAssetKey,
  ...assetFields,
  publicKey('toNativeWallet'),
]);
export type WithdrawEvent = poolAssetKeyType &
  assetFieldsType & { toNativeWallet: PublicKey };
EventLayout.addVariant(9, WithdrawEventLayout, ProtocolEventType.POOL_WITHDRAW);

// здесь может быть еще ltv, mltv
const RepaymentEventLayout = struct([
  ...poolAssetKey,
  ...assetFields,
  ...liabilityFields,
  ...fee,
  ...clearingFields,
]);
export type RepaymentEvent = poolAssetKeyType &
  assetFieldsType &
  liabilityFieldsType &
  feeType &
  clearingFieldsType;

EventLayout.addVariant(
  10,
  RepaymentEventLayout,
  ProtocolEventType.POOL_REPAYMENT,
);

const AutoLentOutLayout = struct([
  ...poolAssetKey,
  u8('lentout'), // true-1; false-0
  u8('marketRate'), // true-1; false-0
]);

export type AutoLentOutEvent = poolAssetKeyType & {
  lentout: number;
  marketRate: number;
};
EventLayout.addVariant(
  11,
  AutoLentOutLayout,
  ProtocolEventType.POOL_AUTO_LENT_OUT,
);

const PoolAssetRateLayout = struct([...poolAssetKey, u64('percent')]);
export type PoolAssetRateEvent = poolAssetKeyType & { percent: BN };
EventLayout.addVariant(
  12,
  PoolAssetRateLayout,
  ProtocolEventType.POOL_ASSET_LEND_RATE,
);
EventLayout.addVariant(
  13,
  PoolAssetRateLayout,
  ProtocolEventType.POOL_ASSET_BORROW_RATE,
);

const PoolAssetLendPendingCancelLayout = struct([
  ...poolAssetKey,
  ...assetFields,
]);
export type PoolAssetLendPendingCancelEvent = poolAssetKeyType &
  assetFieldsType;
EventLayout.addVariant(
  14,
  PoolAssetLendPendingCancelLayout,
  ProtocolEventType.POOL_ASSET_LEND_PENDING_CANCEL,
);

const PoolAssetBorrowPendingCancelLayout = struct([
  ...poolAssetKey,
  ...assetFields,
  ...liabilityFields,
]);
export type PoolAssetBorrowPendingCancelEvent = poolAssetKeyType &
  assetFieldsType &
  liabilityFieldsType;
EventLayout.addVariant(
  15,
  PoolAssetBorrowPendingCancelLayout,
  ProtocolEventType.POOL_ASSET_BORROW_PENDING_CANCEL,
);

const protocolAssetPriceLayout = struct([...assetKey, u64('price')]);
export type ProtocolAssetPriceEvent = assetKeyType & { price: BN };
EventLayout.addVariant(
  16,
  protocolAssetPriceLayout,
  ProtocolEventType.PROTOCOL_ASSET_PRICE,
);

// CloseAgreement
// Очень опасное событие, его может быть очень много с малеьнким размером ордера
// Нужно агрегировать
const poolLendAgreementClearingLayout = struct([
  ...poolAssetKey,
  ...assetFields,
  ...fee,
  ...clearingFields,
]);
export type LendAgreementClearingEvent = poolAssetKeyType &
  assetFieldsType &
  feeType &
  clearingFieldsType;
EventLayout.addVariant(
  17,
  poolLendAgreementClearingLayout,
  ProtocolEventType.POOL_CLEARING_LEND_AGREEMENT,
);

export type PoolAssetLendPendingCancelledEvent = poolAssetKeyType &
  assetFieldsType;
EventLayout.addVariant(
  18,
  PoolAssetLendPendingCancelLayout,
  ProtocolEventType.POOL_ASSET_LEND_PENDING_CANCELLED,
);
export type PoolAssetBorrowPendingCancelledEvent = poolAssetKeyType &
  assetFieldsType &
  liabilityFieldsType;
EventLayout.addVariant(
  19,
  PoolAssetBorrowPendingCancelLayout,
  ProtocolEventType.POOL_ASSET_BORROW_PENDING_CANCELLED,
);

export type PoolFeeWalletChangedEvent = poolKeyType & {
  poolOwner: PublicKey;
  feeWallet: PublicKey;
};

EventLayout.addVariant(
  20,
  struct([
    publicKey('protocol'),
    publicKey('pool'),
    publicKey('poolOwner'),
    publicKey('feeWallet'),
  ]),
  ProtocolEventType.POOL_FEE_WALLET_CHANGED,
);

const tradeCommonEventFields = [
  ...poolKey,
  publicKey('programId'),
  publicKey('market'),
  publicKey('openOrders'),
];

const tradeCommonEventPairAssetFields = [
  publicKey('baseAsset'),
  u64('baseAmount'),
  publicKey('quoteAsset'),
  u64('quoteAmount'),
];

const tradeCommonOrderEventFields = [
  u8('side'),
  u8('type'),
  ...tradeCommonEventPairAssetFields,
  u64('quotePrice'),
];

EventLayout.addVariant(
  21,
  struct([...tradeCommonEventFields, ...tradeCommonOrderEventFields]),
  ProtocolEventType.POOL_TRADE_PLACE_ORDER,
);

EventLayout.addVariant(
  22,
  struct([
    ...tradeCommonEventFields,
    u128('orderId'),
    u8('orderSlot'),
    u8('side'),
    publicKey('baseAsset'),
    publicKey('quoteAsset'),
  ]),
  ProtocolEventType.POOL_TRADE_CANCEL_ORDER,
);

EventLayout.addVariant(
  23,
  struct([
    ...tradeCommonEventFields,
    tradeAssetSide('assetType'),
    publicKey('asset'),
    u64('assetBalance'),
    u64('assetAmount'),
    u32('assetAmountDir'),
  ]),
  ProtocolEventType.POOL_TRADE_FINALIZE_SETTLE,
);

EventLayout.addVariant(
  24,
  struct([
    ...tradeCommonEventFields,
    tradeAssetSide('assetType'),
    publicKey('asset'),
    u64('openOrdersBalance'),
    u32('openOrdersCount'),
  ]),
  ProtocolEventType.POOL_TRADE_SETTLE,
);

export const eventMaxSpan: number = Math.max(
  ...Object.values(EventLayout.registry).map((r: any) => r.span),
);

export type ProtocolEvent =
  | ProtocolCreatedEvent
  | ProtocolAssetCreatedEvent
  | PoolCreatedEvent
  | PoolDepositEvent
  | PoolLendOrderEvent
  | PoolBorrowOrderEvent
  | PoolBorrowMatchedEvent
  | RepaymentEvent
  | LendAgreementClearingEvent
  | PoolAssetLendPendingCancelEvent
  | PoolAssetBorrowPendingCancelEvent
  | PoolAssetLendPendingCancelledEvent
  | PoolFeeWalletChangedEvent
  | PoolAssetBorrowPendingCancelledEvent;
export type EventMsg = Record<ProtocolEventType, ProtocolEvent> | null;

export function encodeEvent(
  type: ProtocolEventType,
  payload: ProtocolEvent,
): Buffer {
  const destBuff = Buffer.alloc(eventMaxSpan);
  const event = {};
  event[type] = payload;

  const span = EventLayout.encode(event, destBuff);

  return destBuff.slice(0, span);
}

export function decodeEvent(buff: Buffer): EventMsg {
  return decodeLayout(buff, EventLayout);
}
