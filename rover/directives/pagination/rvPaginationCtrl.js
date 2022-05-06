/*
 * Number pagination directive - controller.
 */
sntRover.controller('rvPaginationCtrl', ['$scope', '$attrs', function($scope, $attrs) {

    // Initializing variables
    $scope.showCount    = 5;
    $scope.internalPageChange = false;      // Variable for detecting internal page change or not.
    $scope.currentFocus = 1;                // For handling page no. list scroll
    /*
     *   Handle page scroll( Next/Prev actions )
     *   @param  {number} [Destination page number]
     */
    $scope.setScroll = function(page) {
        $scope.currentFocus = page;
        $scope.pageNoArray  = getPageNoArray($scope.currentFocus, $scope.pageOptions.totalPages, $scope.showCount);
    };

    /*
     *   Handle page navigation on clicking page no button ( Internal page change )
     *   @param  {number} [Destination page number]
     *   @return {undefined}
     */
    $scope.gotoPage = function(page) {

        if (page !== $scope.pageOptions.currentPage) {

            $scope.internalPageChange = true;
            $scope.pageOptions.currentPage = page;

            // When the API doesn't need any additional params.
            if (typeof($scope.pageOptions.api) === "function") {
                $scope.pageOptions.api(page);       // invoking apiCall( pageNo )
            }
            // When the API need any additional params.
            // Expecting => api : [ apiCall , additional_params ]
            else {
                var apiCall = $scope.pageOptions.api[0],
                    params  = $scope.pageOptions.api.slice(1);

                params.push(page);
                apiCall.apply($scope, params);      // invoking apiCall( additional_params, pageNo )
            }
        }
    };

    /*
     *   Function to generate page no list on view
     *   @param  {number} current page, total pages, show count
     *   @return  {object} Object containing array of 3 no.s and two delimeter flags
     */
    var getPageNoArray = function(currentPage, totalPages, showCount) {

        var pageNoList = {
            firstDelim: false,
            lastDelim: false,
            numbers: []
        };

        showCount = showCount || 5;     // Maximun number of page number buttons showing. default to 5.

        if (totalPages <= showCount) {
            for (var i = 2; i < totalPages; i++) {
                pageNoList.numbers.push(i);
            }
        }
        else if (currentPage < 4) {
            for (var i = 2; i <= 4; i++) {
                pageNoList.numbers.push(i);
            }
            pageNoList.lastDelim = true;
        }
        else if (currentPage >= (totalPages - 2)) {
            pageNoList.firstDelim = true;
            for (var i = totalPages - 3; i < totalPages; i++) {
                pageNoList.numbers.push(i);
            }
        }
        else {
            pageNoList.firstDelim = true;
            for (var i = currentPage - 1; i <= (currentPage + 1); i++) {
                pageNoList.numbers.push(i);
            }
            pageNoList.lastDelim = true;
        }

        return pageNoList;
    };

    /*
     *   Event to handle API callback
     *   @param  {string} [paginationId(optional)]
     *   @return {undefined}
     */
    var updatePaginationationHandler = $scope.$on('updatePagination', function( event, paginationId ) {

        // Only either no pagination Id or both are in match
        if (!($scope.pageOptions.id) || ($scope.pageOptions.id === paginationId)) {
            
            // Internal page transition by clicking any page number buttons in the directive.
            if ($scope.internalPageChange) {
                $scope.internalPageChange = false;
            }
            else {
                // If External page transition by search, filters etc. then reset current page to 1.
                $scope.pageOptions.currentPage = 1;
            }
            
            /*  
             *  ------------------------  Setting totalCount value ------------------------------------
             *  If we pass pageData as type {object} - expecting [total_count] as a @param inside that.
             *  If we are not passing pageData as type {object}, and it exist, directly sets the value.
             *  ---------------------------------------------------------------------------------------
             */
            if (typeof($scope.pageData) === "object") {
                $scope.totalCount = $scope.pageData.total_count;
            }
            else if (typeof($scope.pageData) !== "undefined") {
                $scope.totalCount = $scope.pageData;
            }
            else {
                console.error("rvPagination error : undefined pageData");
            }

            $scope.pageOptions.totalPages = Math.ceil($scope.totalCount / $scope.pageOptions.perPage);
            $scope.setScroll($scope.pageOptions.currentPage);
        }
    });

    var updatePageNoHandler = $scope.$on('updatePageNo', function( event, currentPage) {
        $scope.pageOptions.currentPage = currentPage;
    });

    $scope.$on( '$destroy', updatePaginationationHandler );
    $scope.$on( '$destroy', updatePageNoHandler );

}]);
