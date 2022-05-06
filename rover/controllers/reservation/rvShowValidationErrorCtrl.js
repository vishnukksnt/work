"use strict";

(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
        }var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
          var n = e[i][1][r];return o(n || r);
        }, p, p.exports, r, e, n, t);
      }return n[i].exports;
    }for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
      o(t[i]);
    }return o;
  }return r;
})()({ 1: [function (require, module, exports) {
    sntRover.controller('RVShowRoomNotAvailableCtrl', ['$rootScope', '$scope', 'ngDialog', '$state', '$vault', function ($rootScope, $scope, ngDialog, $state, $vault) {
      BaseCtrl.call(this, $scope);

      $scope.okButtonClicked = function () {
        if ($rootScope.isHourlyRateOn) {
          var reservationDataToKeepinVault = {};
          var roomData = $scope.reservationData.rooms[0];

          reservationDataToKeepinVault.fromDate = new tzIndependentDate($scope.reservationData.arrivalDate).getTime();
          reservationDataToKeepinVault.toDate = new tzIndependentDate($scope.reservationData.departureDate).getTime();
          reservationDataToKeepinVault.arrivalTime = $scope.reservationData.checkinTime;
          reservationDataToKeepinVault.departureTime = $scope.reservationData.checkoutTime;
          reservationDataToKeepinVault.adults = roomData.numAdults;
          reservationDataToKeepinVault.children = roomData.numChildren;
          reservationDataToKeepinVault.infants = roomData.numInfants;
          reservationDataToKeepinVault.roomTypeID = roomData.roomTypeId;
          reservationDataToKeepinVault.guestFirstName = $scope.reservationData.guest.firstName;
          reservationDataToKeepinVault.guestLastName = $scope.reservationData.guest.lastName;
          reservationDataToKeepinVault.companyID = $scope.reservationData.company.id;
          reservationDataToKeepinVault.travelAgentID = $scope.reservationData.travelAgent.id;

          $state.go('rover.diary', {
            isfromcreatereservation: true
          });
          ngDialog.close();
        } else {
          ngDialog.close();
        }
      };
    }]);
  }, {}] }, {}, [1]);