import * as E from 'fp-ts/lib/Either'
import { Eq } from 'fp-ts/lib/Eq'
import { Functor1 } from 'fp-ts/lib/Functor'
import { Monoid } from 'fp-ts/lib/Monoid'
import * as O from 'fp-ts/lib/Option'
import { Semigroup } from 'fp-ts/lib/Semigroup'
import { Show } from 'fp-ts/lib/Show'
import { constant, flow, Lazy, pipe } from 'fp-ts/lib/function'
import { Lens, Optional, Prism } from 'monocle-ts'
import { concat, El, eqEl, monoidEl, semigroupEl, showEl } from './El'
import { Apply1 } from 'fp-ts/lib/Apply'
import { Applicative1 } from 'fp-ts/lib/Applicative'
import { Alt1 } from 'fp-ts/lib/Alt'
import { Alternative1 } from 'fp-ts/lib/Alternative'

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// model
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category model
 * @since 1.0.0
 */
export interface FormResult<A> {
  readonly view: El
  readonly result: O.Option<A>
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// constructors
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category constructors
 * @since 1.0.0
 */
export const make = (view: El) => <A>(result: O.Option<A>): FormResult<A> => Object.freeze({ view, result })

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromView = <A = never>(view: El) => make(view)<A>(O.none)

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Lenses
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const view_ = Lens.fromProp<FormResult<any>>()('view')
const result_ = Lens.fromProp<FormResult<any>>()('result')
const value_ = result_.composePrism(Prism.some())

/**
 * @category lenses
 * @since 1.0.0
 */
export const view = <A = any>(): Lens<FormResult<A>, El> => view_

/**
 * @category lenses
 * @since 1.0.0
 */
export const result = <A>(): Lens<FormResult<A>, O.Option<A>> => result_

/**
 * @category lenses
 * @since 1.0.0
 */
export const value = <A>(): Optional<FormResult<A>, A> => value_

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// combinators
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category combinators
 * @since 1.0.0
 */
export const parse = <E, A, B>(errorView: (e: E) => El, f: (a: A) => E.Either<E, B>) => ({
  result,
  view,
}: FormResult<A>): FormResult<B> =>
  pipe(
    result,
    O.fold(
      constant(make(view)<B>(O.none)),
      flow(
        f,
        E.fold(
          (e) => make(concat(view)(errorView(e)))(O.none),
          (b) => make(view)(O.some(b)),
        ),
      ),
    ),
  )

/**
 * @category combinators
 * @since 1.0.0
 */
export const parseOpt = <E, A, B>(e: E, errorView: (e: E) => El, f: (a: A) => O.Option<B>) =>
  parse(errorView, flow(f, E.fromOption(constant(e))))

/**
 * @category combinators
 * @since 1.0.0
 */
export const filter = <E, A, B extends A>(e: E, errorView: (e: E) => El, f: (a: A) => a is B) =>
  parseOpt(e, errorView, O.fromPredicate(f))

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// non-pipeables
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const map_: Functor1<URI>['map'] = (fa, f) => pipe(fa, map(f))

const ap_: Apply1<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))

const alt_: Alt1<URI>['alt'] = (a, b) => pipe(a, alt(b))

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// pipeables
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category Functor
 * @since 1.0.0
 */
export const map = <A, B>(f: (a: A) => B) => (result: FormResult<A>): FormResult<B> =>
  make(result.view)(pipe(result.result, O.map(f)))

/**
 * @category Apply
 * @since 1.0.0
 */
export const ap = <A>(fa: FormResult<A>) => <B>(fab: FormResult<(a: A) => B>): FormResult<B> =>
  make(semigroupEl.concat(fab.view, fa.view))(pipe(fab.result, O.ap(fa.result)))

/**
 * @category Alt
 * @since 1.0.0
 */
export const alt = <A>(b: Lazy<FormResult<A>>) => (a: FormResult<A>): FormResult<A> => (O.isSome(a.result) ? a : b())

/**
 * @category Applicative
 * @since 1.0.0
 */
export const of = <A>(a: A): FormResult<A> => make(monoidEl.empty)(O.some(a))

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// instances
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export const URI = 'forms-ts/FormResult'

export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: FormResult<A>
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getShow<A>(Sa: Show<A>): Show<FormResult<A>> {
  const Soa = O.getShow(Sa)
  return {
    show: ({ view, result }) => `FormResult { view: ${showEl.show(view)}, result: ${Soa.show(result)} }`,
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getEq<A>(Ea: Eq<A>): Eq<FormResult<A>> {
  const Eoa = O.getEq(Ea)
  return {
    equals: (x, y) => x === y || (eqEl.equals(x.view, y.view) && Eoa.equals(x.result, y.result)),
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getSemigroup<A>(Soa: Semigroup<O.Option<A>>): Semigroup<FormResult<A>> {
  return {
    concat: (a, b) => make(semigroupEl.concat(a.view, b.view))(Soa.concat(a.result, b.result)),
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getMonoid<A>(Moa: Monoid<O.Option<A>>): Monoid<FormResult<A>> {
  return {
    ...getSemigroup(Moa),
    empty: make(monoidEl.empty)(Moa.empty),
  }
}

export const Functor: Functor1<URI> = {
  URI,
  map: map_,
}

export const Apply: Apply1<URI> = {
  ...Functor,
  ap: ap_,
}

export const Alt: Alt1<URI> = {
  ...Apply,
  alt: alt_,
}

export const Applicative: Applicative1<URI> = {
  ...Apply,
  of,
}

export const Alternative: Alternative1<URI> = {
  ...Applicative,
  alt: alt_,
  zero: <A>() => make(monoidEl.empty)<A>(O.none),
}
