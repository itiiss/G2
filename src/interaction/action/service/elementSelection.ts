import { bisectLeft } from 'd3-array';
import { G2Element, select } from '../../../utils/selection';
import { ActionComponent as AC } from '../../types';
import { ElementSelectionAction } from '../../../spec';

export type ElementSelectionOptions = Omit<ElementSelectionAction, 'type'>;

function getElementsByTriggerInfo(
  elements: G2Element[],
  scales: any,
  triggerInfo: any,
) {
  return elements.filter((element) => {
    const { __data__: data } = element;
    for (const item of triggerInfo) {
      const scale = scales[item.scaleType];
      if (scale && scale.invert(data[item.scaleType]) === item.id) return true;
    }
  });
}

export const ElementSelection: AC<ElementSelectionOptions> = (options) => {
  const { from, filterBy, trigger } = options;

  return (context) => {
    const { event, shared, selection, scale: scales, coordinate } = context;

    shared.selectedElements = [];
    const elements = selection.selectAll('.element').nodes();

    if (from === 'triggerInfo') {
      const { triggerInfo = [] } = shared;
      shared.selectedElements = getElementsByTriggerInfo(
        elements,
        scales,
        triggerInfo,
      );
    } else {
      const { target } = event;
      const { className } = target || {};
      if (className && className.includes('element')) {
        if (filterBy) {
          const { __data__: data } = select(target).node();
          selection.selectAll('.element').each(function (datum) {
            if (datum[filterBy] === data[filterBy]) {
              shared.selectedElements.push(this);
            }
          });
        } else {
          shared.selectedElements = [target];
        }
      } else if (trigger === 'axis') {
        // todo 查找
        const {
          __data__: { points },
        } = elements[0];
        const xs = points.map((p) => p[0]);
        const idx = bisectLeft(xs, event.offsetX) - 1;
      }
    }
    return context;
  };
};

ElementSelection.props = {};
