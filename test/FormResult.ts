import * as Eq from 'fp-ts/Eq'
import * as M from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import * as laws from 'fp-ts-laws'
import * as FR from '../src/FormResult'
import { defaultArbFormResult } from './arbitrary'

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// properties
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

describe('laws', () => {
  const eqFormResult = FR.getEq(Eq.eqString)
  const monoidFormResult = FR.getMonoid(O.getMonoid(M.monoidString))

  it('satisfies Eq laws', () => {
    laws.eq(eqFormResult, defaultArbFormResult)
  })

  it('satisfies Monoid laws', () => {
    laws.monoid(monoidFormResult, eqFormResult, defaultArbFormResult)
  })

  it('satisfies Functor laws', () => {
    laws.functor(FR.Functor)((a) => a.map(FR.of), FR.getEq)
  })

  it('satisfies Applicative laws', () => {
    laws.applicative(FR.Applicative)((a) => a.map(FR.of), FR.getEq)
  })
})
