import _ from 'lodash';
import angular from 'angular';

export class IndicatorsCtrl {
  /** @ngInject */
  constructor($scope, $element, popoverSrv) {
    $scope.getOverride = function() {
      if (!$scope.ctrl.panel.seriesOverrides) {
        return [];
      }

      var list = _.filter($scope.ctrl.panel.seriesOverrides, { alias: $scope.indicator.alias });
      return list.length > 0 ? list[0] : [];
    };

    $scope.updateCurrentOverrides = function() {
      $scope.currentOverrides = [];
      var value = $scope.override.linewidth;
      if (_.isUndefined(value)) {
        value = 1;
      }
      $scope.currentOverrides.push({
        name: 'Line width',
        propertyName: 'linewidth',
        value: value,
      });

      value = $scope.override.fill;
      if (_.isUndefined(value)) {
        value = 0;
      }
      $scope.currentOverrides.push({
        name: 'Line fill',
        propertyName: 'fill',
        value: value,
      });
    };

    $scope.updateOverride = function() {
      $scope.override.linewidth = $scope.currentOverrides[0].value;
      $scope.override.fill = $scope.currentOverrides[1].value;
      $scope.ctrl.render();
    };

    $scope.currentOverrides = [];
    $scope.override = $scope.getOverride();
    if (!$scope.override || $scope.override.length === 0) {
      var override = {
        'alias': $scope.indicator.alias,
        'linewidth': 1,
        'fill': 0,
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
