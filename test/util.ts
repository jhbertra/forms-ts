import * as fc from 'fast-check'
import { Eq } from 'fp-ts/Eq'
import { identity, flow } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { URIS2, Kind2 } from 'fp-ts/HKT'
import { Monoid } from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import { Ord } from 'fp-ts/Ord'
import { Semigroup } from 'fp-ts/Semigroup'

export const arbOption = <A>(value: fc.Arbitrary<A>): fc.Arbitrary<O.Option<A>> =>
  fc.oneof(fc.constant(O.none), value.map(O.some))

export const eqLaws = <A>({ equals }: Eq<A>, r: fc.Arbitrary<A>) => {
  it('Satisfies: Eq:reflexive', () => fc.assert(fc.property(r, (a) => equals(a, a))))
  it('Satisfies: Eq:symmetric', () => fc.assert(fc.property(r, r, (a, b) => equals(a, b) === equals(b, a))))
  it('Satisfies: Eq:transitive', () =>
    fc.assert(fc.property(r, r, r, (a, b, c) => !equals(a, b) || !equals(b, c) || equals(a, c))))
}

export const ordLaws = <A>({ compare, equals }: Ord<A>, r: fc.Arbitrary<A>) => {
  it('Satisfies: Ord:reflexive', () => fc.assert(fc.property(r, (a) => compare(a, a) === 0)))
  it('Satisfies: Ord:antisymmetric', () =>
    fc.assert(fc.property(r, r, (a, b) => compare(a, b) !== 0 || compare(b, a) !== 0 || equals(a, b))))
  it('Satisfies: Ord:transitive', () =>
    fc.assert(fc.property(r, r, r, (a, b, c) => compare(a, b) > 0 || compare(b, c) > 0 || compare(a, c) <= 0)))
}

export const semigroupLaws = <A>({ equals }: Eq<A>, { concat }: Semigroup<A>, r: fc.Arbitrary<A>) => {
  it('Satisfies: Semigroup:associative', () =>
    fc.assert(fc.property(r, r, r, (a, b, c) => equals(concat(concat(a, b), c), concat(a, concat(b, c))))))
}

export const monoidLaws = <A>({ equals }: Eq<A>, { concat, empty }: Monoid<A>, r: fc.Arbitrary<A>) => {
  semigroupLaws({ equals }, { concat }, r)
  it('Satisfies: Monoid:rightIdentity', () => fc.assert(fc.property(r, (a) => equals(concat(a, empty), a))))
  it('Satisfies: Monoid:leftIdentity', () => fc.assert(fc.property(r, (a) => equals(concat(empty, a), a))))
}

export const functor2Laws = <URI extends URIS2, E, A, B, C>(
  { equals: eqFa }: Eq<Kind2<URI, E, A>>,
  { equals: eqFc }: Eq<Kind2<URI, E, C>>,
  { map }: Functor2<URI>,
  r: fc.Arbitrary<Kind2<URI, E, A>>,
  rf: fc.Arbitrary<(a: A) => B>,
  rg: fc.Arbitrary<(b: B) => C>,
) => {
  it('Satisfies: Functor:id', () => fc.assert(fc.property(r, (fa) => eqFa(map(fa, identity), fa))))
  it('Satisfies: Functor:composition', () =>
    fc.assert(fc.property(rf, rg, r, (f, g, fa) => eqFc(map(fa, flow(f, g)), map(map(fa, f), g)))))
}
