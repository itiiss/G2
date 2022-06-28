# Tooltip Interaction

## Basic tooltip

```js | dom
G2.render({
  type: 'interval',
  data: [
    { genre: 'Sports', sold: 275, type: 'A' },
    { genre: 'Strategy', sold: 115, type: 'B' },
    { genre: 'Action', sold: 120, type: 'C' },
    { genre: 'Shooter', sold: 350, type: 'D' },
    { genre: 'Other', sold: 150, type: 'E' },
  ],
  encode: {
    x: 'genre',
    y: 'sold',
  },
});
```

## Tooltip with custom title and tooltip

```js | dom
G2.render({
  type: 'interval',
  data: [
    { genre: 'Sports', sold: 275, type: 'A' },
    { genre: 'Strategy', sold: 115, type: 'B' },
    { genre: 'Action', sold: 120, type: 'C' },
    { genre: 'Shooter', sold: 350, type: 'D' },
    { genre: 'Other', sold: 150, type: 'E' },
  ],
  scale: { tooltip: { field: ['x', 'y'] } },
  encode: {
    x: 'genre',
    y: 'sold',
    color: 'genre',
    tooltip: ['genre', 'sold'],
    title: 'type',
  },
});
```

## Tooltip with object options

```js | dom
G2.render({
  type: 'interval',
  data: [
    { genre: 'Sports', sold: 275, type: 'A' },
    { genre: 'Strategy', sold: 115, type: 'B' },
    { genre: 'Action', sold: 120, type: 'C' },
    { genre: 'Shooter', sold: 350, type: 'D' },
    { genre: 'Other', sold: 150, type: 'E' },
  ],
  scale: { tooltip: { field: ['x', 'y'] } },
  encode: {
    x: 'genre',
    y: 'sold',
    color: 'genre',
    tooltip: (d) => ({
      value: `${d.genre}, ${d.sold}`,
    }),
  },
});
```

## Tooltip with custom interaction options

**Tooltip with `showMarkers` and `showCrosshairs`**

```js | dom
G2.render({
  type: 'line',
  data: [
    { year: '1991', value: 15468 },
    { year: '1992', value: 16100 },
    { year: '1993', value: 15900 },
    { year: '1994', value: 17409 },
    { year: '1995', value: 17000 },
    { year: '1996', value: 31056 },
    { year: '1997', value: 31982 },
    { year: '1998', value: 32040 },
    { year: '1999', value: 33233 },
  ],
  encode: {
    x: 'year',
    y: 'value',
  },
  scale: {
    color: { guide: { title: null } },
  },
  interaction: [
    { type: 'tooltip', shared: true, showCrosshairs: true, showMarkers: true },
  ],
});
```

**Tooltip with `shared: false`**

```js | dom
G2.render({
  type: 'interval',
  data: [
    { city: 'London', month: 'Jan.', value: 18.9 },
    { city: 'London', month: 'Feb.', value: 28.8 },
    { city: 'London', month: 'Mar.', value: 39.3 },
    { city: 'London', month: 'Apr.', value: 81.4 },
    { city: 'London', month: 'May', value: 47 },
    { city: 'London', month: 'Jun.', value: 20.3 },
    { city: 'London', month: 'Jul.', value: 24 },
    { city: 'London', month: 'Aug.', value: 35.6 },
    { city: 'Berlin', month: 'Jan.', value: 12.4 },
    { city: 'Berlin', month: 'Feb.', value: 23.2 },
    { city: 'Berlin', month: 'Mar.', value: 34.5 },
    { city: 'Berlin', month: 'Apr.', value: 99.7 },
    { city: 'Berlin', month: 'May', value: 52.6 },
    { city: 'Berlin', month: 'Jun.', value: 35.5 },
    { city: 'Berlin', month: 'Jul.', value: 37.4 },
    { city: 'Berlin', month: 'Aug.', value: 42.4 },
  ],
  encode: {
    x: 'month',
    y: 'value',
    color: 'city',
  },
  interaction: [{ type: 'tooltip' }],
});
```

## Tooltip in Composition

```js | dom
G2.render({
  type: 'view',
  title: 'Line chart with tooltip',
  data: [
    { year: '1991', value: 15468 },
    { year: '1992', value: 16100 },
    { year: '1993', value: 15900 },
    { year: '1994', value: 17409 },
    { year: '1995', value: 17000 },
    { year: '1996', value: 31056 },
    { year: '1997', value: 31982 },
    { year: '1998', value: 32040 },
    { year: '1999', value: 33233 },
  ],
  scale: {
    color: { guide: { title: null } },
  },
  children: [
    {
      type: 'line',
      encode: {
        x: 'year',
        y: 'value',
      },
    },
    {
      type: 'point',
      encode: {
        x: 'year',
        y: 'value',
      },
    },
  ],
  interaction: [{ type: 'tooltip' }],
});
```
