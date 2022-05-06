"use strict";

describe("RVGuestCardStatisticsController", function () {
    var $controller,
        $rootScope,
        $scope = {};

    beforeEach(function () {
        module("sntRover");

        inject(function (_$controller_, _$rootScope_) {
            $controller = _$controller_;
            $rootScope = _$rootScope_;
            $scope = $rootScope.$new();
        });

        $rootScope.businessDate = '2018-10-20';
        angular.extend($scope, {
            guestCardData: {
                userId: 10,
                contactInfo: {
                    first_stay_year: 2016
                }
            },
            myScroll: {}
        });

        $controller("RVGuestCardStatisticsController", {
            $scope: $scope
        });
    });

    it("Color should be green when the variance is positive", function () {
        expect($scope.getStatusClass(1)).toEqual("green");
    });

    it("Color should be red when the variance is negative", function () {
        expect($scope.getStatusClass(-10)).toEqual("red");
    });

    it("Get margin bottom when the 3 reservations are shown in the expanded monthly view", function () {
        var monthlyData = {
            reservations: {
                reservations: [1, 2, 3]
            },
            isOpen: true
        };

        expect($scope.getStyleForExpandedView(monthlyData)['margin-bottom']).toEqual('240px');
    });

    it("Get margin bottom when reservation view is in collapsed state", function () {
        var monthlyData = {
            reservations: {
                reservations: [1, 2, 3]
            },
            isOpen: false
        };

        expect($scope.getStyleForExpandedView(monthlyData)).toEqual({});
    });
});