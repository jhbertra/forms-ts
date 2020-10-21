import * as Eq from 'fp-ts/Eq'
import * as M from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import * as laws from './laws'
import * as FR from '../src/FormResult'
import { defaultArbFormResult } from './arbitrary'

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// properties
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

describe('properties of Form Result', () => {
  const eqFormResult = FR.getEq(Eq.eqString)
  const monoidFormResult = FR.getMonoid(O.getMonoid(M.monoidString))

  laws.eq(eqFormResult, defaultArbFormResult)
  laws.monoid(monoidFormResult, eqFormResult, defaultArbFormResult)
  laws.applicative(FR.Applicative)((a) => a.map(FR.of), FR.getEq)
  laws.alternative(FR.Alternative)((a) => a.map(FR.of), FR.getEq)
})
