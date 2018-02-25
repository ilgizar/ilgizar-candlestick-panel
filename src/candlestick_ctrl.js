import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import TimeSeries from 'app/core/time_series';
import rendering from './rendering';
import appEvents from 'app/core/app_events';

export class CandleStickCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.hiddenSeries = {};

    this.logScales = {
      linear: 1,
      'log (base 2)': 2,
      'log (base 10)': 10,
      'log (base 32)': 32,
      'log (base 1024)': 1024,
    };

    var panelDefaults = {
      datasource: null,
      mode: 'color',
      widthMode: 'auto',
      maxDataPoints: 80,
      candlestickWidth: 9,
      showVolume: true,
      volumeWidth: 1,
      volumeFill: 1,

      bullColor: '#26ff42',
      bearColor: '#ff4a3a',
      dojiColor: '#c8c9ca',
      solidColor: '#000000',
      barColor: '#000000',
      volumeColor: '#584477',

      swapYaxes: true,
      labelY1: null,
      labelY2: null,

      colorizeTooltip: true,
      tooltipFormat: 'YYYY-MM-DD HH:mm:ss',
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
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError() {
    this.series = [];
    this.render();
  }

  changeSeriesColor(series, color) {
    series.color = color;
    this.panel.aliasColors[series.alias] = series.color;
    this.render();
  }

  onRender() {
    this.data = this.parseSeries(this.series);
  }

  parseSeries(series) {
    if (series === undefined)
        return series;

    var result = new Array(4);
    var index = 5;
    for (var i = 0; i < series.length; i++) {
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
            case 'volume':
                result[4] = series[i];
                break;
            default:
                result[index++] = series[i];
                break;
        }
    }

    return result;
  }

  onDataReceived(dataList) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    this.data = this.parseSeries(this.series);
    this.render(this.data);
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
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
}

CandleStickCtrl.templateUrl = 'partials/module.html';
