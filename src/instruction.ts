import {
  AccountMeta,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { struct, u16, u32, u8 } from 'buffer-layout';
import { optional_u64, OptionalU64, u64, u128, i8, autovec } from './types';
import { AssetToken, FeeTableType, FeeTier } from './states';
import { LtvParams, ltvParamsLayout } from './states';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const OXYGEN_PROGRAM_ID = new PublicKey('J21zqcffYQU2NUJrvAKhqpKZLQK1YaB9dY5kmcxkMQvQ');

function sign(key: PublicKey): AccountMeta {
  return {
    pubkey: key,
    isSigner: true,
    isWritable: true,
  };
}

function write(key: PublicKey): AccountMeta {
  return {
    pubkey: key,
    isSigner: false,
    isWritable: true,
  };
}

function read(key: PublicKey): AccountMeta {
  return {
    pubkey: key,
    isSigner: false,
    isWritable: false,
  };
}

const CreateProtocolAssetLayoutMembers = [
  u8('native_decimals'),
  u8('oxy_decimals'),
  u8('min_asset_size'),
  u64('oxy_lot_size'),
  u32('future_days'), // in slot
  u64('initial_ltv'),
  u64('reset_ltv'),
  u64('maintenance_ltv'),
  u64('critical_ltv'),
  u64('liquidation_discount'),
];

export type CreateProtocolAssetType = {
  native_decimals: number;
  oxy_decimals: number;
  min_asset_size: number;
  future_days: number;
  oxy_lot_size: BN;
  initial_ltv: BN;
  reset_ltv: BN;
  maintenance_ltv: BN;
  critical_ltv: BN;
  liquidation_discount: BN;
};

export const CreateProtocol = 'createProtocol';
export const CreateProtocolAsset = 'createProtocolAsset';
export const DepositToPool = 'depositToPool';
export const WithdrawFromPool = 'withdrawFromPool';
export const CreatePool = 'createPool';
export const CreatePoolWallet = 'createPoolWallet';
export const LendPoolAssetField = 'lendPoolAsset';
export const ChangePoolLentAutoRate = 'changePoolLentOutRate';
export const CancelLend = 'cancelPoolLends';
export const PoolLendSettle = 'poolSettleLend';
export const BorrowingAsset = 'borrowingAsset';
export const PoolBorrowSettle = 'poolSettleBorrow';
export const AttachPoolWalletToMarket = 'attachPoolWallet';
export const CancelBorrow = 'cancelPoolBorrows';
export const PoolRepayment = 'poolRepayment';
export const PoolLendClearing = 'poolLendClearing';
export const PoolAccounting = 'poolAccounting';
export const WriteFeeTable = 'writeFeeTable';
export const PoolOneLendClearing = 'poolOneLendClearing';
export const PoolLiquidationInitialize = 'poolLiquidationInitialize';
export const PoolLiquidationSanitize = 'poolLiquidationSanitize';
export const PoolLiquidationCollectOverdue = 'poolLiquidationCollectOverdue';
export const PoolLiquidationCalculateAmounts =
  'poolLiquidationCalculateAmounts';
export const PoolLiquidationNetting = 'poolLiquidationNetting';
export const ProvideValueAsset = struct([u16('wallet_index'), u64('amount')]);
export const PoolLiquidationProvideAndRepay = 'poolLiquidationProvideAndRepay';
export const PoolLiquidationSendCollateral = 'poolLiquidationSendCollateral';
export const PoolTradePlace = 'poolTradePlace';
export const PoolTradeCancel = 'poolTradeCancel';
export const PoolTradeSettle = 'poolTradeSettle';
export const PoolTradeFinalizeSettle = 'poolTradeFinalizeSettle';
export const PoolTradeAttachMarket = 'poolTradeAttachMarket';
export const UpdateProtocolAssetPrice = 'updateProtocolAssetPrice';
export const ConsumeLendingDexEvents = 'consumeLendingDexEvents';
export const CreateDerivedAddress = 'createDerivedAddress';
export const RiskParamsSet = 'riskParamsSet';
export const RiskParamsApply = 'riskParamsApply';

const eventOrderType = struct([i8('lend'), i8('borrow')], 'element');

const InstructionMetadata = {
  [CreateProtocol]: {
    id: 0x00_00,
    layout: [u64('slots_in_day'), u64('viability_ttl'), u8('nonce')],
  },
  [CreateDerivedAddress]: { id: 0x00_01, layout: [u8('type'), u8('nonce')] },
  [CreateProtocolAsset]: {
    id: 0x00_02,
    layout: CreateProtocolAssetLayoutMembers,
  },
  [CreatePool]: { id: 0x00_03, layout: [u8('nonce')] },
  [CreatePoolWallet]: { id: 0x00_04 },

  [WriteFeeTable]: { id: 0x01_03, layout: [autovec(FeeTier, 'tiers')] },

  [DepositToPool]: { id: 0x02_00, layout: [u64('amount')] },
  [WithdrawFromPool]: { id: 0x02_01, layout: [u64('amount')] },
  [PoolAccounting]: { id: 0x02_02 },
  [UpdateProtocolAssetPrice]: { id: 0x02_03 },

  [AttachPoolWalletToMarket]: { id: 0x03_00 },
  [ChangePoolLentAutoRate]: {
    id: 0x03_01,
    layout: [u64('lent_out_pct'), optional_u64('rate', false)],
  },
  [LendPoolAssetField]: { id: 0x03_02 },
  [CancelLend]: { id: 0x03_03, layout: [u8('limit')] },
  [PoolLendSettle]: { id: 0x03_04 },
  [PoolLendClearing]: { id: 0x03_05 },
  [PoolOneLendClearing]: { id: 0x03_06 },

  [BorrowingAsset]: { id: 0x03_10, layout: [u64('amount'), u64('rate')] },
  [CancelBorrow]: { id: 0x03_11, layout: [u8('limit')] },
  [PoolBorrowSettle]: { id: 0x03_12 },
  [PoolRepayment]: { id: 0x03_13, layout: [u64('amount')] },

  [ConsumeLendingDexEvents]: {
    id: 0x03_20,
    layout: [u16('limit'), autovec(eventOrderType, 'orders_idx')],
  },

  [PoolLiquidationInitialize]: { id: 0x04_00 },
  [PoolLiquidationSanitize]: { id: 0x04_01 },
  [PoolLiquidationCollectOverdue]: { id: 0x04_02 },
  [PoolLiquidationCalculateAmounts]: { id: 0x04_03 },
  [PoolLiquidationNetting]: { id: 0x04_04 },
  [PoolLiquidationProvideAndRepay]: {
    id: 0x04_05,
    layout: [
      autovec(
        struct([u16('wallet_index'), u64('amount')], 'wallet'),
        'provided',
      ),
    ],
  },
  [PoolLiquidationSendCollateral]: { id: 0x04_06 },

  [PoolTradePlace]: {
    id: 0x05_00,
    layout: [u64('amount'), u64('price'), u8('ask'), u32('order_type')],
  },
  [PoolTradeCancel]: {
    id: 0x05_01,
    layout: [u128('orderId'), u8('slot'), u8('ask')],
  },
  [PoolTradeSettle]: { id: 0x05_02 },
  [PoolTradeFinalizeSettle]: { id: 0x05_03 },

  [RiskParamsSet]: {id: 0x01_08, layout: [u64('update_in_slot'), u8('min_asset_size'), u64('oxy_lot_size'), ltvParamsLayout]},
  [RiskParamsApply]: {id: 0x01_06},
};

const InstructionLayout = struct([u16('id'), u16('version')]);

export function encodeInstructionData(type, src): Buffer {
  const buf = Buffer.alloc(256);
  const meta = InstructionMetadata[type];

  let span = InstructionLayout.encode({ id: meta.id, version: 0 }, buf);

  if (meta.layout) {
    span += struct(meta.layout).encode(src, buf, span);
  }

  return buf.slice(0, span);
}

export type CreateProtocolInstructionParams = {
  programId: PublicKey;
  owner: PublicKey;
  account: PublicKey;
  tokenProgramId: PublicKey;
  protocolAuthority: PublicKey;
  slotsInDays: number;
  viabilityTtl: number;
  nonce: number;
  lendingProgramId: PublicKey;
  tradeProgramId: PublicKey;
  baseCurrencyMint: PublicKey;
};

export type CreateProtocolAssetInstructionParams = {
  programId: PublicKey;
  owner: PublicKey;
  protocolAsset: PublicKey;
  protocol: PublicKey;
  dexProgramId: PublicKey;
  dexMarket: PublicKey;
  tokenProgramId: PublicKey;
  feeVault: PublicKey;
  rebateVault: PublicKey;
  assetAuthority: PublicKey;
  baseCurrencyDexMarket?: PublicKey;
  lendPendingSettles: PublicKey;

  native: AssetToken;
  oxyToken: AssetToken;
  debtToken: AssetToken;
  futureToken: AssetToken;

  data: CreateProtocolAssetType;
};

export type UpdateAssetPriceInstructionParams = {
  programId: PublicKey;
  protocol: PublicKey;
  asset: PublicKey;
  market: PublicKey;
  bids: PublicKey;
  asks: PublicKey;
};

export type CreatePoolInstructionParams = {
  programId: PublicKey;
  protocolAuthority: PublicKey;
  owner: PublicKey;
  protocol: PublicKey;
  pool: PublicKey;
  nonce: number;
};

export type AttachPoolWalletToMarketParams = {
  programId: PublicKey;
  protocol: PublicKey;
  asset: PublicKey;
  pool: PublicKey;
  wallet: PublicKey;
  owner: PublicKey;

  lendAgreements: PublicKey;
  borrowAgreements: PublicKey;

  lendOpenOrders: PublicKey;
  borrowOpenOrders: PublicKey;

  lendingProgramId: PublicKey;
};

export type CreatePoolWalletInstructionParams = {
  programId: PublicKey;
  tokenProgramId: PublicKey;
  owner: PublicKey;
  protocol: PublicKey;
  asset: PublicKey;
  pool: PublicKey;
  poolAuthority: PublicKey;
  wallet: PublicKey;

  tokens: AssetToken[];
};

/**
 * @param owner Pool owner account
 * @param tokenProgramId SPL Token
 * @param protocol Pool protocol account
 * @param walletOxy Oxy token address for pool wallet in asset
 * @param ownerNativeAccount Account from which token amounts will be charge
 */
type DepositToPoolParams = {
  programId: PublicKey;
  owner: PublicKey;
  tokenProgramId: PublicKey;
  protocol: PublicKey;
  pool: PublicKey;
  asset: PublicKey;
  wallet: PublicKey;
  walletOxy: PublicKey;
  fromNativeAccount: PublicKey;
  assetNativeVault: PublicKey;
  assetOxyMint: PublicKey;
  assetAuthority: PublicKey;
  amount: BN;
};

/**
 * @param owner Pool owner account
 * @param tokenProgramId SPL Token
 * @param protocol Pool protocol account
 * @param walletOxy Oxy token address for pool wallet in asset
 * @param ownerNativeAccount Account from which token amounts will be charge
 */
type WithdrawFromPoolParams = {
  programId: PublicKey;
  owner: PublicKey;
  tokenProgramId: PublicKey;
  protocol: PublicKey;
  pool: PublicKey;
  wallet: PublicKey;
  asset: PublicKey;
  toNativeAccount: PublicKey;
  assetNativeVault: PublicKey;
  assetOxyMint: PublicKey;
  walletOxy: PublicKey;
  assetAuthority: PublicKey;
  poolAuthority: PublicKey;
  amount: BN;
};

type SetPoolLendRateParam = {
  programId: PublicKey;
  poolOwner: PublicKey;
  protocol: PublicKey;
  asset: PublicKey;
  pool: PublicKey;
  wallet: PublicKey;
  rate: OptionalU64;
  lentOutPct: BN;
};

export type SetProtocolFeeTiers = {
  programId: PublicKey;
  protocol: PublicKey;
  owner: PublicKey;
  feeTiersTable: FeeTableType;
};
export type CreateDerivedAddressParams = {
  programId: PublicKey;
  payer: PublicKey;
  newAddress: PublicKey;
  ownerProgramId: PublicKey;
  seeds: PublicKey[];
  type: BN;
  nonce: BN;
};

type InstructionData<T = {}> = { data: T };

type TradePlaceParamsData = {
  amount: BN;
  price: BN;
  ask: number;
  order_type: number;
};

type TradeHeaderAccounts = {
  programId: PublicKey;
  dexProgramId: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  pool: PublicKey;
  poolAuthority: PublicKey;
  poolWallet: PublicKey;
  dexMarket: PublicKey;
  dexMarketOpenOrders: PublicKey;
};

export type TradePlaceParams = {
  programId: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  pool: PublicKey;
  poolAuthority: PublicKey;
  poolWallet: PublicKey;
  poolOwner: PublicKey;
  tokenProgramId: PublicKey;
  quoteProtocolAsset: PublicKey;
  tradeNativeAssetProtocolAuthority: PublicKey;
  quotePoolWallet: PublicKey;
  tradeNativeAssetProtocolVault: PublicKey;
  tradedNativeAssetPoolVault: PublicKey;
  data: TradePlaceParamsData;
} & DexMarketBidAsks;

type TradeCancelParamsData = {
  orderId: BN;
  slot: number;
  ask: number;
};

type TradeCancelAccounts = Pick<
  DexMarketBidAsks,
  | 'dexMarket'
  | 'dexMarketOpenOrders'
  | 'dexMarketEventQueue'
  | 'dexMarketBids'
  | 'dexMarketAsks'
  > & {
  poolOwner: PublicKey;
  quoteProtocolAsset: PublicKey;
};

export type TradeCancelParams = TradeHeaderAccounts &
  TradeCancelAccounts &
  InstructionData<TradeCancelParamsData>;

type TradeSettleAccounts = Pick<
  DexMarket,
  | 'dexMarket'
  | 'dexMarketOpenOrders'
  | 'dexMarketCoinVault'
  | 'dexMarketPriceVault'
  > & {
  tokenProgramId: PublicKey;
  quoteProtocolAsset: PublicKey;
  dexMarketVaultSigner: PublicKey;
  tradeNativeBaseAssetAccount: PublicKey;
  tradeNativeQuoteAssetAccount: PublicKey;
  tradeNativeQuoteAssetRebateVault: PublicKey;
};

export type TradeSettleParams = TradeHeaderAccounts & TradeSettleAccounts;

type TradeFinalizeSettleAccounts = Pick<
  DexMarket,
  'dexMarket' | 'dexMarketOpenOrders'
  > & {
  tokenProgramId: PublicKey;
  quoteProtocolAsset: PublicKey;
  baseProtocolAssetAuthority: PublicKey;
  quoteProtocolAssetAuthority: PublicKey;
  tradeOxyBaseAssetAccount: PublicKey;
  tradeOxyQuoteAssetAccount: PublicKey;
  tradeOxyBaseAssetMint: PublicKey;
  tradeOxyQuoteAssetMint: PublicKey;
  tradeNativeBaseAssetAccount: PublicKey;
  tradeNativeQuoteAssetAccount: PublicKey;
  tradeNativeBaseAssetVault: PublicKey;
  tradeNativeQuoteAssetVault: PublicKey;
  quoteWallet: PublicKey;
};

export type TradeFinalizeSettleParams = TradeHeaderAccounts &
  TradeFinalizeSettleAccounts;

export type AccountingStepParam = {
  asset: PublicKey;
  wallet: PublicKey;
};

export type AccountingParams = {
  programId: PublicKey;
  protocol: PublicKey;
  pool: PublicKey;
  accounting: PublicKey;
  accounter: PublicKey;
  steps: AccountingStepParam[];
};

type DexMarket = {
  dexProgramId: PublicKey;
  dexMarket: PublicKey;
  dexMarketOpenOrders: PublicKey;
  dexMarketCoinVault: PublicKey;
  dexMarketPriceVault: PublicKey;
  dexMarketRequestQueue: PublicKey;
  dexMarketEventQueue: PublicKey;
};

type DexMarketBidAsks = DexMarket & {
  dexMarketBids: PublicKey;
  dexMarketAsks: PublicKey;
};

type CancelBorrowsParams = {
  programId: PublicKey;
  poolOwner: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  pool: PublicKey;
  poolAuthority: PublicKey;
  poolWallet: PublicKey;
  limit: number;
} & DexMarketBidAsks;

type CancelLendsParams = {
  programId: PublicKey;
  poolOwner: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  pool: PublicKey;
  poolAuthority: PublicKey;
  poolWallet: PublicKey;
  limit: number;
} & DexMarketBidAsks;

type RepaymentBorrowParams = {
  pool: PublicKey;
  poolOwner: PublicKey;
  poolAuthority: PublicKey;
  poolWallet: PublicKey;
  programId: PublicKey;
  tokenProgramId: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  protocolAssetAuthority: PublicKey;
  poolWalletBorrowAgreement: PublicKey;
  poolWalletOxy: PublicKey;
  protocolVaultOxy: PublicKey;
  protocolOxyMint: PublicKey;
  poolWalletDebt: PublicKey;
  protocolDebtMint: PublicKey;
  poolFeeWallet: PublicKey;
  protocolFeeVault: PublicKey;
  protocolNativeVault: PublicKey;
  amount: BN;
};

type LendClearingParams = {
  programId: PublicKey;
  tokenProgramId: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  protocolAssetAuthority: PublicKey;
  pool: PublicKey;
  poolAuthority: PublicKey;
  poolWallet: PublicKey;
  poolWalletLendAgreement: PublicKey;
  poolWalletOxy: PublicKey;
  protocolVaultOxy: PublicKey;
  protocolOxyMint: PublicKey;
  poolWalletFuture: PublicKey;
  protocolFutureMint: PublicKey;
  poolFeeWallet: PublicKey;
  protocolFeeVault: PublicKey;
  protocolNativeVault: PublicKey;
};

type SettleParams = {
  programId: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  pool: PublicKey;
  poolAuthority: PublicKey;
  poolWallet: PublicKey;
  poolWalletFuture: PublicKey;
  poolWalletOxy: PublicKey;

  poolWalletAgreement: PublicKey;
  protocolOxyVault: PublicKey;
  dexMarketAuthority: PublicKey;
  tokenProgramId: PublicKey;
  lendPendingSettles: PublicKey;
};

type SettleLendParams = SettleParams & DexMarket;

type SettleBorrowParams = SettleParams &
  DexMarket & {
  protocolFutureMint: PublicKey;
  poolWalletDebt: PublicKey;
  protocolDebtMint: PublicKey;
  protocolAssetAuthority: PublicKey;
};

type BorrowParams = {
  programId: PublicKey;
  pool: PublicKey;
  poolOwner: PublicKey;
  poolWallet: PublicKey;
  poolAuthority: PublicKey;
  tokenProgramId: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  protocolAssetAuthority: PublicKey;

  poolWalletFuture: PublicKey;
  protocolFutureMint: PublicKey;

  rate: BN;
  amount: BN;
} & DexMarketBidAsks;

type LendParams = {
  programId: PublicKey;

  tokenProgramId: PublicKey;
  protocol: PublicKey;
  protocolAsset: PublicKey;
  protocolAssetAuthority: PublicKey;

  pool: PublicKey;
  poolOwner: PublicKey;
  poolWallet: PublicKey;
  poolAuthority: PublicKey;
  poolOxyWallet: PublicKey;
  dexMarketBids: PublicKey;
  dexMarketAsks: PublicKey;
} & DexMarket;

export type LiquidationHeader = {
  programId: PublicKey;
  protocol: PublicKey;
  pool: PublicKey;
  initialLiquidatorPool: PublicKey;
};

export type LiquidationInitializeParams = {
  initialOwner: PublicKey;
  debtBook?: PublicKey;
} & LiquidationHeader;

export type LiquidationSanitizeStep = {
  wallet: PublicKey;
  debtBook: PublicKey;
  lendOpenOrders: PublicKey;
  borrowOpenOrders: PublicKey;
};

export type LiquidationSanitizeParams = {
  steps: LiquidationSanitizeStep[];
} & LiquidationHeader;

export type LiquidationCollectOverdueStep = {
  asset: PublicKey;
  wallet: PublicKey;
  debtBook: PublicKey;
};

export type LiquidationCollectOverdueParams = {
  steps: LiquidationCollectOverdueStep[];
} & LiquidationHeader;

export type LiquidationCalculateAmountsStep = {
  asset: PublicKey;
  wallet: PublicKey;
  oxyWallet: PublicKey;
  debtBook: PublicKey;
};

export type LiquidationCalculateAmountsParams = {
  steps: LiquidationCalculateAmountsStep[];
} & LiquidationHeader;

export type LiquidationNettingStep = {
  asset: PublicKey;
  wallet: PublicKey;
  oxyWallet: PublicKey;
  oxyVault: PublicKey;
  debtBook: PublicKey;
  debtMint: PublicKey;
  debtWallet: PublicKey;
};

export type LiquidationNettingParams = {
  initialLiquidatorState: PublicKey;
  poolAuthority: PublicKey;
  steps: LiquidationNettingStep[];
} & LiquidationHeader;

export type LiquidationProvideStep = {
  walletIndex: number;
  amount: BN;
  asset: PublicKey;
  borrowerWallet: PublicKey;
  liquidatorWallet: PublicKey;
  liquidatorOxyWallet: PublicKey;
  oxyVault: PublicKey;
  debtBook: PublicKey;
  debtMint: PublicKey;
  borrowerDebtWallet: PublicKey;
};

export type LiquidationProvideParams = {
  liquidatorState: PublicKey;
  liquidatorAuthority: PublicKey;
  borrowerAuthority: PublicKey;
  steps: LiquidationProvideStep[];
} & LiquidationHeader;

export type LiquidationSendCollateralParams = {
  borrowerAuthority: PublicKey;
  liquidatorState: PublicKey;
  liquidatorPool: PublicKey;
  asset: PublicKey;
  liquidatorWallet: PublicKey;
  borrowerWallet: PublicKey;
  liquidatorOxyWallet: PublicKey;
  liquidatorFutureWallet: PublicKey;
  liquidatorLendBook: PublicKey;
  borrowerOxyWallet: PublicKey;
  borrowerFutureWallet: PublicKey;
  borrowerLendBook: PublicKey;
} & LiquidationHeader;

type SetRiskParamsData = {
  min_asset_size: number;
  oxy_lot_size: BN;
  update_in_slot: BN;
  ltv_params: LtvParams;
}

export type SetRiskParams = {
  programId: PublicKey;
  protocol: PublicKey;
  protocolOwner: PublicKey;
  asset: PublicKey;
} & InstructionData<SetRiskParamsData>;



export class PrimeBrokerageInstructions {

  static setRiskParams(params:SetRiskParams) : TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      sign(params.protocolOwner),
      write(params.asset),
      read(SYSVAR_CLOCK_PUBKEY),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(RiskParamsSet, params.data);

    return new TransactionInstruction({keys, programId, data})
  }

  static createDerivedAddress(
    params: CreateDerivedAddressParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(SystemProgram.programId),
      sign(params.payer),
      write(params.newAddress),
      read(params.ownerProgramId),
      read(SYSVAR_RENT_PUBKEY),
    ];

    params.seeds.forEach((seed) => keys.push(read(seed)));

    const data = encodeInstructionData(CreateDerivedAddress, {
      type: params.type,
      nonce: params.nonce,
    });

    return new TransactionInstruction({
      keys,
      data,
      programId: params.programId,
    });
  }

  static createProtocol(
    params: CreateProtocolInstructionParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: params.lendingProgramId, isSigner: false, isWritable: false },
      { pubkey: params.tradeProgramId, isSigner: false, isWritable: false },
      { pubkey: params.owner, isSigner: true, isWritable: true },
      { pubkey: params.account, isSigner: false, isWritable: true },
      { pubkey: params.protocolAuthority, isSigner: false, isWritable: true },
      { pubkey: params.baseCurrencyMint, isSigner: false, isWritable: false },
    ];

    const data = encodeInstructionData(CreateProtocol, {
      slots_in_days: new BN(params.slotsInDays),
      viability_ttl: new BN(params.viabilityTtl),
      nonce: params.nonce,
    });

    return new TransactionInstruction({
      keys,
      data,
      programId: params.programId,
    });
  }

  static setProtocolFeeTiers(
    params: SetProtocolFeeTiers,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [write(params.protocol), read(params.owner)];

    const programId = params.programId;

    const data = encodeInstructionData(WriteFeeTable, {
      ...params.feeTiersTable,
    });

    return new TransactionInstruction({ keys, programId, data });
  }

  static createProtocolAsset(params: CreateProtocolAssetInstructionParams) {
    const keys: AccountMeta[] = [
      { pubkey: params.protocol, isSigner: false, isWritable: true },
      { pubkey: params.owner, isSigner: true, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: params.tokenProgramId, isSigner: false, isWritable: false },
      { pubkey: params.dexProgramId, isSigner: false, isWritable: false },
      { pubkey: params.dexMarket, isSigner: false, isWritable: false },
      { pubkey: params.protocolAsset, isSigner: false, isWritable: true },
      { pubkey: params.feeVault, isSigner: false, isWritable: true },
      { pubkey: params.rebateVault, isSigner: false, isWritable: true },
      { pubkey: params.assetAuthority, isSigner: false, isWritable: true },
      { pubkey: params.lendPendingSettles, isSigner: false, isWritable: true },
    ];

    for (const token of ['native', 'oxyToken', 'debtToken', 'futureToken']) {
      const assetToken = params[token] as AssetToken;
      keys.push(read(assetToken.mint));
      keys.push(read(assetToken.vault));
    }

    if (params.baseCurrencyDexMarket)
      keys.push(read(params.baseCurrencyDexMarket));

    const data = encodeInstructionData(CreateProtocolAsset, params.data);

    return new TransactionInstruction({
      keys,
      data,
      programId: params.programId,
    });
  }

  static updateAssetPrice(
    params: UpdateAssetPriceInstructionParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      write(params.asset),
      read(params.market),
      read(params.bids),
      read(params.asks),
    ];

    const data = encodeInstructionData(UpdateProtocolAssetPrice, {});

    return new TransactionInstruction({
      keys,
      data,
      programId: params.programId,
    });
  }

  static createPool(
    params: CreatePoolInstructionParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(SYSVAR_RENT_PUBKEY),
      sign(params.owner),
      write(params.pool),
    ];

    const data = encodeInstructionData(CreatePool, {
      nonce: params.nonce,
    });

    return new TransactionInstruction({
      keys,
      data,
      programId: params.programId,
    });
  }

  static createPoolWallet(
    params: CreatePoolWalletInstructionParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(SYSVAR_RENT_PUBKEY),
      read(params.tokenProgramId),
      write(params.pool),
      sign(params.owner),
      read(params.poolAuthority),
      read(params.asset),
      write(params.wallet),
    ];

    for (let i = 0; i < params.tokens.length; i++) {
      const token: AssetToken = params.tokens[i];
      keys.push(write(token.vault));
      keys.push(write(token.mint));
    }

    const data = encodeInstructionData(CreatePoolWallet, {});
    const programId = params.programId;

    return new TransactionInstruction({ keys, data, programId });
  }

  static attachWalletToMarket(
    params: AttachPoolWalletToMarketParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(params.lendingProgramId),
      write(params.pool),
      sign(params.owner),
      read(params.asset),
      write(params.wallet),
      read(params.lendOpenOrders),
      read(params.borrowOpenOrders),
      write(params.lendAgreements),
      write(params.borrowAgreements),
    ];

    const data = encodeInstructionData(AttachPoolWalletToMarket, {});

    const programId = params.programId;

    return new TransactionInstruction({ keys, data, programId });
  }

  static depositToPool(params: DepositToPoolParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(params.tokenProgramId),
      write(params.pool),
      read(params.asset),
      read(params.assetAuthority),
      write(params.wallet),
      write(params.fromNativeAccount),
      sign(params.owner),
      write(params.assetNativeVault),
      write(params.assetOxyMint),
      write(params.walletOxy),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(DepositToPool, {
      amount: params.amount,
    });

    return new TransactionInstruction({ keys, programId, data });
  }

  static withdrawFromPool(
    params: WithdrawFromPoolParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(params.tokenProgramId),
      write(params.pool),
      sign(params.owner),
      read(params.poolAuthority),
      read(params.asset),
      read(params.assetAuthority),
      write(params.wallet),
      write(params.assetNativeVault),
      write(params.toNativeAccount),
      write(params.assetOxyMint),
      write(params.walletOxy),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(WithdrawFromPool, {
      amount: params.amount,
    });

    return new TransactionInstruction({ keys, programId, data });
  }

  static setPoolLendRate(params: SetPoolLendRateParam): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      write(params.pool),
      sign(params.poolOwner),
      read(params.asset),
      write(params.wallet),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(ChangePoolLentAutoRate, {
      rate: params.rate,
      lent_out_pct: params.lentOutPct,
    });

    return new TransactionInstruction({ keys, programId, data });
  }

  static accounting(params: AccountingParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      write(params.pool),
      sign(params.accounter),
      write(params.accounting),
    ];

    for (const step of params.steps) {
      keys.push(write(step.asset));
      keys.push(read(step.wallet));
    }

    const programId = params.programId;

    const data = encodeInstructionData(PoolAccounting, {});

    return new TransactionInstruction({ keys, data, programId });
  }

  static lend(params: LendParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(SYSVAR_RENT_PUBKEY),
      read(params.tokenProgramId),
      read(params.dexProgramId),
      write(params.pool),
      read(params.poolAuthority),
      read(params.protocolAsset),
      write(params.poolWallet),
      write(params.dexMarket),
      write(params.dexMarketRequestQueue),
      write(params.dexMarketEventQueue),
      write(params.dexMarketBids),
      write(params.dexMarketAsks),
      write(params.dexMarketOpenOrders),
      write(params.dexMarketCoinVault),
      write(params.dexMarketPriceVault),
      write(params.poolOxyWallet),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(LendPoolAssetField, {});

    return new TransactionInstruction({ keys, data, programId });
  }

  static borrow(params: BorrowParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(SYSVAR_RENT_PUBKEY),
      read(params.tokenProgramId),
      read(params.dexProgramId),

      write(params.pool),
      sign(params.poolOwner),
      write(params.poolAuthority),

      read(params.protocolAsset),
      read(params.protocolAssetAuthority),
      write(params.poolWallet),

      write(params.dexMarket),
      write(params.dexMarketRequestQueue),
      write(params.dexMarketEventQueue),
      write(params.dexMarketBids),
      write(params.dexMarketAsks),
      write(params.dexMarketOpenOrders),
      write(params.dexMarketCoinVault),
      write(params.dexMarketPriceVault),
      write(params.poolWalletFuture),
      write(params.protocolFutureMint),
    ];

    const data = encodeInstructionData(BorrowingAsset, {
      amount: params.amount,
      rate: params.rate,
    });

    const programId = params.programId;

    return new TransactionInstruction({ keys, data, programId });
  }

  static consumeEvents(params: {
    programId: PublicKey;
    protocol: PublicKey;
    asset: PublicKey;
    lendPendingSettles: PublicKey;
    lendProgramId: PublicKey;
    lendMarket: PublicKey;
    lendMarketEventQueue: PublicKey;
    lendMarketCoinVault: PublicKey;
    lendMarketPriceVault: PublicKey;
    wallets: PublicKey[];
    orders: PublicKey[];
    limit: number;
    ordersIdx: { lend: number; borrow: number }[];
  }): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(params.asset),
      write(params.lendPendingSettles),
      write(params.lendMarket),
      write(params.lendMarketEventQueue),
      write(params.lendMarketCoinVault),
      write(params.lendMarketPriceVault),
      read(params.lendProgramId),
      ...params.wallets.map((wallet) => write(wallet)),
      ...params.orders.map((order) => write(order)),
    ];

    const data = encodeInstructionData(ConsumeLendingDexEvents, {
      limit: params.limit,
      orders_idx: params.ordersIdx,
    });

    const programId = params.programId;

    return new TransactionInstruction({ keys, data, programId });
  }

  static settleBorrow(params: SettleBorrowParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(params.tokenProgramId),
      read(params.dexProgramId),

      write(params.pool),
      read(params.poolAuthority),
      read(params.protocolAsset),
      read(params.protocolAssetAuthority),
      write(params.lendPendingSettles),
      write(params.poolWallet),
      write(params.poolWalletAgreement),

      write(params.dexMarket),
      write(params.dexMarketOpenOrders),
      write(params.dexMarketCoinVault),
      write(params.dexMarketPriceVault),
      read(params.dexMarketAuthority),

      write(params.protocolOxyVault),
      write(params.poolWalletOxy),
      write(params.protocolFutureMint),
      write(params.poolWalletFuture),
      write(params.protocolDebtMint),
      write(params.poolWalletDebt),
    ];

    const data = encodeInstructionData(PoolBorrowSettle, {});

    const programId = params.programId;

    return new TransactionInstruction({ keys, data, programId });
  }

  static settleLend(params: SettleLendParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(params.tokenProgramId),
      read(params.dexProgramId),

      write(params.pool),
      read(params.poolAuthority),
      read(params.protocolAsset),
      write(params.lendPendingSettles),
      write(params.poolWallet),
      write(params.poolWalletAgreement),

      write(params.dexMarket),
      write(params.dexMarketOpenOrders),
      write(params.dexMarketCoinVault),
      write(params.dexMarketPriceVault),
      read(params.dexMarketAuthority),

      write(params.protocolOxyVault),
      write(params.poolWalletOxy),
      write(params.poolWalletFuture),
    ];

    const data = encodeInstructionData(PoolLendSettle, {});
    const programId = params.programId;
    return new TransactionInstruction({ keys, data, programId });
  }

  static repaymentBorrow(
    params: RepaymentBorrowParams,
  ): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(params.tokenProgramId),

      write(params.pool),
      sign(params.poolOwner),
      read(params.poolAuthority),

      read(params.protocolAsset),
      write(params.poolWallet),
      write(params.poolWalletBorrowAgreement),

      write(params.protocolVaultOxy),
      write(params.poolWalletOxy),
      write(params.poolWalletDebt),
      write(params.protocolDebtMint),
      write(params.protocolFeeVault),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(PoolRepayment, {
      amount: params.amount,
    });

    return new TransactionInstruction({ keys, programId, data });
  }

  static clearingLend(params: LendClearingParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(params.tokenProgramId),

      write(params.pool),
      read(params.poolAuthority),
      read(params.protocolAsset),
      read(params.protocolAssetAuthority),

      write(params.poolWallet),
      write(params.poolWalletLendAgreement),
      write(params.protocolVaultOxy),
      write(params.poolWalletOxy),
      write(params.protocolFeeVault),
      write(params.protocolFutureMint),
      write(params.poolWalletFuture),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(PoolOneLendClearing, {});

    return new TransactionInstruction({ keys, data, programId });
  }

  static cancelLend(params: CancelLendsParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      write(params.dexProgramId),

      read(params.pool),
      sign(params.poolOwner),
      write(params.poolAuthority),

      read(params.protocolAsset),
      write(params.poolWallet),

      write(params.dexMarket),
      write(params.dexMarketEventQueue),
      write(params.dexMarketBids),
      write(params.dexMarketAsks),
      write(params.dexMarketOpenOrders),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(CancelLend, {
      limit: params.limit,
    });

    return new TransactionInstruction({ keys, data, programId });
  }

  static cancelBorrow(params: CancelBorrowsParams): TransactionInstruction {
    const keys: AccountMeta[] = [
      read(params.protocol),
      write(params.dexProgramId),

      read(params.pool),
      sign(params.poolOwner),
      write(params.poolAuthority),

      read(params.protocolAsset),
      write(params.poolWallet),

      write(params.dexMarket),
      write(params.dexMarketEventQueue),
      write(params.dexMarketBids),
      write(params.dexMarketAsks),
      write(params.dexMarketOpenOrders),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(CancelBorrow, {
      limit: params.limit,
    });

    return new TransactionInstruction({ keys, data, programId });
  }

  static tradePlace(params: TradePlaceParams) {
    const keys: AccountMeta[] = [
      ...PrimeBrokerageInstructions.tradeHeaderAccounts(params),
      read(SYSVAR_RENT_PUBKEY),
      read(params.tokenProgramId),
      sign(params.poolOwner),
      write(params.quoteProtocolAsset),
      write(params.tradeNativeAssetProtocolAuthority),
      write(params.quotePoolWallet),
      write(params.dexMarketRequestQueue),
      write(params.dexMarketEventQueue),
      write(params.dexMarketBids),
      write(params.dexMarketAsks),
      write(params.dexMarketCoinVault),
      write(params.dexMarketPriceVault),
      write(params.tradeNativeAssetProtocolVault),
      write(params.tradedNativeAssetPoolVault),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(PoolTradePlace, params.data);

    return new TransactionInstruction({ keys, data, programId });
  }

  static tradeHeaderAccounts(params: TradeHeaderAccounts): AccountMeta[] {
    return [
      write(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      write(params.dexProgramId),
      write(params.pool),
      write(params.poolAuthority),
      write(params.protocolAsset),
      write(params.poolWallet),
      write(params.dexMarket),
      write(params.dexMarketOpenOrders),
    ];
  }

  static tradeCancel(params: TradeCancelParams) {
    const keys: AccountMeta[] = [
      ...PrimeBrokerageInstructions.tradeHeaderAccounts(params),
      sign(params.poolOwner),
      write(params.quoteProtocolAsset),
      write(params.dexMarketEventQueue),
      write(params.dexMarketBids),
      write(params.dexMarketAsks),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(PoolTradeCancel, params.data);

    return new TransactionInstruction({ keys, data, programId });
  }

  static tradeSettle(params: TradeSettleParams) {
    const keys: AccountMeta[] = [
      ...PrimeBrokerageInstructions.tradeHeaderAccounts(params),
      read(TOKEN_PROGRAM_ID),
      write(params.quoteProtocolAsset),
      write(params.dexMarketVaultSigner),
      write(params.dexMarketCoinVault),
      write(params.dexMarketPriceVault),
      write(params.tradeNativeBaseAssetAccount),
      write(params.tradeNativeQuoteAssetAccount),
      write(params.tradeNativeQuoteAssetRebateVault),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(PoolTradeSettle, {});

    return new TransactionInstruction({ keys, data, programId });
  }

  static tradeFinalizeSettle(params: TradeFinalizeSettleParams) {
    const keys: AccountMeta[] = [
      ...PrimeBrokerageInstructions.tradeHeaderAccounts(params),
      read(TOKEN_PROGRAM_ID),
      write(params.quoteProtocolAsset),
      write(params.quoteWallet),
      write(params.baseProtocolAssetAuthority),
      write(params.quoteProtocolAssetAuthority),

      write(params.tradeOxyBaseAssetAccount),
      write(params.tradeOxyBaseAssetMint),
      write(params.tradeNativeBaseAssetAccount),
      write(params.tradeNativeBaseAssetVault),

      write(params.tradeOxyQuoteAssetAccount),
      write(params.tradeOxyQuoteAssetMint),
      write(params.tradeNativeQuoteAssetAccount),
      write(params.tradeNativeQuoteAssetVault),
    ];

    const programId = params.programId;

    const data = encodeInstructionData(PoolTradeFinalizeSettle, {});

    return new TransactionInstruction({ keys, data, programId });
  }

  static liquidationInitialize(params: LiquidationInitializeParams) {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      write(params.pool),
      read(params.initialLiquidatorPool),
      sign(params.initialOwner),
    ];

    if (params.debtBook) {
      keys.push(read(params.debtBook));
    }

    const programId = params.programId;
    const data = encodeInstructionData(PoolLiquidationInitialize, {});
    return new TransactionInstruction({ keys, data, programId });
  }

  static liquidationSanitize(params: LiquidationSanitizeParams) {
    const keys: AccountMeta[] = [
      read(params.protocol),
      write(params.pool),
      read(SYSVAR_CLOCK_PUBKEY),
    ];

    for (const step of params.steps) {
      keys.push(
        ...[
          read(step.wallet),
          read(step.debtBook),
          read(step.lendOpenOrders),
          read(step.borrowOpenOrders),
        ],
      );
    }

    const programId = params.programId;
    const data = encodeInstructionData(PoolLiquidationSanitize, {});
    return new TransactionInstruction({ keys, data, programId });
  }

  static liquidationCollectOverdue(params: LiquidationCollectOverdueParams) {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      write(params.pool),
    ];

    for (const step of params.steps) {
      keys.push(...[read(step.asset), read(step.wallet), read(step.debtBook)]);
    }

    const programId = params.programId;
    const data = encodeInstructionData(PoolLiquidationCollectOverdue, {});
    return new TransactionInstruction({ keys, data, programId });
  }

  static liquidationCalculateAmounts(
    params: LiquidationCalculateAmountsParams,
  ) {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      write(params.pool),
    ];

    for (const step of params.steps) {
      keys.push(
        ...[
          read(step.asset),
          read(step.wallet),
          read(step.debtBook),
          read(step.oxyWallet),
        ],
      );
    }

    const programId = params.programId;
    const data = encodeInstructionData(PoolLiquidationCalculateAmounts, {});
    return new TransactionInstruction({ keys, data, programId });
  }

  static liquidationNetting(params: LiquidationNettingParams) {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(TOKEN_PROGRAM_ID),
      write(params.pool),
      read(params.poolAuthority),
      write(params.initialLiquidatorPool),
      write(params.initialLiquidatorState),
    ];

    for (const step of params.steps) {
      keys.push(
        ...[
          read(step.asset),
          write(step.wallet),
          write(step.debtBook),
          write(step.oxyVault),
          write(step.oxyWallet),
          write(step.debtMint),
          write(step.debtWallet),
        ],
      );
    }

    const programId = params.programId;
    const data = encodeInstructionData(PoolLiquidationNetting, {});
    return new TransactionInstruction({ keys, data, programId });
  }

  static liquidationProvide(params: LiquidationProvideParams) {
    type Arg = {
      wallet_index: number;
      amount: BN;
    };

    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(TOKEN_PROGRAM_ID),
      write(params.pool),
      read(params.borrowerAuthority),
      write(params.initialLiquidatorPool),
      write(params.liquidatorAuthority),
      write(params.liquidatorState),
    ];

    const args: Arg[] = [];

    for (const step of params.steps) {
      keys.push(
        ...[
          read(step.asset),
          write(step.borrowerWallet),
          write(step.debtBook),
          write(step.liquidatorWallet),
          write(step.liquidatorOxyWallet),
          write(step.oxyVault),
          write(step.debtMint),
          write(step.borrowerDebtWallet),
        ],
      );

      args.push({
        wallet_index: step.walletIndex,
        amount: step.amount,
      });
    }

    const programId = params.programId;

    const header = encodeInstructionData(PoolLiquidationProvideAndRepay, {
      count: args.length,
    });

    const assets = args.map((arg) => {
      const data = Buffer.alloc(ProvideValueAsset.span).fill(0);
      ProvideValueAsset.encode(arg, data);
      return data;
    });

    const data = Buffer.concat([header, ...assets]);

    return new TransactionInstruction({ keys, data, programId });
  }

  static liquidationSendCollateral(params: LiquidationSendCollateralParams) {
    const keys: AccountMeta[] = [
      read(params.protocol),
      read(SYSVAR_CLOCK_PUBKEY),
      read(TOKEN_PROGRAM_ID),
      write(params.pool),
      read(params.borrowerAuthority),
      read(params.liquidatorPool),
      write(params.liquidatorState),

      write(params.liquidatorWallet),
      write(params.liquidatorLendBook),
      write(params.liquidatorOxyWallet),
      write(params.liquidatorFutureWallet),

      write(params.borrowerWallet),
      write(params.borrowerLendBook),
      write(params.borrowerOxyWallet),
      write(params.borrowerFutureWallet),
    ];

    const programId = params.programId;
    const data = encodeInstructionData(PoolLiquidationSendCollateral, {});
    return new TransactionInstruction({ keys, data, programId });
  }
}
