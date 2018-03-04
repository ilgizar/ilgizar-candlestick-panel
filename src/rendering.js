import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import 'jquery.flot';
import { appEvents } from 'app/core/core';
import './jquery_flot_candlestick';
import './jquery_flot_axislabels';

export default function link(scope, elem, attrs, ctrl) {
  var data, panel, dashboard, plot;
  elem = elem.find('.candlestick-panel');
  var $tooltip = $('<div class="graph-tooltip">');
  var grayColor = '#c8c9ca';

  ctrl.events.on('render', renderData => {
    data = renderData || data;
    if (!data) {
      return;
    }

    render(false);
  });

  ctrl.events.on('panel-teardown', () => {
    if (plot) {
      plot.destroy();
      plot = null;
    }
  });

  elem.bind('plotselected', function(event, ranges) {
    scope.$apply(function() {
      scope.ctrl.timeSrv.setTime({
        from: moment.utc(ranges.xaxis.from),
        to: moment.utc(ranges.xaxis.to),
      });
    });
  });

  elem.mouseleave(function () {
    if (plot) {
      clearTooltip();
    }
    appEvents.emit('graph-hover-clear');
  });

  appEvents.on(
    'graph-hover',
    evt => {
      // ignore other graph hover events if shared tooltip is disabled
      if (!dashboard.sharedTooltipModeEnabled()) {
        return;
      }

      // ignore if we are the emitter
      if (!plot || evt.panel.id === panel.id || ctrl.otherPanelInFullscreenMode()) {
        return;
      }

      showToolpit(evt.pos);
    },
    scope
  );

  appEvents.on(
    'graph-hover-clear',
    (event, info) => {
      if (plot) {
        clearTooltip();
      }
    },
    scope
  );

  function setElementHeight() {
    try {
      elem.css('height', ctrl.height + 'px');

      return true;
    } catch (e) { // IE throws errors sometimes
      console.log(e);
      return false;
    }
  }

  function time_format(ticks, min, max) {
    if (min && max && ticks) {
      let range = max - min;
      let secPerTick = range / ticks / 1000;
      const oneDay = 86400000;
      const oneYear = 31536000000;

      if (secPerTick <= 45) {
        return '%H:%M:%S';
      }
      if (secPerTick <= 7200 || range <= oneDay) {
        return '%H:%M';
      }
      if (secPerTick <= 80000) {
        return '%m/%d %H:%M';
      }
      if (secPerTick <= 2419200 || range <= oneYear) {
        return '%m/%d';
      }
      return '%Y-%m';
    }

    return '%H:%M';
  }

  function render_panel() {
    refreshTooltip();

    data = ctrl.data;

    if (data.length < 4) {
      return;
    }

    let panelWidth = elem.width();
    let panelHeight = elem.height();

    let plotCanvas = $('<div></div>');
    let plotCss = {
      top: '10px',
      left: '0px',
      margin: 'auto',
      position: 'relative',
      width: panelWidth + 'px',
      height: (panelHeight - 20) + 'px'
    };

    plotCanvas.css(plotCss);

    const gridColor = '#c8c8c8';
    let lineWidth = panel.widthMode === 'auto' ? _.floor(panelWidth / (1.5 * data[0].stats.count)) : panel.candlestickWidth;
    if (!lineWidth) {
      lineWidth = 9;
    }

    let ticks = panelWidth / 100;
    let min = _.isUndefined(ctrl.range.from) ? null : ctrl.range.from.valueOf();
    let max = _.isUndefined(ctrl.range.to) ? null : ctrl.range.to.valueOf();

    let yaxes = [{
      index: 1,
      logBase: 1,
      show: true,
      position: panel.swapYaxes ? 'right' : 'left',
      axisLabel: panel.labelY1,
    }];
    if (panel.showVolume && (data.length > 4)) {
      yaxes.push({
        index: 2,
        logBase: 1,
        show: true,
        position: panel.swapYaxes ? 'left' : 'right',
        axisLabel: panel.labelY2,
      });
    }

    let options = {
      legend: {
        show: false
      },
      series: {
        lines: {
          show: false,
          zero: false,
          lineWidth: panel.volumeWidth ? panel.volumeWidth : 0,
          fill: panel.volumeFill ? (0.1 * panel.volumeFill) : 0,
        },
        candlestick: {
          active: true,
          show: true,
          lineWidth: lineWidth + 'px',
          rangeWidth: 1,
          rangeColor: panel.mode === 'solid' ? panel.solidColor : panel.barColor,
          upColor: panel.mode === 'color' ? panel.bearColor : panel.solidColor,
          downColor: panel.mode === 'color' ? panel.bullColor : panel.solidColor,
          neutralColor: panel.mode === 'color' ? panel.dojiColor : panel.solidColor,
          drawCandlestick: newDrawCandlestick,
        },
        nearBy: {
        }
      },
      yaxes: yaxes,
      xaxis: {
        timezone: dashboard.getTimezone(),
        show: true,
        mode: 'time',
        label: 'Datetime',
        min: min,
        max: max,
        ticks: ticks,
        timeformat: time_format(ticks, min, max),
      },
      grid: {
        minBorderMargin: 0,
        markings: [],
        backgroundColor: null,
        borderWidth: 0,
        hoverable: true,
        clickable: true,
        color: gridColor,
        margin: { left: 0, right: 0 },
        labelMarginX: 0,
      },
      selection: {
        mode: 'x',
        color: '#666',
      },
      crosshair: {
        mode: 'x',
      }
    };

    for (var i = 0; i < data.length; i++) {
      let series = data[i];
      if (series != undefined) {
        series.data = series.getFlotPairs(series.nullPointMode || panel.nullPointMode);
      }
    }

    let candleData = [], high = [], low = [];

    for (i = 0; i < data[0].data.length; i++) {
      candleData.push([data[0].data[i][0], data[0].data[i][1], data[1].data[i][1], data[2].data[i][1], data[3].data[i][1]]);
      low.push([data[0].data[i][0], data[2].data[i][1]]);
      high.push([data[0].data[i][0], data[3].data[i][1]]);
    }

    let datas = [];
    if (panel.showVolume && (data.length > 4) && (data[4] !== undefined)) {
      datas.push({
        lines: {
          show: true,
        },
        data: data[4].flotpairs,
        color: panel.volumeColor,
        yaxis: 2,
        hoverable: false,
      });
    }
    datas.push({
      candlestick: {
        show: true
      },
      data: candleData,
      hoverable: true,
    },{
      label: "High",
      data: high,
      lines: {
        show: false
      },
      candlestick: {
        show: false
      },
      nearBy: {
        findItem:null
      }
    },{
      label: "Low",
      data: low,
      lines: {
        show: false
      },
      candlestick: {
        show: false
      },
      nearBy: {
        findItem:null
      }
    });

    if (data.length > 5) {
      for (i = 5; i < data.length; i++) {
        datas.push({
          lines: {
            show: true,
            zero: false,
            lineWidth: 'lines' in data[i] && data[i].lines.lineWidth !== undefined ? data[i].lines.lineWidth : 1,
            fill: 'lines' in data[i] && data[i].lines.fill !== undefined ? data[i].lines.fill : 0,
          },
          data: data[i].flotpairs,
          color: data[i].color,
          hoverable: false,
        });
      }
    }

    elem.html(plotCanvas);

    plot = $.plot(plotCanvas, datas, options);

    plotCanvas.bind("plothover", function (event, pos, item) {
      showToolpit(pos);

      // broadcast to other graph panels that we are hovering!
      pos.panelRelY = (pos.pageY - elem.offset().top) / elem.height();
      appEvents.emit('graph-hover', {pos: pos, panel: panel});
    });
  }

  function showToolpit(pos) {
    // if panelRelY is defined another panel wants us to show a tooltip
    // get pageX from position on x axis and pageY from relative position in original panel
    if (pos.panelRelY) {
      let pointOffset = plot.pointOffset({x: pos.x});
      if (Number.isNaN(pointOffset.left) || pointOffset.left < 0 || pointOffset.left > elem.width()) {
        clearTooltip();
        return;
      }
      pos.pageX = elem.offset().left + pointOffset.left;
      pos.pageY = elem.offset().top + elem.height() * pos.panelRelY;
      let isVisible = pos.pageY >= $(window).scrollTop() && pos.pageY <= $(window).innerHeight() + $(window).scrollTop();
      if (!isVisible) {
        clearTooltip();
        return;
      }
      plot.setCrosshair(pos);

      if (dashboard.sharedCrosshairModeOnly()) {
        // if only crosshair mode we are done
        return;
      }
    }

    let seriesItem = function(label, value, color, line) {
      let seriesHtml = '<div class="graph-tooltip-list-item">';
      if (line) {
        seriesHtml += '<div class="graph-tooltip-series-name">' + 
          '<i class="fa fa-minus" style="color:' + color +';"></i> ' + label + ':</div>';
      } else {
        seriesHtml += '<div class="graph-tooltip-series-name" style="color:' + color +';">' + label + ':</div>';
      }
      seriesHtml += '<div class="graph-tooltip-value">' + value + '</div></div>';
      return seriesHtml;
    }
    const len = data[0].datapoints.length;
    let offset = 0;
    if (len > 0) {
      offset = (data[0].datapoints[1][1] - data[0].datapoints[0][1]) / 2;
    }
    const posX = pos.x - offset;
    for (var i = 0; i < len; i++) {
      if (posX <= data[0].datapoints[i][1]) {
        break;
      }
    }
    i = i ? i < len ? i : len - 1 : 0;

    const absoluteTime = dashboard.formatDate(data[0].datapoints[i][1], panel.tooltipFormat);

    let body = '<div class="graph-tooltip-time">'+ absoluteTime + '</div>' +
      seriesItem('Open', formatValue(data[0].datapoints[i][0]), grayColor, false) +
      seriesItem('High', formatValue(data[3].datapoints[i][0]),
        panel.colorizeTooltip && panel.mode === 'color' ? panel.bullColor : grayColor, false) +
      seriesItem('Low', formatValue(data[2].datapoints[i][0]),
        panel.colorizeTooltip && panel.mode === 'color' ? panel.bearColor : grayColor, false) +
      seriesItem('Close', formatValue(data[1].datapoints[i][0]), grayColor, false);

    let index = 3;
    if (panel.showVolume && (data.length > 4) && (data[4] !== undefined)) {
      body += seriesItem('Volume', formatValue(data[4].datapoints[i][0]),
        panel.colorizeTooltip && panel.mode === 'color' ? panel.volumeColor : grayColor, false);
      index++;
    }

    if (data.length > 5) {
      body += '<div style="height: 2px; margin-top: 2px; border-top: solid 1px ' + grayColor + ';"></div>';
      let plotData = plot.getData();
      for (let j = 5; j < data.length; j++) {
        body += seriesItem(data[j].alias, formatValue(data[j].datapoints[i][0]),
          plotData[index++].color, true);
      }
    }

    $tooltip.html(body).place_tt(pos.pageX + 20, pos.pageY);
  }

  function refreshTooltip() {
    $($tooltip).css('opacity', panel.transparentTooltip ? 0.75 : 1);
  }

  function clearTooltip() {
    $tooltip.detach();
    plot.clearCrosshair();
    plot.unhighlight();
  };

  function formatValue(value) {
    switch (true) {
      case (value >= 100):
        return data[0].formatValue(value);
      case (value >= 1):
        return Math.round(value * 1000) / 1000;
      case (value > 0.1):
        return Math.round(value * 10000) / 10000;
      case (value > 0.01):
        return Math.round(value * 100000) / 100000;
      case (value > 0.001):
        return Math.round(value * 1000000) / 1000000;
      case (value > 0.0001):
        return Math.round(value * 10000000) / 10000000;
      case (value > 0.00001):
        return Math.round(value * 100000000) / 100000000;
      case (value > 0.000001):
        return Math.round(value * 1000000000) / 1000000000;
    }

    return value;
  }

  function newDrawCandlestick(ctx,serie,data,hover) {
    if (data.length < 5) {
      return;
    }

    if(hover === true){
      drawHover(ctx, serie, data, "rgba(255,255,255," + serie.candlestick.highlight.opacity + ")");
    }else{
      drawRange(ctx, serie, data);
      drawBody(ctx, serie, data);
    }

    function getColor(ctx,serie,data){
      if (panel.mode === 'color') {
        if (data[1] === data[2]) {
          return serie.candlestick.neutralColor;
        } else {
          return data[1] > data[2] ? serie.candlestick.upColor : serie.candlestick.downColor;
        }
      }

      return serie.candlestick.rangeColor;
    }

    function drawRange(ctx,serie,data){
      let x = serie.xaxis.p2c(data[0]);
      let y1 = serie.yaxis.p2c(data[3]);
      let y2 = serie.yaxis.p2c(data[4]);
      ctx.lineWidth = serie.candlestick.rangeWidth;
      ctx.beginPath();
      ctx.strokeStyle = getColor(ctx,serie,data);
      switch (panel.mode) {
        case 'color':
        case 'bar':
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          break;
        case 'solid':
          let y3 = serie.yaxis.p2c(data[1]);
          let y4 = serie.yaxis.p2c(data[2]);
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y3);
          ctx.moveTo(x, y4);
          ctx.lineTo(x, y2);
          break;
      }
      ctx.stroke();
    }

    function drawBody(ctx,serie,data){
      let x = serie.xaxis.p2c(data[0]);
      let y1 = serie.yaxis.p2c(data[1]);
      let y2 = serie.yaxis.p2c(data[2]);
      if(data[1] === data[2] && panel.mode !== 'bar'){
        y2 = y1 + 1;
      }
      ctx.beginPath();
      ctx.strokeStyle = getColor(ctx, serie, data);
      let half = serie.candlestick.barWidth / 2;
      switch (panel.mode) {
        case 'color':
          ctx.lineWidth = serie.candlestick.barWidth;
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          break;
        case 'solid':
          ctx.moveTo(x, y1);
          if (data[1] >= data[2]) {
            ctx.lineWidth = serie.candlestick.barWidth;
            ctx.lineTo(x, y2);
          } else {
            ctx.lineWidth = serie.candlestick.rangeWidth;
            ctx.lineTo(x + half, y1);
            ctx.lineTo(x + half, y2);
            ctx.lineTo(x - half, y2);
            ctx.lineTo(x - half, y1);
            ctx.lineTo(x, y1);
          }
          break;
        case 'bar':
          ctx.lineWidth = serie.candlestick.rangeWidth;
          ctx.moveTo(x - half, y1);
          ctx.lineTo(x, y1);
          ctx.moveTo(x + half, y2);
          ctx.lineTo(x, y2);
          break;
      }
      ctx.stroke();
    }

    function drawHover(ctx,serie,data,c){
      let x = serie.xaxis.p2c(data[0] - serie.candlestick.barWidth / 2);
      let y1 = serie.yaxis.p2c(data[3]);
      let y2 = serie.yaxis.p2c(data[4]);
      ctx.beginPath();
      ctx.strokeStyle = c;
      ctx.lineWidth = serie.candlestick.barWidth;
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    }
  }

  function render(incrementRenderCounter) {
    if (!ctrl.data) { return; }

    data = ctrl.data;
    panel = ctrl.panel;
    dashboard = ctrl.dashboard;

    if (setElementHeight()) {
        render_panel();
    }
    if (incrementRenderCounter) {
      ctrl.renderingCompleted();
    }
  }
}
