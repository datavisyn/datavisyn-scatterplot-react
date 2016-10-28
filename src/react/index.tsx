/**
 * author:  Samuel Gratzl
 * email:   samuel_gratzl@gmx.at
 * created: 2016-10-28T11:19:52.797Z
 */


import * as React from 'react';
import Impl from '..';
import merge from '../merge';
import {IScatterplotOptions} from '..';

/**
 * all scatterplot options and the data
 */
export interface IScatterplotProps<T> extends IScatterplotOptions<T> {
  data: T[];
}

/**
 * just the selection
 */
export interface IScatterplotState<T> {
  selection: T[];
}

/**
 * scatterplot component wrapping the scatterplot implementation
 */
export default class Scatterplot<T> extends React.Component<IScatterplotProps<T>,IScatterplotState<T>> {
  private plot: Impl<T> = null;
  private parent: HTMLDivElement = null;

  private updatedByMe = false;

  constructor(props: IScatterplotProps<T>, context?: any) {
    super(props, context);

    this.state = {
      selection: [] as T[]
    };
  }

  componentDidMount() {
    //create impl
    var clone = merge({}, this.props);
    this.plot = new Impl(this.props.data, this.parent, merge(clone, {
      onSelectionChanged: () => {
        this.updatedByMe = true;
        //update my state and notify
        this.state.selection = this.plot.selection;
        this.props.onSelectionChanged();
      }
    }));
    this.plot.render();
  }

  shouldComponentUpdate(nextProps: IScatterplotProps<T>, nextState: IScatterplotState<T>) {
    //i changed the state to reflect the changes in the impl selection
    if (this.updatedByMe) {
      return false;
    }
    //check selection changes
    const new_ = this.state.selection;
    const old = nextState.selection;
    if (new_.length !== old.length) {
      return true;
    }
    return new_.some((d,i) => d !== old[i]);
  };

  componentDidUpdate() {
    this.updatedByMe = false;
    this.plot.render();
  }

  render() {
    return (
      <div ref={(div) => this.parent = div}>
      </div>
    );
  }
}

(Scatterplot as any).propTypes = {
  data: React.PropTypes.array.isRequired,
  onSelectionChanged: React.PropTypes.func
};

(Scatterplot as any).defaultProps = {
  data: [],
  onSelectionChanged: ()=>undefined
};
