import { Alt2 } from 'fp-ts/lib/Alt'
import { Alternative2C } from 'fp-ts/lib/Alternative'
import { Applicative2C } from 'fp-ts/lib/Applicative'
import { Apply2C } from 'fp-ts/lib/Apply'
import { Bifunctor2 } from 'fp-ts/lib/Bifunctor'
import { Chain2C } from 'fp-ts/lib/Chain'
import * as E from "fp-ts/lib/Either";
import { Eq } from 'fp-ts/lib/Eq'
import { Functor2 } from 'fp-ts/lib/Functor'
import { Monoid } from 'fp-ts/lib/Monoid'
import { Monad2C } from 'fp-ts/lib/Monad'
import * as O from "fp-ts/lib/Option";
import { Ord } from 'fp-ts/lib/Ord'
import { Semigroup } from 'fp-ts/lib/Semigroup'
import { Show } from 'fp-ts/lib/Show'
import { constant, flow, pipe } from "fp-ts/lib/function";
import { Lens, Optional, Prism } from "monocle-ts";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// model
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category model
 * @since 1.0.0
 */
export interface FormResult<M, A> {
  readonly meta: M;
  readonly result: O.Option<A>;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// constructors
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category constructors
 * @since 1.0.0
 */
export const make = <M>(meta: M) => <A>(result: O.Option<A>): FormResult<M, A> => Object.freeze({ meta, result });

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromMeta = <M, A = never>(meta: M) => make(meta)<A>(O.none);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Lenses
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const meta_ = Lens.fromProp<FormResult<any, any>>()('meta');
const result_ = Lens.fromProp<FormResult<any, any>>()('result');
const value_ = result_.composePrism(Prism.some());

/**
 * @category lenses
 * @since 1.0.0
 */
export const meta = <M, A = any>(): Lens<FormResult<M, A>, M> => meta_;

/**
 * @category lenses
 * @since 1.0.0
 */
export const result = <A, M = any>(): Lens<FormResult<M, A>, O.Option<A>> => result_;

/**
 * @category lenses
 * @since 1.0.0
 */
export const value = <A, M = any>(): Optional<FormResult<M, A>, A> => value_;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// combinators
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category combinators
 * @since 1.0.0
 */
export const zipWith = <M, N, O, A, B, C>(
  resultB: FormResult<N, B>,
  f: (m: M) => (n: N) => O,
  g: (a: A) => (b: B) => C,
) => (
  resultA: FormResult<M, A>,
): FormResult<O, C> =>
  make(
    f(resultA.meta)(resultB.meta),
  )(
    pipe(g, O.some, O.ap(resultA.result), O.ap(resultB.result)),
  );

/**
 * @category combinators
 * @since 1.0.0
 */
export const zip = <M, N, A, B>(resultB: FormResult<N, B>) => zipWith(
  resultB,
  (m: M) => (n) => [m, n] as const,
  (a: A) => (b) => [a, b] as const,
);

/**
 * @category combinators
 * @since 1.0.0
 */
export const parse = <M, N, E, A, B>(
  mergeMeta: (e?: E) => (m: M) => N,
  f: (a: A) => E.Either<E, B>,
) => (
  { result, meta }: FormResult<M, A>,
): FormResult<N, B> => pipe(
  result,
  O.fold(
    constant(make(mergeMeta()(meta))<B>(O.none)),
    flow(
      f,
      E.fold(
        (e) => make(mergeMeta(e)(meta))(O.none),
        (b) => make(mergeMeta()(meta))(O.some(b)),
      ),
    ),
  ),
);

/**
 * @category combinators
 * @since 1.0.0
 */
export const parseOpt = <M, N, E, A, B>(
  e: E,
  mergeMeta: (e?: E) => (m: M) => N,
  f: (a: A) => O.Option<B>,
) => parse(mergeMeta, flow(f, E.fromOption(constant(e))));

/**
 * @category combinators
 * @since 1.0.0
 */
export const refine = <M, N, E, A, B extends A>(
  e: E,
  mergeMeta: (e?: E) => (m: M) => N,
  f: (a: A) => a is B,
) => parseOpt(e, mergeMeta, O.fromPredicate(f));

/**
 * @category combinators
 * @since 1.0.0
 */
export const filter = <M, N, E, A>(
  e: E,
  mergeMeta: (e?: E) => (m: M) => N,
  f: (a: A) => boolean,
) => parseOpt(e, mergeMeta, O.fromPredicate(f));

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// non-pipeables
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const map_: Functor2<URI>['map'] = (fa, f) => pipe(fa, map(f));

const alt_: Alt2<URI>['alt'] = (me, that) => pipe(me, alt(that));

const bimap_: Bifunctor2<URI>['bimap'] = (fea, f, g) => pipe(fea, bimap(f, g));

const mapLeft_: Bifunctor2<URI>['mapLeft'] = (fea, f) => pipe(fea, mapLeft(f));

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// pipeables
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @category Functor
 * @since 1.0.0
 */
export const map = <A, B>(
  f: (a: A) => B,
) => <M>(
  result: FormResult<M, A>,
): FormResult<M, B> => make(result.meta)(pipe(result.result, O.map(f)));

/**
 * @category Alt
 * @since 1.0.0
 */
export const alt = <M, A>(that: () => FormResult<M, A>) => (me: FormResult<M, A>): FormResult<M, A> =>
  me.result._tag === 'None' ? that() : me;

/**
 * @category Bifunctor
 * @since 1.0.0
 */
export const bimap = <M, N, A, B>(
  f: (m: M) => N,
  g: (a: A) => B,
) => (
  result: FormResult<M, A>,
): FormResult<N, B> => make(f(result.meta))(pipe(result.result, O.map(g)));

/**
 * @category Bifunctor
 * @since 1.0.0
 */
export const mapLeft = <M, N>(
  f: (a: M) => N,
) => <A>(
  result: FormResult<M, A>,
): FormResult<N, A> => make(f(result.meta))(result.result);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// instances
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export const URI = 'forms-ts/FormResult';

export type URI = typeof URI;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: FormResult<E, A>;
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getShow<M, A>(Sm: Show<M>, Sa: Show<A>): Show<FormResult<M, A>> {
  const Soa = O.getShow(Sa);
  return {
    show: ({ meta, result }) => `FormResult { meta: ${Sm.show(meta)}, result: ${Soa.show(result)} }`,
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getEq<M, A>(Em: Eq<M>, Ea: Eq<A>): Eq<FormResult<M, A>> {
  const Eoa = O.getEq(Ea);
  return {
    equals: (x, y) => x === y || Em.equals(x.meta, y.meta) && Eoa.equals(x.result, y.result),
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getOrd<M, A>(Om: Ord<M>, Oa: Ord<A>): Ord<FormResult<M, A>> {
  const Ooa = O.getOrd(Oa);
  return {
    ...getEq(Om, Oa),
    compare: (x, y) => x === y ? 0 : Om.compare(x.meta, y.meta) || Ooa.compare(x.result, y.result),
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getSemigroup<M, A>(Sm: Semigroup<M>, Soa: Semigroup<O.Option<A>>): Semigroup<FormResult<M, A>> {
  return {
    concat: (a, b) => make(Sm.concat(a.meta, b.meta))(Soa.concat(a.result, b.result)),
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getMonoid<M, A>(Mm: Monoid<M>, Moa: Monoid<O.Option<A>>): Monoid<FormResult<M, A>> {
  return {
    ...getSemigroup(Mm, Moa),
    concat: (a, b) => make(Mm.concat(a.meta, b.meta))(Moa.concat(a.result, b.result)),
    empty: make(Mm.empty)(Moa.empty),
  };
}

export const Functor: Functor2<URI> = {
  URI,
  map: map_,
};

export const Bifunctor: Bifunctor2<URI> = {
  URI,
  bimap: bimap_,
  mapLeft: mapLeft_,
};

export const Alt: Alt2<URI> = {
  ...Functor,
  alt: alt_,
};

/**
 * @category instances
 * @since 1.0.0
 */
export function getApply<M>(Mm: Monoid<M>): Apply2C<URI, M> {
  return {
    ...Alt,
    _E: Mm.empty,
    ap: (fab, fa) => pipe(
      fab,
      zipWith(
        fa,
        (m) => (n) => Mm.concat(m, n),
        (ab) => (a) => ab(a),
      ),
    ),
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getApplicative<M>(Mm: Monoid<M>): Applicative2C<URI, M> {
  return {
    ...getApply(Mm),
    of: flow(O.some, make(Mm.empty)),
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getChain<M>(Mm: Monoid<M>): Chain2C<URI, M> {
  return {
    ...getApply(Mm),
    chain: (fa, f) => pipe(
      fa.result,
      O.fold(() => fromMeta(fa.meta), f),
    ),
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getMonad<M>(Mm: Monoid<M>): Monad2C<URI, M> {
  return {
    ...getApplicative(Mm),
    ...getChain(Mm),
  };
}

/**
 * @category instances
 * @since 1.0.0
 */
export function getAlternative<M>(Mm: Monoid<M>): Alternative2C<URI, M> {
  return {
    ...Alt,
    ...getApplicative(Mm),
    zero: () => make(Mm.empty)(O.none) as any,
  };
}
