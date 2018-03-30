import _ from 'lodash';
import angular from 'angular';

export class IndicatorsCtrl {
  /** @ngInject */
  constructor($scope, $element, popoverSrv) {
    var defColor = '#ffffff';
    var defMode = 'lines';
    var defLineWidth = 1;
    var defLineFill = 0;
    var defPointRadius = 5;
    var defZindex = 0;
    var defYaxis = 1;

    $scope.getOverride = function() {
      if (!$scope.ctrl.panel.seriesOverrides) {
        return [];
      }

      var list = _.filter($scope.ctrl.panel.seriesOverrides, { alias: $scope.indicator.alias });
      return list.length > 0 ? list[0] : [];
    };

    $scope.updateCurrentOverrides = function() {
      $scope.currentOverrides = [];
      var value = $scope.override.color;
      if (_.isUndefined(value)) {
        value = defColor;
      }
      $scope.currentOverrides.push({
        name: 'Color',
        propertyName: 'color',
        value: value,
      });

      var lines = $scope.override.lines;
      if (_.isUndefined(lines)) {
        lines = defMode === 'lines';
      }
      var bars = $scope.override.bars;
      if (_.isUndefined(lines)) {
        bras = defMode === 'bars';
      }
      var points = $scope.override.points;
      if (_.isUndefined(lines)) {
        points = defMode === 'points';
      }
      $scope.currentOverrides.push({
        name: 'Draw mode',
        propertyName: 'mode',
        value: bars ? 'bars' : points ? 'points' : 'lines',
      });

      value = $scope.override.linewidth;
      if (_.isUndefined(value)) {
        value = defLineWidth;
      }
      $scope.currentOverrides.push({
        name: 'Line width',
        propertyName: 'linewidth',
        value: value,
      });

      value = $scope.override.fill;
      if (_.isUndefined(value)) {
        value = defLineFill;
      }
      $scope.currentOverrides.push({
        name: 'Fill opacity',
        propertyName: 'fill',
        value:  parseInt(value) * 10,
      });

      value = $scope.override.pointradius;
      if (_.isUndefined(value)) {
        value = defPointRadius;
      }
      $scope.currentOverrides.push({
        name: 'Points radius',
        propertyName: 'pointradius',
        value: value,
      });

      value = $scope.override.zindex;
      if (_.isUndefined(value)) {
        value = defZindex;
      }
      $scope.currentOverrides.push({
        name: 'Z-index',
        propertyName: 'zindex',
        value: value,
      });

      value = $scope.override.yaxis;
      if (_.isUndefined(value)) {
        value = defYaxis;
      }
      $scope.currentOverrides.push({
        name: 'Y-axis',
        propertyName: 'yaxis',
        value: value === 2 ? 'other' : 'price',
      });
     };

    $scope.updateOverride = function() {
      $scope.override.color = $scope.currentOverrides[0].value;
      $scope.override.lines = $scope.currentOverrides[1].value === 'lines';
      $scope.override.bars = $scope.currentOverrides[1].value === 'bars';
      $scope.override.points = $scope.currentOverrides[1].value === 'points';
      $scope.override.linewidth = $scope.currentOverrides[2].value;
      $scope.override.fill = parseInt($scope.currentOverrides[3].value) / 10;
      $scope.override.pointradius = $scope.currentOverrides[4].value;
      $scope.override.zindex = $scope.currentOverrides[5].value;
      $scope.override.yaxis = $scope.currentOverrides[6].value === 'other' ? 2 : 1;
      $scope.ctrl.render();
    };

    $scope.currentOverrides = [];
    $scope.override = $scope.getOverride();
    if (!$scope.override || $scope.override.length === 0) {
      var override = {
        'alias': $scope.indicator.alias,
        'color': defColor,
        'lines': defMode === 'lines',
        'bars': defMode === 'bars',
        'points': defMode === 'points',
        'linewidth': defLineWidth,
        'fill': defLineFill,
        'pointradius': defPointRadius,
        'zindex': defZindex,
        'yaxis': defYaxis,
      };
      if (!$scope.ctrl.panel.seriesOverrides) {
        $scope.ctrl.panel.seriesOverrides = [];
      }
      $scope.ctrl.panel.seriesOverrides.push(override);
      $scope.override = $scope.getOverride();
    }
    $scope.updateCurrentOverrides();
  }
}

angular.module('grafana.controllers').controller('IndicatorsCtrl', IndicatorsCtrl);
