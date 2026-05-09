import { interpolate } from './interpolate.js'

// Resolves dot-path key against a nested dictionary object.
function resolve(dict, key) {
  return key.split('.').reduce((node, segment) => {
    if (node && typeof node === 'object') return node[segment]
    return undefined
  }, dict)
}

/**
 * Creates a t(key, params?) translator bound to a dictionary.
 * Missing keys fall back to the key string in development.
 */
export function createTranslator(dictionary) {
  return function t(key, params) {
    const value = resolve(dictionary, key)
    if (value === undefined || value === null) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        return key
      }
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        return key
      }
      return key
    }
    if (typeof value !== 'string') return key
    return params ? interpolate(value, params) : value
  }
}
