import * as fc from 'fast-check'
import * as O from 'fp-ts/Option'

export const arbOption = <A>(value: fc.Arbitrary<A>): fc.Arbitrary<O.Option<A>> =>
  fc.oneof(fc.constant(O.none), value.map(O.some))
