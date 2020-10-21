import * as fc from 'fast-check'
import { Eq, eqBoolean, eqNumber, eqString } from 'fp-ts/Eq'
import { Functor, Functor1, Functor2, Functor2C, Functor3 } from 'fp-ts/Functor'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/HKT'
import { Apply, Apply1, Apply2, Apply2C, Apply3 } from 'fp-ts/Apply'
import { Applicative, Applicative1, Applicative2, Applicative2C, Applicative3 } from 'fp-ts/Applicative'
import { Ord } from 'fp-ts/Ord'
import { Semigroup } from 'fp-ts/Semigroup'
import { Monoid } from 'fp-ts/Monoid'
import { FunctionN } from 'fp-ts/function'
import { Alt, Alt1, Alt2, Alt2C, Alt3 } from 'fp-ts/Alt'
import { Alternative, Alternative1, Alternative2, Alternative2C, Alternative3 } from 'fp-ts/Alternative'

const eqLaws = {
  reflexivity: <A>(E: Eq<A>) => (a: A): boolean => {
    return E.equals(a, a)
  },
  simmetry: <A>(E: Eq<A>) => (a: A, b: A): boolean => {
    return E.equals(a, b) === E.equals(b, a)
  },
  transitivity: <A>(E: Eq<A>) => (a: A, b: A, c: A): boolean => {
    return (E.equals(a, b) && E.equals(b, c)) === (E.equals(a, b) && E.equals(a, c))
  },
}

export const eq = <A>(E: Eq<A>, arb: fc.Arbitrary<A>): void => {
  const reflexivity = fc.property(arb, eqLaws.reflexivity(E))
  const symmetry = fc.property(arb, arb, eqLaws.simmetry(E))
  const transitivity = fc.property(arb, arb, arb, eqLaws.transitivity(E))
  it('satisfies law Eq:reflexivity', () => fc.assert(reflexivity))
  it('satisfies law Eq:symmetry', () => fc.assert(symmetry))
  it('satisfies law Eq:transitivity', () => fc.assert(transitivity))
}

const ordLaws = {
  totality: <A>(O: Ord<A>) => (a: A, b: A): boolean => {
    return O.compare(a, b) <= 0 || O.compare(b, a) <= 0
  },
  reflexivity: <A>(O: Ord<A>) => (a: A): boolean => {
    return O.compare(a, a) <= 0
  },
  antisimmetry: <A>(O: Ord<A>) => (a: A, b: A): boolean => {
    return (O.compare(a, b) <= 0 && O.compare(b, a) <= 0) === O.equals(a, b)
  },
  transitivity: <A>(O: Ord<A>) => (a: A, b: A, c: A): boolean => {
    return !(O.compare(a, b) <= 0 && O.compare(b, c) <= 0) || O.compare(a, c) <= 0
  },
}

export const ord = <A>(O: Ord<A>, arb: fc.Arbitrary<A>): void => {
  eq(O, arb)
  const totality = fc.property(arb, arb, ordLaws.totality(O))
  const reflexivity = fc.property(arb, ordLaws.reflexivity(O))
  const antisymmetry = fc.property(arb, arb, ordLaws.antisimmetry(O))
  const transitivity = fc.property(arb, arb, arb, ordLaws.transitivity(O))
  it('satisfies law Ord:totality', () => fc.assert(totality))
  it('satisfies law Ord:reflexivity', () => fc.assert(reflexivity))
  it('satisfies law Ord:antisymmetry', () => fc.assert(antisymmetry))
  it('satisfies law Ord:transitivity', () => fc.assert(transitivity))
}

const semigroupLaws = {
  associativity: <A>(S: Semigroup<A>, E: Eq<A>) => (a: A, b: A, c: A): boolean => {
    return E.equals(S.concat(S.concat(a, b), c), S.concat(a, S.concat(b, c)))
  },
}

export const semigroup = <A>(S: Semigroup<A>, E: Eq<A>, arb: fc.Arbitrary<A>): void => {
  const associativity = fc.property(arb, arb, arb, semigroupLaws.associativity(S, E))
  it('satisfies law Semigroup:associativity', () => fc.assert(associativity))
}

const monoidLaws = {
  rightIdentity: <A>(M: Monoid<A>, E: Eq<A>) => (a: A): boolean => {
    return E.equals(M.concat(a, M.empty), a)
  },
  leftIdentity: <A>(M: Monoid<A>, E: Eq<A>) => (a: A): boolean => {
    return E.equals(M.concat(M.empty, a), a)
  },
}

export const monoid = <A>(M: Monoid<A>, E: Eq<A>, arb: fc.Arbitrary<A>): void => {
  semigroup(M, E, arb)
  const rightIdentity = fc.property(arb, monoidLaws.rightIdentity(M, E))
  const leftIdentity = fc.property(arb, monoidLaws.leftIdentity(M, E))
  it('satisfies law Monoid:rightIdentity', () => fc.assert(rightIdentity))
  it('satisfies law Monoid:leftIdentity', () => fc.assert(leftIdentity))
}

