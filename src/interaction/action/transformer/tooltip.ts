import { Coordinate, Vector2 } from '@antv/coord';
import { IElement, Circle } from '@antv/g';
import { Tooltip as TooltipComponent, LineCrosshair } from '@antv/gui';
import { least } from 'd3-array';
import { unique } from '../../../utils/array';
import { isTranspose } from '../../../utils/coordinate';
import { G2Element, Selection } from '../../../utils/selection';
import { ActionComponent as AC, InteractionContext } from '../../types';
import { G2Theme } from '../../../runtime';
import { TooltipAction } from '../../../spec';

// 基本结构
type TooltipItem = {
  color: string;
  // title 可以不需要了
  title?: string;
  name?: string;
  value?: string;
  // 保存原始数据
  data?: any;
  // x,y 相对于 plot 位置（coordinate）
  x: number;
  y: number;
};

type TooltipData = {
  items: TooltipItem[];
  title: string;
  // x,y 相对于画布坐标位置
  x: number;
  y: number;
};

function getContainer(group: IElement) {
  // @ts-ignore
  return group.getRootNode().defaultView.getConfig().container;
}

function getCrosshairOfPoint(
  coordinate: Coordinate,
  point: Vector2,
  type?: string,
) {
  const { x, y, width, height } = coordinate.getOptions();
  const lineX = {
    startPos: [x, point[1]],
    endPos: [x + width, point[1]],
    text: false,
    lineStyle: { lineDash: null, lineWidth: 1 },
  };
  const lineY = {
    startPos: [point[0], y],
    endPos: [point[0], y + height],
    text: false,
    lineStyle: { lineDash: null, lineWidth: 1 },
  };

  if (type === 'x') return [lineX];
  if (type === 'xy') return [lineX, lineY];
  return [lineY];
}

function hideCrosshairs(selection: Selection) {
  selection.selectAll('.tooltip-crosshairs').each(function () {
    this.hide();
  });
}

function hideTooltipMarkers(selection: Selection) {
  selection.selectAll('.tooltip-markers').each(function () {
    this.hide();
  });
}

function hideTooltip(transientLayer: Selection) {
  transientLayer.selectAll('.tooltip').each(function () {
    this.hide();
  });
  hideCrosshairs(transientLayer);
  hideTooltipMarkers(transientLayer);
}

function renderCrosshair(
  context: InteractionContext,
  tooltipData: TooltipData | null,
  crosshairsCfg: any = {},
) {
  const { transientLayer, coordinate } = context;

  if (!tooltipData) {
    hideCrosshairs(transientLayer);
    return;
  }

  const { follow, type } = crosshairsCfg;
  const { x, y, items } = tooltipData;
  let data = [];
  if (follow) {
    data = getCrosshairOfPoint(coordinate, [x, y], type);
  } else {
    data = items
      .map((item) => getCrosshairOfPoint(coordinate, [item.x, item.y], type))
      .flat();
  }

  transientLayer
    .selectAll('.tooltip-crosshairs')
    .data(data, (_, i) => i)
    .join(
      (enter) =>
        enter.append(
          (style) =>
            new LineCrosshair({ className: 'tooltip-crosshairs', style }),
        ),
      (update) =>
        update.each(function (datum) {
          this.update(datum);
          this.show();
        }),
      (exit) => exit.remove(),
    );
}

function renderMarkers(
  context: InteractionContext,
  tooltipData: TooltipData | null,
  markerCfg = {},
) {
  const { transientLayer } = context;

  if (!tooltipData) {
    hideTooltipMarkers(transientLayer);
    return;
  }

  const { items } = tooltipData;
  const data = items.map((item) => {
    const { x, y, color } = item;
    return {
      cx: x,
      cy: y,
      fill: color,
      r: 3,
      stroke: '#fff',
      lineWidth: 1,
      ...markerCfg,
    };
  });

  transientLayer
    .selectAll('.tooltip-markers')
    .data(data, (_, i) => i)
    .join(
      (enter) =>
        enter.append(
          (style) => new Circle({ className: 'tooltip-markers', style }),
        ),
      (update) =>
        update.each(function (datum) {
          this.attr(datum);
          this.show();
        }),
      (exit) => exit.remove(),
    );
}

function createTooltipComponent(
  transientLayer: Selection,
  container: HTMLElement,
  bounding: any,
) {
  let tooltip = transientLayer.select('.tooltip').node() as TooltipComponent;
  if (!tooltip) {
    tooltip = new TooltipComponent({
      className: 'tooltip',
      style: {
        container: { x: 0, y: 0 },
        items: [],
        bounding,
        position: 'bottom-right',
        offset: [10, 10],
      },
    });
    transientLayer.append(() => tooltip);
    container.appendChild(tooltip.HTMLTooltipElement);
  }
  return tooltip;
}

