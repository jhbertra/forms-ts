import * as fc from 'fast-check'
import * as Eq from 'fp-ts/Eq'
import * as M from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import * as Ord from 'fp-ts/Ord'
import * as FR from '../src/FormResult'
import { arbOption, eqLaws, ordLaws, monoidLaws, functor2Laws } from './util'

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// arbitrary
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const arbFormResult = <M, A>(meta: fc.Arbitrary<M>, value: fc.Arbitrary<A>) =>
  fc.record<FR.FormResult<M, A>>({
    meta,
    result: arbOption(value),
  })

const defaultArbFormResult = arbFormResult(fc.nat(3), fc.hexaString(2))
const arbF = fc.func<[string], number>(fc.nat())
const arbG = fc.func<[number], boolean>(fc.boolean())

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// properties
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

describe('laws', () => {
  const eqFormResult = FR.getEq(Eq.eqNumber, Eq.eqString)
  eqLaws(eqFormResult, defaultArbFormResult)

  const ordFormResult = FR.getOrd(Ord.ordNumber, Ord.ordString)
  ordLaws(ordFormResult, defaultArbFormResult)

  const monoidFormResult = FR.getMonoid(M.monoidSum, O.getMonoid(M.monoidString))
  monoidLaws(eqFormResult, monoidFormResult, defaultArbFormResult)

  const eqFormResultBoolean = FR.getEq(Eq.eqNumber, Eq.eqBoolean)
  functor2Laws<FR.URI, number, string, number, boolean>(
    eqFormResult,
    eqFormResultBoolean,
    FR.Functor,
    defaultArbFormResult,
    arbF,
    arbG,
  )
})