const functorLaws = {
  identity: <F, A>(F: Functor<F>, S: Eq<HKT<F, A>>) => (fa: HKT<F, A>): boolean => {
    return S.equals(
      F.map(fa, (a) => a),
      fa,
    )
  },
  composition: <F, A, B, C>(F: Functor<F>, S: Eq<HKT<F, C>>, ab: FunctionN<[A], B>, bc: FunctionN<[B], C>) => (
    fa: HKT<F, A>,
  ): boolean => {
    return S.equals(
      F.map(fa, (a) => bc(ab(a))),
      F.map(F.map(fa, ab), bc),
    )
  },
}

export function functor<F extends URIS3>(
  F: Functor3<F>,
): <U, L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind3<F, U, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind3<F, U, L, A>>,
) => void
export function functor<F extends URIS2>(
  F: Functor2<F>,
): <L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>,
) => void
export function functor<F extends URIS2, L>(
  F: Functor2C<F, L>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>) => void
export function functor<F extends URIS>(
  F: Functor1<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind<F, A>>) => void
export function functor<F>(
  F: Functor<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void
export function functor<F>(
  F: Functor<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void {
  return (lift, liftEq) => {
    const arb = lift(fc.string())
    const Sa = liftEq(eqString)
    const Sc = liftEq(eqNumber)
    const identity = fc.property(arb, functorLaws.identity(F, Sa))
    const ab = (s: string): number | undefined | null => (s.length === 1 ? undefined : s.length === 2 ? null : s.length)
    const bc = (n: number | undefined | null): number => (n === undefined ? 1 : n === null ? 2 : n * 2)

    const composition = fc.property(arb, functorLaws.composition(F, Sc, ab, bc))

    it('satisfies law Functor:identity', () => fc.assert(identity))
    it('satisfies law Functor:composition', () => fc.assert(composition))
  }
}

const applyLaws = {
  associativeComposition: <F, A, B, C>(F: Apply<F>, S: Eq<HKT<F, C>>) => (
    fa: HKT<F, A>,
    fab: HKT<F, FunctionN<[A], B>>,
    fbc: HKT<F, FunctionN<[B], C>>,
  ): boolean => {
    return S.equals(
      F.ap(
        F.ap(
          F.map(fbc, (bc) => (ab: FunctionN<[A], B>) => (a: A) => bc(ab(a))),
          fab,
        ),
        fa,
      ),
      F.ap(fbc, F.ap(fab, fa)),
    )
  },
}

export function apply<F extends URIS3>(
  F: Apply3<F>,
): <U, L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind3<F, U, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind3<F, U, L, A>>,
) => void
export function apply<F extends URIS2>(
  F: Apply2<F>,
): <L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>,
) => void
export function apply<F extends URIS2, L>(
  F: Apply2C<F, L>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>) => void
export function apply<F extends URIS>(
  F: Apply1<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind<F, A>>) => void
export function apply<F>(
  F: Apply<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void
export function apply<F>(
  F: Apply<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void {
  const functorF = functor(F)
  return (lift, liftEq) => {
    functorF(lift, liftEq)

    const Sc = liftEq(eqBoolean)
    const arbFa = lift(fc.string())
    const arbFab = lift(fc.constant((a: string) => a.length))
    const arbFbc = lift(fc.constant((b: number) => b > 2))
    const associativeComposition = fc.property(arbFa, arbFab, arbFbc, applyLaws.associativeComposition(F, Sc))

    it('satisfies law Apply:associativeComposition', () => fc.assert(associativeComposition))
  }
}

const applicativeLaws = {
  identity: <F, A>(F: Applicative<F>, S: Eq<HKT<F, A>>) => (fa: HKT<F, A>): boolean => {
    return S.equals(
      F.ap(
        F.of((a: A) => a),
        fa,
      ),
      fa,
    )
  },
  homomorphism: <F, A, B>(F: Applicative<F>, S: Eq<HKT<F, B>>, ab: FunctionN<[A], B>) => (a: A): boolean => {
    return S.equals(F.ap(F.of(ab), F.of(a)), F.of(ab(a)))
  },
  interchange: <F, A, B>(F: Applicative<F>, S: Eq<HKT<F, B>>) => (a: A, fab: HKT<F, FunctionN<[A], B>>): boolean => {
    return S.equals(
      F.ap(fab, F.of(a)),
      F.ap(
        F.of((ab: FunctionN<[A], B>) => ab(a)),
        fab,
      ),
    )
  },
  derivedMap: <F, A, B>(F: Applicative<F>, S: Eq<HKT<F, B>>, ab: FunctionN<[A], B>) => (fa: HKT<F, A>): boolean => {
    return S.equals(F.map(fa, ab), F.ap(F.of(ab), fa))
  },
}

export function applicative<F extends URIS3>(
  F: Applicative3<F>,
): <U, L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind3<F, U, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind3<F, U, L, A>>,
) => void
export function applicative<F extends URIS2>(
  F: Applicative2<F>,
): <L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>,
) => void
export function applicative<F extends URIS2, L>(
  F: Applicative2C<F, L>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>) => void
