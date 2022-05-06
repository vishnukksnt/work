'use strict';

sntRover.directive('rvFileCloudStorage', function () {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: {
            cardType: '@',
            cardId: '@',
            showFiles: '=',
            cardName: '@',
            accountType: '@'
        },
        templateUrl: '/assets/directives/fileCloudStorage/partials/rvFileCloudStorage.html',
        controller: 'rvFileCloudStorageAndNotesCtrl'
    };
});