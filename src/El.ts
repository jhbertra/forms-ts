import * as A from 'fp-ts/Array'
import { Eq, eqStrict, eqString } from 'fp-ts/Eq'
import { ReadonlyRecord } from 'fp-ts/ReadonlyRecord'
import { Show } from 'fp-ts/Show'
import { pipe } from 'fp-ts/lib/function'
import { ordString } from 'fp-ts/lib/Ord'
import { Semigroup } from 'fp-ts/lib/Semigroup'
import { Monoid } from 'fp-ts/lib/Monoid'

export type ElType = string | symbol
export type ElProps = ReadonlyRecord<string, any>

const fragSymbol = Symbol('fragment')

export interface Node<type = ElType> {
  readonly type: type
  readonly props: ElProps
  readonly children: Array<El>
}

export type El = string | Node

const flattenFrags = (el: El): Array<El> => {
  return isFrag(el) ? el.children : [el]
}

export const el = (type: ElType) => (props: ElProps) => (...children: Array<El>): El =>
  Object.freeze({
    type,
    props,
    children: children.flatMap(flattenFrags),
  })

export const frag = (...children: Array<El>): El => el(fragSymbol)({})(...children)
export const isFrag = (el: El): el is Node<symbol> => typeof el !== 'string' && el.type === fragSymbol

export const wrap = (type: ElType) => (props: ElProps) => (e: El) => el(type)(props)(e)

export const empty = frag()
export const concat = (el1: El) => (el2: El): El => frag(el1, el2)

export const showEl: Show<El> = {
  show(el) {
    if (typeof el === 'string') {
      return el
    }
    const elType = el.type.toString()
    return (
      '<' +
      elType +
      Object.entries(el.props).map(([key, val]) => ` ${key}={${val}}`) +
      '>' +
      el.children.map(showEl.show) +
      '</' +
      elType +
      '>'
    )
  },
}

export const eqEl: Eq<El> = {
  equals(a, b) {
    if (a === b) {
      return true
    }
    if (isFrag(a) && isFrag(b)) {
      return (
        a.children.length === b.children.length &&
        pipe(
          A.zipWith(a.children, b.children, eqEl.equals),
          A.reduce(true as boolean, (x, y) => x && y),
        )
      )
    }
    if (isFrag(a)) {
      return (
        a.children.length === 1 &&
        pipe(
          A.zipWith(a.children, [b], eqEl.equals),
          A.reduce(true as boolean, (x, y) => x && y),
        )
      )
    }
    if (isFrag(b)) {
      return (
        b.children.length === 1 &&
        pipe(
          A.zipWith([a], b.children, eqEl.equals),
          A.reduce(true as boolean, (x, y) => x && y),
        )
      )
    }
    if (typeof a === 'string' || typeof b === 'string') {
      return false
    }
    const aProps = A.sort(ordString)(Object.keys(a))
    const bProps = A.sort(ordString)(Object.keys(b))
    const aPropValues = aProps.map((p) => a.props[p])
    const bPropValues = bProps.map((p) => b.props[p])

    return (
      a.type === b.type &&
      aProps.length === bProps.length &&
      pipe(
        A.zipWith(aProps, bProps, eqString.equals),
        A.reduce(true as boolean, (x, y) => x && y),
      ) &&
      pipe(
        A.zipWith(aPropValues, bPropValues, eqStrict.equals),
        A.reduce(true as boolean, (x, y) => x && y),
      ) &&
      a.children.length === b.children.length &&
      pipe(
        A.zipWith(a.children, b.children, eqEl.equals),
        A.reduce(true as boolean, (x, y) => x && y),
      )
    )
  },
}

export const semigroupEl: Semigroup<El> = {
  concat: (a, b) => concat(a)(b),
}

export const monoidEl: Monoid<El> = {
  ...semigroupEl,
  empty,
}
