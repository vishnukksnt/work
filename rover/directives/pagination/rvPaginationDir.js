/*
 * Number pagination directive for Rover App.
 */
sntRover.directive('rvPagination', function() {

    var linkFn = function($scope, element, attr) {
        var pageOptions = {
            perPage: 50,   // Per page count default to 50.
            currentPage: 1,
            totalPages: 1,
            startCount: 1,
            endCount: 1
        }; 

        if (!($scope.pageOptions.api)) {
            console.error("rvPagination error : pageOptions should contain an API reference");
        }
        // To add missing params
        $scope.pageOptions = angular.extend(pageOptions, $scope.pageOptions);
        $scope.divClass = $scope.divClass || '';
    };

    return {
        restrict: 'AE',
        templateUrl: '/assets/directives/pagination/rvPaginationDir.html',
        scope: {
            pageOptions: '=pageOptions',
            pageData: '=pageData',
            divClass: '@divClass'
        },
        controller: 'rvPaginationCtrl',
        link: linkFn
    };
});