export function applicative<F extends URIS>(
  F: Applicative1<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind<F, A>>) => void
export function applicative<F>(
  F: Applicative<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void
export function applicative<F>(
  F: Applicative<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void {
  const applyF = apply(F)
  return (lift, liftEq) => {
    applyF(lift, liftEq)

    const arbFa = lift(fc.string())
    const Sa = liftEq(eqString)
    const Sb = liftEq(eqNumber)
    const identity = fc.property(arbFa, applicativeLaws.identity(F, Sa))
    const ab = (s: string) => s.length
    const homomorphism = fc.property(fc.string(), applicativeLaws.homomorphism(F, Sb, ab))
    const arbFab = lift(fc.constant(ab))
    const interchange = fc.property(fc.string(), arbFab, applicativeLaws.interchange(F, Sb))
    const derivedMap = fc.property(arbFa, applicativeLaws.derivedMap(F, Sb, ab))

    it('satisfies law Applicative:identity', () => fc.assert(identity))
    it('satisfies law Applicative:homomorphism', () => fc.assert(homomorphism))
    it('satisfies law Applicative:interchange', () => fc.assert(interchange))
    it('satisfies law Applicative:derivedMap', () => fc.assert(derivedMap))
  }
}

const altLaws = {
  associativity: <F, A>(F: Alt<F>, S: Eq<HKT<F, A>>) => (a: HKT<F, A>, b: HKT<F, A>, c: HKT<F, A>): boolean => {
    return S.equals(
      F.alt(
        F.alt(a, () => b),
        () => c,
      ),
      F.alt(a, () => F.alt(b, () => c)),
    )
  },
}

export function alt<F extends URIS3>(
  F: Alt3<F>,
): <U, L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind3<F, U, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind3<F, U, L, A>>,
) => void
export function alt<F extends URIS2>(
  F: Alt2<F>,
): <L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>,
) => void
export function alt<F extends URIS2, L>(
  F: Alt2C<F, L>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>) => void
export function alt<F extends URIS>(
  F: Alt1<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind<F, A>>) => void
export function alt<F>(
  F: Alt<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void
export function alt<F>(
  F: Alt<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void {
  const functorF = functor(F)
  return (lift, liftEq) => {
    functorF(lift, liftEq)

    const Sc = liftEq(eqString)
    const arbF = lift(fc.string())
    const associativity = fc.property(arbF, arbF, arbF, altLaws.associativity(F, Sc))

    it('satisfies law Alt:associativity', () => fc.assert(associativity))
  }
}

const alternativeLaws = {
  rightIdentity: <F, A>(F: Alternative<F>, E: Eq<HKT<F, A>>) => (a: HKT<F, A>): boolean => {
    return E.equals(
      F.alt(a, () => F.zero()),
      a,
    )
  },
  leftIdentity: <F, A>(F: Alternative<F>, E: Eq<HKT<F, A>>) => (a: HKT<F, A>): boolean => {
    return E.equals(
      F.alt(F.zero(), () => a),
      a,
    )
  },
}

export function alternative<F extends URIS3>(
  F: Alternative3<F>,
): <U, L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind3<F, U, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind3<F, U, L, A>>,
) => void
export function alternative<F extends URIS2>(
  F: Alternative2<F>,
): <L>(
  lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>,
  liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>,
) => void
export function alternative<F extends URIS2, L>(
  F: Alternative2C<F, L>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind2<F, L, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind2<F, L, A>>) => void
export function alternative<F extends URIS>(
  F: Alternative1<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<Kind<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<Kind<F, A>>) => void
export function alternative<F>(
  F: Alternative<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void
export function alternative<F>(
  F: Alternative<F>,
): (lift: <A>(a: fc.Arbitrary<A>) => fc.Arbitrary<HKT<F, A>>, liftEq: <A>(Sa: Eq<A>) => Eq<HKT<F, A>>) => void {
  const altF = alt(F)
  return (lift, liftEq) => {
    altF(lift, liftEq)

    const Sc = liftEq(eqString)
    const arbF = lift(fc.string())
    const rightIdentity = fc.property(arbF, alternativeLaws.rightIdentity(F, Sc))
    const leftIdentity = fc.property(arbF, alternativeLaws.leftIdentity(F, Sc))

    it('satisfies law Alternative:rightIdentity', () => fc.assert(rightIdentity))
    it('satisfies law Alternative:leftIdentity', () => fc.assert(leftIdentity))
  }
}
