import * as fc from 'fast-check'
import * as Eq from 'fp-ts/Eq'
import * as M from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import * as laws from './laws'
import * as F from '../src/Form'
import * as FR from '../src/FormResult'
import prand from 'pure-rand'
import { defaultArbFormResult } from './arbitrary'

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// properties
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

describe('properties of Form', () => {
  const monoidForm = F.getMonoid(O.getMonoid(M.monoidString))
  const getFormEq = <I>(arbI: fc.Arbitrary<I>) => <A>(eqA: Eq.Eq<A>): Eq.Eq<F.Form<I, A>> => {
    const eqFormResult = FR.getEq(eqA)
    return {
      equals(a, b) {
        const i = arbI.generate(new fc.Random(prand.congruential(Math.random())))
        return eqFormResult.equals(a(i.value), b(i.value))
      },
    }
  }
  const eqForm = getFormEq(fc.string())(Eq.eqString)

  laws.monoid(monoidForm, eqForm, fc.func(defaultArbFormResult))
  laws.applicative(F.Applicative)<string>((a) => a.map(F.of), getFormEq(fc.string()))
  laws.alternative(F.Alternative)<string>((a) => a.map(F.of), getFormEq(fc.string()))
})
