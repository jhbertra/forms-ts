import * as fc from 'fast-check'
import * as O from 'fp-ts/Option'
import { El, frag } from '../src/El'
import * as FR from '../src/FormResult'

export const arbOption = <A>(value: fc.Arbitrary<A>): fc.Arbitrary<O.Option<A>> =>
  fc.oneof(fc.constant(O.none), value.map(O.some))

export const arbNode = (children = true): fc.Arbitrary<El> =>
  fc.oneof(
    fc.record({
      children: children ? fc.array(fc.constant(undefined).chain(() => arbEl(false))) : fc.constant([]),
      props: fc.object({
        key: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f'),
        values: [fc.constantFrom(1, 2, 3, 4, 5, 6, 7, 8)],
      }),
      type: fc.constantFrom('div', 'p', 'h1', 'span', 'a'),
    }),
    (children ? fc.array(fc.constant(undefined).chain(() => arbEl(false))) : fc.constant([])).map((cs) => frag(...cs)),
  )

export const arbEl = (children = true): fc.Arbitrary<El> => fc.oneof(arbNode(children), fc.string())

export const arbFormResult = <A>(value: fc.Arbitrary<A>, view: fc.Arbitrary<El> = arbEl()) =>
  fc.record<FR.FormResult<A>>({
    view,
    result: arbOption(value),
  })

export const defaultArbFormResult = arbFormResult(fc.hexaString(2))
export const arbF = fc.func<[string], number>(fc.nat())
