
import {Quadtree, QuadtreeInternalNode, QuadtreeLeaf} from 'd3-quadtree';

export function findAll<T>(tree: Quadtree<T>, x: number, y: number, radius = Infinity) {
  const single = tree.find(x, y, radius);
  // TODO implement
  return single ? [single] : [];
}

export function forEach<T>(node: QuadtreeInternalNode<T> | QuadtreeLeaf<T>, callback: (d: T)=>void) {
  if (!node) {
    return;
  }
  if (isLeafNode(node)) {
    var leaf = <QuadtreeLeaf<T>>node;
      //see https://github.com/d3/d3-quadtree
      do {
        let d = leaf.data;
        callback(d);
      } while ((leaf = leaf.next) != null);
  } else {
   //manually visit the children
    const inner = <QuadtreeInternalNode<T>>node;
    forEach(inner[0], callback);
    forEach(inner[1], callback);
    forEach(inner[2], callback);
    forEach(inner[3], callback);
  }
}

export function isLeafNode(node: QuadtreeInternalNode<any> | QuadtreeLeaf<any>) {
  return !(<any>node).length
}
