'use strict';

angular.module('sntRover').service('rvQuickTextSrv', ['$q', 'BaseWebSrvV2', function ($q, BaseWebSrvV2) {

    this.fetchQuickTextData = function () {
        return BaseWebSrvV2.getJSON("/api/hotel_settings/quicktext/settings.json");
    };
}]);