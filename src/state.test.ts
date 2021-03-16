import {
  PoolStateLayout,
  AgreementBookLayout,
  WalletStateLayout,
  ProtocolStateLayoutSize,
  AssetStateLayoutSize,
  PoolStateLayoutSize,
  WalletStateLayoutSize,
  AgreementBookLayoutSize,
  ViabilityStateLayout,
  ViabilityStateLayoutSize,
  LendPendingSettlesLayout,
  LendPendingSettlesLayoutSize,
} from './state';
import {AssetStateLayout} from './states/asset'
import {ProtocolStateLayout} from './states/protocol'
describe("StateLayouts", () => {
    test("Should check length", () => {
        expect(PoolStateLayout.span).toEqual(PoolStateLayoutSize);
        expect(ProtocolStateLayout.span).toEqual(ProtocolStateLayoutSize);
        expect(AssetStateLayout.span).toEqual(AssetStateLayoutSize);
        expect(WalletStateLayout.span).toEqual(WalletStateLayoutSize);
        expect(AgreementBookLayout.span).toEqual(AgreementBookLayoutSize);
        expect(ViabilityStateLayout.span).toEqual(ViabilityStateLayoutSize);
        expect(LendPendingSettlesLayout.span).toEqual(LendPendingSettlesLayoutSize);
    })
})
