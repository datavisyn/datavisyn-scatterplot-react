/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */

import {Quadtree, QuadtreeInternalNode, QuadtreeLeaf} from 'd3-quadtree';
import {shuffle} from 'd3-array';

export const ABORT_TRAVERSAL = true;
export const CONTINUE_TRAVERSAL = false;

/**
 * finds all data items in the tree within the given position, similar to d3.quadtree.find
 * @param tree
 * @param x
 * @param y
 * @param radius
 * @returns {Array}
 */
export function findAll<T>(tree:Quadtree<T>, x:number, y:number, radius = Infinity) {
  var r = [];
  const adder = r.push.bind(r);
  const radius2 = radius * radius;
  //bounding of search radius
  const overlapping = hasOverlap(x - radius, y - radius, x + radius, y + radius);

  function inDistance(x1:number, y1:number) {
    const dx = x1 - x;
    const dy = y1 - y;
    return (dx * dx + dy * dy) <= radius2;
  }

  function testAdder(d:T) {
    const x1 = tree.x()(d);
    const y1 = tree.y()(d);
    if (inDistance(x1, y1)) {
      adder(d);
    }
  }

  function findItems(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>, x0:number, y0:number, x1:number, y1:number) {
    const xy00In = inDistance(x0, y0);
    const xy01In = inDistance(x0, y1);
    const xy10In = inDistance(x1, y0);
    const xy11In = inDistance(x1, y1);

    if (xy00In && xy01In && xy10In && xy11In) {
      //all points in radius -> add all
      forEach(node, adder);
      return ABORT_TRAVERSAL;
    }

    if (overlapping(x0, y0, x1, y1)) {
      //continue search
      if (isLeafNode(node)) {
        forEachLeaf(node, testAdder);
      }
      return CONTINUE_TRAVERSAL;
    }
    return ABORT_TRAVERSAL;
  }

  tree.visit(findItems);

  return r;
}


export interface IBoundsPredicate {
  (x0:number, y0:number, x1:number, y1:number) : boolean;
}

export interface ITester {
  test(x:number, y:number): boolean;
  testArea: IBoundsPredicate;
}

/**
 * finds all items using a tester
 * @param tree
 * @param tester
 * @returns {Array}
 */
export function findByTester<T>(tree:Quadtree<T>, tester:ITester):T[] {
  var r = [];
  const adder = r.push.bind(r);

  function testAdder(d:T) {
    const x1 = tree.x()(d);
    const y1 = tree.y()(d);
    if (tester.test(x1, y1)) {
      adder(d);
    }
  }

  function findItems(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>, x0:number, y0:number, x1:number, y1:number) {
    const xy00In = tester.test(x0, y0);
    const xy01In = tester.test(x0, y1);
    const xy10In = tester.test(x1, y0);
    const xy11In = tester.test(x1, y1);

    if (xy00In && xy01In && xy10In && xy11In) {
      //all points in radius -> add all
      forEach(node, adder);
      return ABORT_TRAVERSAL;
    }

    if (tester.testArea(x0, y0, x1, y1)) {
      //continue search
      if (isLeafNode(node)) {
        forEachLeaf(<QuadtreeLeaf<T>>node, testAdder);
      }
      return CONTINUE_TRAVERSAL;
    }
    return ABORT_TRAVERSAL;
  }

  tree.visit(findItems);

  return r;
}

/**
 * execute the callback for each item in the leaf
 * @param node
 * @param callback
 * @returns {number}
 */
export function forEachLeaf<T>(node:QuadtreeLeaf<T>, callback:(d:T)=>void) {
  if (!node || !isLeafNode(node)) {
    return 0;
  }

  var i = 0;
  var leaf = node;
  //see https://github.com/d3/d3-quadtree
  do {
    let d = leaf.data;
    i++;
    callback(d);
  } while ((leaf = leaf.next) != null);
  return i;
}

/**
 * for each data item in the subtree execute the callback
 * @param node
 * @param callback
 */
export function forEach<T>(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>, callback:(d:T)=>void) {
  if (!node) {
    return;
  }
  if (isLeafNode(node)) {
    forEachLeaf(<QuadtreeLeaf<T>>node, callback);
  } else {
    //manually visit the children
    const inner = <QuadtreeInternalNode<T>>node;
    inner.forEach((i) => forEach(i, callback));
  }
}

export function hasOverlap(ox0:number, oy0:number, ox1:number, oy1:number):IBoundsPredicate {
  return (x0:number, y0:number, x1:number, y1:number) => {
    //if the 1er points are small than 0er or 0er bigger than 1er than outside
    if (x1 < ox0 || y1 < oy0 || x0 > ox1 || y0 > oy1) {
      return false;
    }
    //inside or partial overlap
    return true;
  };
}
/**
 * returns the data in the sub tree
 * @param node
 * @returns {Array}
 */
export function getTreeData<T>(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>):T[] {
  const r = [];
  forEach(node, r.push.bind(r));
  return r;
}
export function getTreeSize(node:QuadtreeInternalNode<any> | QuadtreeLeaf<any>) {
  var count = 0;
  forEach(node, () => count++);
  return count;
}

/**
 *
 * @see http://stackoverflow.com/questions/10134237/javascript-random-integer-between-two-numbers
 * @param min
 * @param max
 * @returns {number}
 */
function getRandomInt (min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * returns the first leaf node in the subtree
 * @param node
 * @returns {any}
 */
export function getFirstLeaf<T>(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>):T {
  if (isLeafNode(node)) {
    return (<QuadtreeLeaf<T>>node).data;
  } else {
    //manually visit the children
    const inner = <QuadtreeInternalNode<T>>node;
    return inner.reduce((f, act) => f ? f : getFirstLeaf(act), null);
  }
}

/**
 * returns a random leaf node in the subtree
 * @param node
 * @returns {any}
 */
export function getRandomLeaf<T>(node:QuadtreeInternalNode<T> | QuadtreeLeaf<T>):T {
  if (isLeafNode(node)) {
    let sub = getTreeData(node);
    return sub[getRandomInt(0, sub.length)];
  } else {
    //manually visit the children
    //shuffle the sub tree
    const inner = shuffle((<QuadtreeInternalNode<T>>node).slice());

    return inner.reduce((f, act) => f || !act ? f : getRandomLeaf(act), null);
  }
}

/**
 * checks whether the given node is a leaf node, as described in d3.quadtree docu
 * @param node
 * @returns {boolean}
 */
export function isLeafNode(node:QuadtreeInternalNode<any> | QuadtreeLeaf<any>) {
  return !(<any>node).length;
}