/**
 * 考虑不规则图形
 */
function weight(points: any): [number, number] {
  const [p0, p1, p2 = p1] = points;

  return [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
}

function getTooltipData(
  context: InteractionContext,
  pointX: number,
  pointY: number,
  tooltipCfg: TooltipAction = {},
  theme: G2Theme,
) {
  const { shared, selection, scale, coordinate } = context;
  const { mouseX, mouseY, selectedElements } = shared;
  const { defaultColor } = theme;
  // If not shared, get data by hit shape.
  const elements = !tooltipCfg?.shared
    ? (selectedElements as G2Element[])
    : selection.selectAll('.element').nodes();

  const data = elements
    .map((element) => {
      const { __data__: datum } = element;
      const { points, origin = [] } = datum;

      const { domain } = scale.x.getOptions();
      // todo 判断原始数据是否为数组，暂时用 points 数量来代替
      // if (Array.isArray(origin)) {
      if (points.length > 4) {
        // todo 获取原始数据
        return points.map((p, i) => ({
          x: p[0],
          y: p[1],
          // 临时处理，待移除
          xValue: domain[i],
          __data__: { ...(origin[i] || datum), title: domain[i] },
        }));
      } else {
        const [x, y] = weight(points);
        const xValue = scale.x.invert(
          isTranspose(coordinate) ? datum.y : datum.x,
        );
        return [{ x, y, xValue, __data__: datum }];
      }
    })
    .flat();

  // 先根据 x 方向判断
  const closestPoint = least(
    data,
    (datum) =>
      (isTranspose(coordinate) ? datum.y - pointY : datum.x - pointX) ** 2,
  );

  // todo 去重（point、line 并存）
  const items = data
    .filter((datum) =>
      closestPoint.xValue
        ? datum.xValue === closestPoint.xValue
        : datum === closestPoint,
    )
    .map((item) => {
      const { __data__: datum, x, y } = item;
      const { color = defaultColor, title } = datum;

      return Object.entries(datum)
        .filter(([key]) => key.startsWith('tooltip'))
        .map(([key, d]) => {
          const { field, title: name = field } = scale[key].getOptions();
          const isObject = typeof d === 'object' && !(d instanceof Date);
          const item = (
            isObject ? d : { value: d === undefined ? d : `${d}` }
          ) as {
            value: string;
          };
          return {
            x,
            y,
            name: key.replace('tooltip', name),
            color,
            title,
            ...item,
          };
        })
        .filter(({ value }) => value !== undefined);
    })
    .flat();

  const title = unique(items.map((d) => d.title)).join(',');
  return items.length
    ? {
        x: mouseX,
        y: mouseY,
        title,
        items,
      }
    : null;
}

export type TooltipOptions = Omit<TooltipAction, 'type'>;

/**
 * @todo Tooltip for line and area geometry.
 * @todo Tooltip for group or stack interval.
 * @todo Using the color(fill or stroke) attribute of each
 * shape as the item.
 */
export const Tooltip: AC<TooltipOptions> = (options) => {
  const {
    hide,
    showCrosshairs,
    showMarkers,
    crosshairs: crosshairsCfg,
    marker: markerCfg,
    ...tooltipCfg
  } = options;
  return (context) => {
    const { scale, coordinate, theme, selection, shared, transientLayer } =
      context;
    const { tooltip } = scale;

    if (hide || tooltip === undefined) {
      hideTooltip(transientLayer);
      return context;
    }

    const { mouseX, mouseY } = shared;
    // Find the first of main layers.
    const mainLayer = selection.select('.main').node();
    const container = getContainer(mainLayer);
    const { x, y, width, height } = coordinate.getOptions();
    const [x0, y0] = mainLayer.getBounds().min;

    const tooltipComponent = createTooltipComponent(transientLayer, container, {
      x: x0 + x,
      y: y0 + y,
      width,
      height,
    });

    const data = getTooltipData(
      context,
      mouseX - x0,
      mouseY - y0,
      tooltipCfg,
      theme,
    );

    if (!data) {
      hideTooltip(transientLayer);
    } else {
      const { title, items } = data;
      tooltipComponent.update({
        x: mouseX,
        y: mouseY,
        title,
        position: 'bottom-right',
        offset: [10, 10],
        items,
      });
      tooltipComponent.show();
    }

    renderCrosshair(context, showCrosshairs ? data : null, crosshairsCfg);
    renderMarkers(context, showMarkers ? data : null, markerCfg);

    return context;
  };
};

Tooltip.props = {};
