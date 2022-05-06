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
    angular.module('sntRover').controller('RVGuestCardCtrl', ['$scope', 'RVCompanyCardSrv', '$timeout', 'RVContactInfoSrv', 'RVSearchSrv', 'rvPermissionSrv', '$rootScope', function ($scope, RVCompanyCardSrv, $timeout, RVContactInfoSrv, RVSearchSrv, rvPermissionSrv, $rootScope) {
      GuestCardBaseCtrl.call(this, $scope, RVSearchSrv, RVContactInfoSrv, rvPermissionSrv, $rootScope);
      $scope.searchMode = true;
      $scope.guestCardData.selectedLoyaltyLevel = "";
      $scope.loyaltyTabEnabled = false;

      if (!!$scope.reservationDetails.guestCard.id) {
        $scope.searchMode = false;
      }

      $scope.$on("guestSearchInitiated", function () {
        $scope.guestSearchIntiated = true;
        $scope.guests = $scope.searchedGuests;
        $scope.$broadcast("refreshGuestScroll");
      });

      $scope.$on("guestSearchStopped", function () {
        $scope.guestSearchIntiated = false;
        $scope.guests = [];
        $scope.$broadcast("refreshGuestScroll");
      });

      $scope.$on("guestCardDetached", function () {
        $scope.searchMode = true;
      });

      $scope.$on('guestCardAvailable', function () {
        $scope.searchMode = false;
        $timeout(function () {
          $scope.$emit('hideLoader');
        }, 1000);
      });
      $scope.$on('detect-hlps-ffp-active-status', function (evt, data) {
        if (data.userMemberships.use_hlp || data.userMemberships.use_ffp) {
          $scope.loyaltyTabEnabled = true;
        } else {
          $scope.loyaltyTabEnabled = false;
        }
      });

      $scope.$on("loyaltyLevelAvailable", function ($event, level) {
        $scope.guestCardData.selectedLoyaltyLevel = level;
      });
      $scope.loyaltiesStatus = { 'ffp': false, 'hlps': false };
      $scope.$setLoyaltyStatus = function (data, type) {
        $scope.loyaltiesStatus[type] = data.active;
        if ($scope.loyaltiesStatus.ffp || $scope.loyaltiesStatus.hlps) {
          $scope.loyaltyTabEnabled = true;
        } else {
          $scope.loyaltyTabEnabled = false;
        }
        if ($scope.loyaltiesStatus.hlps) {
          $scope.guestCardData.loyaltyInGuestCardEnabled = true;
        } else {
          $scope.guestCardData.loyaltyInGuestCardEnabled = false;
        }
      };

      $scope.fetchLoyaltyStatus = function () {
        var loyaltyFetchsuccessCallbackhlps = function loyaltyFetchsuccessCallbackhlps(data) {
          $scope.$setLoyaltyStatus(data, 'hlps');
          $scope.$emit('hideLoader');
        };
        var loyaltyFetchsuccessCallbackffp = function loyaltyFetchsuccessCallbackffp(data) {
          $scope.$setLoyaltyStatus(data, 'ffp');
          $scope.$emit('hideLoader');
        };

        $scope.invokeApi(RVCompanyCardSrv.fetchHotelLoyaltiesHlps, {}, loyaltyFetchsuccessCallbackhlps);
        $scope.invokeApi(RVCompanyCardSrv.fetchHotelLoyaltiesFfp, {}, loyaltyFetchsuccessCallbackffp);
      };

      // Listener to update the guest card action manage btn status
      var guestCardActionButtonStatusUpdateListener = $scope.$on('UPDATE_GUEST_CARD_ACTIONS_BUTTON_STATUS', function (event, data) {
        $scope.manageCardState.isOpen = data.status;
      });

      $scope.$on('$destroy', guestCardActionButtonStatusUpdateListener);

      $scope.statisticsTabActiveView = 'summary';

      var statisticsTabActiveViewSetListener = $scope.$on('UPDATE_STATISTICS_TAB_ACTIVE_VIEW', function (event, data) {
        $scope.statisticsTabActiveView = data.activeView;
      });

      $scope.$on('$destroy', statisticsTabActiveViewSetListener);
    }]);

    angular.module('sntRover').controller('guestResults', ['$scope', '$timeout', function ($scope, $timeout) {

      BaseCtrl.call(this, $scope);
      var scrollerOptionsForGraph = { scrollX: true, click: true, preventDefault: false };

      $scope.setScroller('guestResultScroll', scrollerOptionsForGraph);

      $scope.$on("refreshGuestScroll", function () {
        $timeout(function () {
          $scope.refreshScroller('guestResultScroll');
        }, 500);
      });
    }]);
  }, {}] }, {}, [1]);