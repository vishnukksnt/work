
sntRover.controller('RVWorkstationController', [
  '$scope',
  '$rootScope',
  '$filter',
  '$state',
  'ngDialog',
  'RVWorkstationSrv',
  '$timeout',
  function($scope, $rootScope, $filter, $state, ngDialog, RVWorkstationSrv, $timeout) {
    BaseCtrl.call(this, $scope);

    var fetchKeyEncoderList = function() {
      var onEncodersListFetchSuccess = function(data) {
        $scope.$emit('hideLoader');
        $scope.key_encoders = data.results;
      };

      $scope.invokeApi(RVWorkstationSrv.fetchEncoders, {}, onEncodersListFetchSuccess);

    };
    var fetchEmvTerminalList = function() {
      var onEmvTerminalListFetchSuccess = function(data) {
        $scope.$emit('hideLoader');
        $scope.emv_terminals = data.results;
      };

      $scope.invokeApi(RVWorkstationSrv.fetchEmvTerminals, {}, onEmvTerminalListFetchSuccess);

    };

    $scope.saveWorkStation = function() {
      var onSaveWorkstationSuccess = function(data) {
        $rootScope.workstation_id = data.id;
        $scope.errorMessage = "";
        var onSetWorkstationSuccess = function(response) {
          $scope.$emit('hideLoader');
          $timeout(function() {
            ngDialog.close();
          }, 250);
        };

        var params = {};

        params.rover_device_id = $scope.getDeviceId();
        $scope.invokeApi(RVWorkstationSrv.setWorkstation, params, onSetWorkstationSuccess);

      };
      var onSaveWorkstationFailure = function(error) {
        $scope.$emit('hideLoader');
        $scope.errorMessage = error[0];
      };

      var requestData = {};

      requestData.name = $scope.mapping.name;
      requestData.identifier = $scope.mapping.station_identifier;
      requestData.rover_device_id = $scope.getDeviceId();

      if ($scope.mapping.selectedKeyEncoder) {
        requestData.default_key_encoder_id = $scope.mapping.selectedKeyEncoder;
      }

      if ($scope.mapping.selectedEmvTerminal) {
        requestData.emv_terminal_id = $scope.mapping.selectedEmvTerminal;
      }

      $scope.invokeApi(RVWorkstationSrv.createWorkstation, requestData, onSaveWorkstationSuccess, onSaveWorkstationFailure);

    };

    var init = function() {
      $scope.mapping = {};
      fetchKeyEncoderList();
      fetchEmvTerminalList();
      $scope.errorMessage = "";
    };

    init();


}]);