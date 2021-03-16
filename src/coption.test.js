import { COptionU64, optional_u64 } from './types';
import { struct, u8, Structure} from 'buffer-layout';
import BN from 'bn.js';


test("encode", () => {
  const value = new BN(255);
  const layout = struct([optional_u64('rate')]);
  const buff = Buffer.alloc(layout.span);
  layout.encode({'rate': value}, buff);
  value.eq(layout.decode(buff));
})


