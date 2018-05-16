import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import TimeSeries from 'app/core/time_series';
import rendering from './rendering';
import colors from './colors';
import appEvents from 'app/core/app_events';

export class CandleStickCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.hiddenSeries = {};

    let panelDefaults = {
      datasource: null,
      mode: 'color',
      widthMode: 'auto',
      maxDataPoints: 80,
      candlestickWidth: 9,

      bullColor: '#26ff42',
      bearColor: '#ff4a3a',
      dojiColor: '#c8c9ca',
      solidColor: '#000000',
      barColor: '#000000',

      swapYaxes: true,
      labelY1: null,
      labelY2: null,

      colorizeTooltip: true,
      transparentTooltip: false,
      tooltipFormat: 'YYYY-MM-DD HH:mm:ss',

      indicators: [],
    };

    _.defaults(this.panel, panelDefaults);

    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.seriesToAlias();
  }

  seriesToAlias() {
    if (typeof(this.panel.open) !== 'object') {
      return;
    }
    let value = this.panel.open.alias;
    this.panel.open = value;

    value = this.panel.close.alias;
    this.panel.close = value;

    value = this.panel.low.alias;
    this.panel.low = value;

    value = this.panel.high.alias;
    this.panel.high = value;
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/ilgizar-candlestick-panel/partials/editor.html', 2);
    this.addEditorTab('Indicators', 'public/plugins/ilgizar-candlestick-panel/partials/indicators.html', 3);
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError() {
    this.series = [];
    this.render();
  }

  onRender() {
    if (!this.series) {
      return;
    }

    this.data = this.parseSeries(this.series);

    if (this.panel.seriesOverrides) {
      for (let series of this.series) {
        series.applySeriesOverrides(this.panel.seriesOverrides);
      }
    }
  }

  parseSeries(series) {

    if (series === undefined) {
      return series;
    }
    // series must contain aliased datapoints
    // open, high, low, and close, otherwise
    // do not parse any further.
    const keys = ['open', 'high', 'low', 'close'];
    if (series.filter(dp => (keys.indexOf(dp.alias) > -1)).length < 4) {
      return [];
    }

    let result = new Array(4);
    let index = 4;
    for (let i = 0; i < series.length; i++) {
      if (series[i] !== undefined) {
        switch (series[i].alias) {
          case 'open':
            result[0] = series[i];
            break;
          case 'close':
            result[1] = series[i];
            break;
          case 'low':
            result[2] = series[i];
            break;
          case 'high':
            result[3] = series[i];
            break;
          default:
            result[index++] = series[i];
            break;
        }
      }
    }

    return result;
  }

  onDataReceived(dataList) {
    this.series = dataList.map((item, index) => {
      return this.seriesHandler(item, index);
    });
    this.refreshColors();
    this.data = this.parseSeries(this.series);
    this.render(this.data);
  }

  seriesHandler(seriesData, index) {
    let series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  refreshColors() {
    for (let i = 4; i < this.series.length; i++) {
      if (this.series[i] !== undefined) {
        var index = -1;
        if (this.panel.seriesOverrides !== undefined) {
          for (let j = 0; j < this.panel.seriesOverrides.length; j++) {
            if (this.panel.seriesOverrides[j].alias === this.series[i].alias) {
              index = j;
              break;
            }
          }
        }
        if (index < 0) {
          if (this.panel.seriesOverrides === undefined) {
            this.panel.seriesOverrides = [];
          }
          index = this.panel.seriesOverrides.length;
          this.panel.seriesOverrides[index] = {
            alias: this.series[i].alias,
            color: colors[index % colors.length],
            linewidth: 1,
            fill: 0
          };
        }
        this.series[i].color = this.panel.seriesOverrides[index].color;
      }
    }
  }

  changeColor() {
    this.refreshColors();
    this.render();
  }

  link(scope, elem, attrs, ctrl) {
    rendering(scope, elem, attrs, ctrl);
  }

  toggleSeries(serie) {
    if (this.hiddenSeries[serie.label]) {
      delete this.hiddenSeries[serie.alias];
    } else {
      this.hiddenSeries[serie.label] = true;
    }
    this.render();
  }

  getIndicators() {
    return this.series ? _.takeRight(this.series, this.series.length - 4) : [];
  }
}

CandleStickCtrl.templateUrl = 'partials/module.html';
