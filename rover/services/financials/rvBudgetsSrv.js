'use strict';

angular.module('sntRover').service('RVBudgetsSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {

    // Fetch charge codes/ market segments/ weekenddays
    this.getBudgetAssociatedTypes = function () {
        var deferred = $q.defer(),
            url = '/admin/budget_associated_types';

        BaseWebSrvV2.getJSON(url).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    // Fetch budget data for the selected Year
    this.getBudgetData = function (params) {
        var deferred = $q.defer(),
            url = '/admin/budgets';

        BaseWebSrvV2.getJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    // Save budget data
    this.saveBudget = function (params) {
        var deferred = $q.defer(),
            url = '/admin/budgets';

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    // Update budget data
    this.updateBudget = function (params) {
        var deferred = $q.defer(),
            url = '/admin/update_budgets';

        BaseWebSrvV2.putJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    // Upload budget CSV
    this.uploadBudgetCSV = function (params) {
        var deferred = $q.defer(),
            url = '/admin/budgets/import';

        BaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);