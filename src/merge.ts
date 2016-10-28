/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */

/**
 * merges the second object into the first one
 * @param target
 * @param other
 * @returns {T}
 */
export default function merge<T>(target:T, other?:any) {
  if (other === undefined) {
    return target;
  }
  Object.keys(other).forEach((key) => {
    const v = other[key];
    if (Object.prototype.toString.call(v) === '[object Object]') {
      //nested
      target[key] = (target[key] != null) ? merge(target[key], v) : v;
    } else {
      target[key] = v;
    }
  });
  return target;
}
