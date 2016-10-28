/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */
import { Quadtree, QuadtreeInternalNode, QuadtreeLeaf } from 'd3-quadtree';
export declare const ABORT_TRAVERSAL: boolean;
export declare const CONTINUE_TRAVERSAL: boolean;
/**
 * finds all data items in the tree within the given position, similar to d3.quadtree.find
 * @param tree
 * @param x
 * @param y
 * @param radius
 * @returns {Array}
 */
export declare function findAll<T>(tree: Quadtree<T>, x: number, y: number, radius?: number): any[];
export interface IBoundsPredicate {
    (x0: number, y0: number, x1: number, y1: number): boolean;
}
export interface ITester {
    test(x: number, y: number): boolean;
    testArea: IBoundsPredicate;
}
/**
 * finds all items using a tester
 * @param tree
 * @param tester
 * @returns {Array}
 */
export declare function findByTester<T>(tree: Quadtree<T>, tester: ITester): T[];
/**
 * execute the callback for each item in the leaf
 * @param node
 * @param callback
 * @returns {number}
 */
export declare function forEachLeaf<T>(node: QuadtreeLeaf<T>, callback: (d: T) => void): number;
/**
 * for each data item in the subtree execute the callback
 * @param node
 * @param callback
 */
export declare function forEach<T>(node: QuadtreeInternalNode<T> | QuadtreeLeaf<T>, callback: (d: T) => void): void;
export declare function hasOverlap(ox0: number, oy0: number, ox1: number, oy1: number): IBoundsPredicate;
/**
 * returns the data in the sub tree
 * @param node
 * @returns {Array}
 */
export declare function getTreeData<T>(node: QuadtreeInternalNode<T> | QuadtreeLeaf<T>): T[];
export declare function getTreeSize(node: QuadtreeInternalNode<any> | QuadtreeLeaf<any>): number;
/**
 * returns the first leaf node in the subtree
 * @param node
 * @returns {any}
 */
export declare function getFirstLeaf<T>(node: QuadtreeInternalNode<T> | QuadtreeLeaf<T>): T;
/**
 * returns a random leaf node in the subtree
 * @param node
 * @returns {any}
 */
export declare function getRandomLeaf<T>(node: QuadtreeInternalNode<T> | QuadtreeLeaf<T>): T;
/**
 * checks whether the given node is a leaf node, as described in d3.quadtree docu
 * @param node
 * @returns {boolean}
 */
export declare function isLeafNode(node: QuadtreeInternalNode<any> | QuadtreeLeaf<any>): boolean;
