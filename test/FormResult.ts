import * as fc from 'fast-check'
import * as E from 'fp-ts/Either'
import * as Eq from 'fp-ts/Eq'
import * as M from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import * as laws from './laws'
import * as FR from '../src/FormResult'
import { arbEl, arbOption, defaultArbFormResult } from './arbitrary'
import { concat, El, eqEl, frag } from '../src/El'
import { constant, flow, pipe } from 'fp-ts/lib/function'
import { showString } from 'fp-ts/lib/Show'

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

  it('satisfies law parse/view', () => {
    const parseView = <E, A, B>(e: (e: E) => El, v: A, r: FR.FormResult<B>): boolean =>
      eqEl.equals(FR.view().get(FR.parse(e, constant(E.right(v)))(r)), FR.view().get(r))

    const propParseView = fc.property(fc.func(arbEl()), fc.integer(), defaultArbFormResult, parseView)

    fc.assert(propParseView)
  })

  it('satisfies law parse/result', () => {
    const parseResult = <A>(eqA: Eq.Eq<A>) => <E, B>(e: (e: E) => El, v: A, r: FR.FormResult<B>): boolean =>
      O.getEq(eqA).equals(
        FR.result<A>().get(FR.parse(e, constant(E.right(v)))(r)),
        pipe(FR.result<B>().get(r), O.map(constant(v))),
      )

    const propParseView = fc.property(fc.func(arbEl()), fc.integer(), defaultArbFormResult, parseResult(Eq.eqNumber))

    fc.assert(propParseView)
  })

  it('satisfies law parse(fail)/view', () => {
    const parseFailView = <E, A>(e: (e: E) => El, v: E, r: FR.FormResult<A>): boolean =>
      eqEl.equals(FR.view().get(FR.parse(e, constant(E.left(v)))(r)), concat(FR.view().get(r))(e(v)))

    const propParseFailView = fc.property(
      fc.func(arbEl()),
      fc.string(),
      defaultArbFormResult.filter(flow(FR.result().get, O.isSome)),
      parseFailView,
    )

    fc.assert(propParseFailView)
  })

  it('satisfies law parse(fail)/result', () => {
    const parseFailResult = <A>(eqA: Eq.Eq<A>) => <E, B>(e: (e: E) => El, v: E, r: FR.FormResult<B>): boolean =>
      O.getEq(eqA).equals(FR.result<A>().get(FR.parse(e, constant(E.left(v)))(r)), O.none)

    const propParseView = fc.property(fc.func(arbEl()), fc.string(), defaultArbFormResult, parseFailResult(Eq.eqNumber))

    fc.assert(propParseView)
  })

  it('satisfies law parseOpt/view', () => {
    const parseOptView = <E, A, B>(e: E, ev: (e: E) => El, v: A, r: FR.FormResult<B>): boolean =>
      eqEl.equals(FR.view().get(FR.parseOpt(e, ev, constant(O.some(v)))(r)), FR.view().get(r))

    const propParseOptView = fc.property(
      fc.string(),
      fc.func(arbEl()),
      fc.integer(),
      defaultArbFormResult,
      parseOptView,
    )

    fc.assert(propParseOptView)
  })

  it('satisfies law parseOpt/result', () => {
    const parseOptResult = <A>(eqA: Eq.Eq<A>) => <E, B>(e: E, ev: (e: E) => El, v: A, r: FR.FormResult<B>): boolean =>
      O.getEq(eqA).equals(
        FR.result<A>().get(FR.parseOpt(e, ev, constant(O.some(v)))(r)),
        pipe(FR.result<B>().get(r), O.map(constant(v))),
      )

    const propParseOptResult = fc.property(
      fc.string(),
      fc.func(arbEl()),
      fc.integer(),
      defaultArbFormResult,
      parseOptResult(Eq.eqNumber),
    )

    fc.assert(propParseOptResult)
  })

  it('satisfies law parseOpt(fail)/view', () => {
    const parseOptFailView = <E, A>(e: E, ev: (e: E) => El, r: FR.FormResult<A>): boolean =>
      eqEl.equals(FR.view().get(FR.parseOpt(e, ev, constant(O.none))(r)), concat(FR.view().get(r))(ev(e)))

    const propParseOptFailView = fc.property(
      fc.string(),
      fc.func(arbEl()),
      defaultArbFormResult.filter(flow(FR.result().get, O.isSome)),
      parseOptFailView,
    )

    fc.assert(propParseOptFailView)
  })

  it('satisfies law parseOpt(fail)/result', () => {
    const parseOptFailResult = <A>(eqA: Eq.Eq<A>) => <E, B>(e: E, ev: (e: E) => El, r: FR.FormResult<B>): boolean =>
      O.getEq(eqA).equals(FR.result<A>().get(FR.parseOpt(e, ev, constant(O.none))(r)), O.none)

    const propParseOptFailResult = fc.property(
      fc.string(),
      fc.func(arbEl()),
      defaultArbFormResult,
      parseOptFailResult(Eq.eqNumber),
    )

    fc.assert(propParseOptFailResult)
  })

  it('satisfies law filter/view', () => {
    const filterView = <E, A>(e: E, ev: (e: E) => El, r: FR.FormResult<A>): boolean =>
      eqEl.equals(FR.view().get(FR.filter<E, A, A>(e, ev, constant(true) as any)(r)), FR.view().get(r))

    const propFilterView = fc.property(fc.string(), fc.func(arbEl()), defaultArbFormResult, filterView)

    fc.assert(propFilterView)
  })

  it('satisfies law filter/result', () => {
    const filterResult = <B, A extends B>(eqA: Eq.Eq<A>) => <E>(e: E, ev: (e: E) => El, r: FR.FormResult<B>): boolean =>
      O.getEq(eqA).equals(
        FR.result<A>().get(FR.filter<E, B, A>(e, ev, constant(true) as any)(r)),
        FR.result<A>().get(r as any),
      )

    const propFilterResult = fc.property(fc.string(), fc.func(arbEl()), defaultArbFormResult, filterResult(Eq.eqString))

    fc.assert(propFilterResult)
  })

  it('satisfies law filter(fail)/view', () => {
    const filterFailView = <E, A>(e: E, ev: (e: E) => El, r: FR.FormResult<A>): boolean =>
      eqEl.equals(FR.view().get(FR.filter<E, A, A>(e, ev, constant(false) as any)(r)), concat(FR.view().get(r))(ev(e)))

    const propFilterFailView = fc.property(
      fc.string(),
      fc.func(arbEl()),
      defaultArbFormResult.filter(flow(FR.result().get, O.isSome)),
      filterFailView,
    )

    fc.assert(propFilterFailView)
  })

  it('satisfies law filter(fail)/result', () => {
    const filterFailResult = <B, A extends B>(eqA: Eq.Eq<A>) => <E>(
      e: E,
      ev: (e: E) => El,
      r: FR.FormResult<B>,
    ): boolean => O.getEq(eqA).equals(FR.result<A>().get(FR.filter<E, B, A>(e, ev, constant(false) as any)(r)), O.none)

    const propFilterFailResult = fc.property(
      fc.string(),
      fc.func(arbEl()),
      defaultArbFormResult,
      filterFailResult(Eq.eqString),
    )

    fc.assert(propFilterFailResult)
  })

  it('satisfies law view/get', () => {
    const viewGet = <A>(r: FR.FormResult<A>): boolean => eqEl.equals(r.view, FR.view().get(r))
    const prop = fc.property(defaultArbFormResult, viewGet)
    fc.assert(prop)
  })

  it('satisfies law view/set', () => {
    const viewSet = <A>(r: FR.FormResult<A>, el: El): boolean => eqEl.equals(el, FR.view().get(FR.view().set(el)(r)))
    const prop = fc.property(defaultArbFormResult, arbEl(), viewSet)
    fc.assert(prop)
  })

  it('satisfies law result/get', () => {
    const resultGet = <A>(eqA: Eq.Eq<A>) => (r: FR.FormResult<A>): boolean =>
      O.getEq(eqA).equals(r.result, FR.result<A>().get(r))
    const prop = fc.property(defaultArbFormResult, resultGet(Eq.eqString))
    fc.assert(prop)
  })

  it('satisfies law result/set', () => {
    const resultSet = <A>(eqA: Eq.Eq<A>) => (r: FR.FormResult<A>, oa: O.Option<A>): boolean =>
      O.getEq(eqA).equals(oa, FR.result<A>().get(FR.result<A>().set(oa)(r)))
    const prop = fc.property(defaultArbFormResult, arbOption(fc.string()), resultSet(Eq.eqString))
    fc.assert(prop)
  })

  it('satisfies law value/getOption', () => {
    const resultGetOption = <A>(eqA: Eq.Eq<A>) => (r: FR.FormResult<A>): boolean =>
      O.getEq(eqA).equals(r.result, FR.value<A>().getOption(r))
    const prop = fc.property(defaultArbFormResult, resultGetOption(Eq.eqString))
    fc.assert(prop)
  })

  it('satisfies law value/set', () => {
    const resultSet = <A>(eqA: Eq.Eq<A>) => (r: FR.FormResult<A>, a: A): boolean =>
      O.getEq(eqA).equals(pipe(r.result, O.map(constant(a))), FR.value<A>().getOption(FR.value<A>().set(a)(r)))
    const prop = fc.property(defaultArbFormResult, fc.string(), resultSet(Eq.eqString))
    fc.assert(prop)
  })

  it('satisfies law fromView/make', () => {
    const fromViewMake = (el: El): boolean => FR.getEq(Eq.eqStrict).equals(FR.fromView(el), FR.make(el)(O.none))
    const prop = fc.property(arbEl(), fromViewMake)
    fc.assert(prop)
  })
})

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// unit tests
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

describe('show instance', () => {
  it('correctly renders form results', () => {
    const fr = FR.make(frag())(O.some('test'))
    expect(FR.getShow(showString).show(fr)).toMatchInlineSnapshot(
      `"FormResult { view: <Symbol(fragment)></Symbol(fragment)>, result: some(\\"test\\") }"`,
    )
  })
})
