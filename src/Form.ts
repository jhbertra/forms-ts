import * as E from 'fp-ts/lib/Either'
import * as R from 'fp-ts/lib/Reader'
import { Functor2 } from 'fp-ts/lib/Functor'
import { Monoid } from 'fp-ts/lib/Monoid'
import * as O from 'fp-ts/lib/Option'
import { Semigroup } from 'fp-ts/lib/Semigroup'
import { constant, flow, Lazy, pipe } from 'fp-ts/lib/function'
import { Apply2 } from 'fp-ts/lib/Apply'
import { Applicative2 } from 'fp-ts/lib/Applicative'
import { Alt2 } from 'fp-ts/lib/Alt'
import { Alternative2 } from 'fp-ts/lib/Alternative'
import { Choice2 } from 'fp-ts/Choice'
import { Profunctor2 } from 'fp-ts/Profunctor'
import { Strong2 } from 'fp-ts/Strong'
import { El } from './El'
import * as FR from './FormResult'

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// model
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category model
 * @since 1.0.0
 */
export type Form<I, A> = R.Reader<I, FR.FormResult<A>>

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// constructors
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromView = <I = any, A = never>(view: El) => R.of<I, FR.FormResult<A>>(FR.fromView<A>(view))

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromResult = <A, I = any>(result: O.Option<A>) => R.of<I, FR.FormResult<A>>(FR.fromResult(result))
/**
 * @category constructors
 * @since 1.0.0
 */
export const fromFormResult = <A, I = any>(formResult: FR.FormResult<A>) => R.of<I, FR.FormResult<A>>(formResult)

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// combinators
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category combinators
 * @since 1.0.0
 */
export const parse = <E, A, B>(errorView: (e: E) => El, f: (a: A) => E.Either<E, B>) => R.map(FR.parse(errorView, f))

/**
 * @category combinators
 * @since 1.0.0
 */
export const parseOpt = <E, A, B>(e: E, errorView: (e: E) => El, f: (a: A) => O.Option<B>) =>
  R.map(FR.parseOpt(e, errorView, f))

/**
 * @category combinators
 * @since 1.0.0
 */
export const filter = <E, A, B extends A>(e: E, errorView: (e: E) => El, f: (a: A) => a is B) =>
  R.map(FR.filter(e, errorView, f))

/**
 * @category combinators
 * @since 1.0.0
 */
export const ask = flow(R.ask, R.map(FR.of))

/**
 * @category combinators
 * @since 1.0.0
 */
export const asks = flow(R.asks, R.map(FR.of))

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// non-pipeables
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const map_: Functor2<URI>['map'] = (fa, f) => pipe(fa, map(f))

const ap_: Apply2<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))

const alt_: Alt2<URI>['alt'] = (a, b) => pipe(a, alt(b))

const promap_: Profunctor2<URI>['promap'] = (fia, f, g) => pipe(fia, promap(f, g))

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// pipeables
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category Functor
 * @since 1.0.0
 */
export const map = flow(FR.map, R.map)

/**
 * @category Apply
 * @since 1.0.0
 */
export const ap = <I, A>(fa: Form<I, A>) => <B>(fab: Form<I, (a: A) => B>): Form<I, B> => (i) =>
  pipe(fab(i), FR.ap(fa(i)))

/**
 * @category Alt
 * @since 1.0.0
 */
export const alt = <I, A>(b: Lazy<Form<I, A>>) => (a: Form<I, A>): Form<I, A> => (i) =>
  pipe(
    a(i),
    FR.alt(() => b()(i)),
  )

/**
 * @category Applicative
 * @since 1.0.0
 */
export const of = flow(FR.of, R.of)

/**
 * @category Profunctor
 * @since 1.0.0
 */
export const promap = <I, J, A, B>(f: (j: J) => I, g: (a: A) => B) => R.promap(f, FR.map(g))

/**
 * @category Strong
 * @since 1.0.0
 */
const first: Strong2<URI>['first'] = (f) => ([i, c]) =>
  pipe(
    i,
    f,
    FR.map((a) => [a, c]),
  )

/**
 * @category Strong
 * @since 1.0.0
 */
const second: Strong2<URI>['second'] = (f) => ([c, i]) =>
  pipe(
    i,
    f,
    FR.map((a) => [c, a]),
  )

/**
 * @category Choice
 * @since 1.0.0
 */
const left: Choice2<URI>['left'] = (f) => E.fold(flow(f, FR.map(E.left)), (c) => FR.of(E.right(c)))

/**
 * @category Choice
 * @since 1.0.0
 */
const right: Choice2<URI>['right'] = (f) => E.fold((c) => FR.of(E.left(c)), flow(f, FR.map(E.right)))

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// instances
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export const URI = 'forms-ts/FormResult'

export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: Form<E, A>
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getSemigroup<I, A>(Soa: Semigroup<O.Option<A>>): Semigroup<Form<I, A>> {
  const semigroupFormResult = FR.getSemigroup(Soa)
  return {
    concat: (a, b) => (i) => semigroupFormResult.concat(a(i), b(i)),
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getMonoid<I, A>(Moa: Monoid<O.Option<A>>): Monoid<Form<I, A>> {
  const monoidFormResult = FR.getMonoid(Moa)
  return {
    ...getSemigroup(Moa),
    empty: fromFormResult(monoidFormResult.empty),
  }
}

export const Functor: Functor2<URI> = {
  URI,
  map: map_,
}

export const Apply: Apply2<URI> = {
  ...Functor,
  ap: ap_,
}

export const Alt: Alt2<URI> = {
  ...Apply,
  alt: alt_,
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  of,
}

export const Alternative: Alternative2<URI> = {
  ...Applicative,
  alt: alt_,
  zero: () => constant(FR.Alternative.zero()),
}

export const Profunctor: Profunctor2<URI> = {
  ...Functor,
  promap: promap_,
}

export const Strong: Strong2<URI> = {
  ...Profunctor,
  first,
  second,
}

export const Choice: Choice2<URI> = {
  ...Profunctor,
  left,
  right,
}
