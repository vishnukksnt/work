angular.module('sntRover').controller('rvGroupSearchCtrl', [
    '$scope',
    '$rootScope',
    'rvGroupSrv',
    'initialGroupListing',
    'businessDate',
    '$filter',
    '$timeout',
    '$state',
    'rvUtilSrv',
    'rvPermissionSrv',
    '$stateParams',
    function($scope,
        $rootScope,
        rvGroupSrv,
        initialGroupListing,
        businessDate,
        $filter,
        $timeout,
        $state,
        util,
        rvPermissionSrv,
        $stateParams) {

        BaseCtrl.call(this, $scope);

        var PAGINATION_ID = 'GROUP_LIST';

        /**
         * util function to check whether a string is empty
         * we are assigning it as util's isEmpty function since it is using in html
         * @param {String/Object}
         * @return {boolean}
         */
        $scope.isEmpty = util.isEmpty;
        $scope.groupStatusObj = {
            isExpanded: false,
            list: []
        };

        /**
         * util function to get CSS class against diff. Hold status
         * @param {Object} - group
         * @return {String}
         */
        $scope.getClassAgainstHoldStatus = function(group) {
            // https://stayntouch.atlassian.net/browse/CICO-13899?focusedCommentId=42708&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-42708
            // API returns a string value for 'is_take_from_inventory'
            return group.is_take_from_inventory === 'true' ? '' : 'tentative';
        };

        var isCancelledGroup = function(group) {
            return (group.hold_status.toLowerCase() === 'cancel');
        };

        /**
         * util function to get CSS class against diff. Hold status
         * @param {Object} - group
         * @return {String}
         */
        $scope.getClassAgainstPickedStatus = function(group) {
            var classes = '';

            // Add class "green" if No. > 0
            if (group.total_picked_count > 0) {
                classes = 'green';
            }
            // Add class "red" if cancelled
            if (isCancelledGroup(group)) {
                classes += ' red';
            }
            return classes;
        };

        /**
         * util function to get CSS class against guest for arrival
         * @param {Object} - group
         * @return {String}
         */
        $scope.getGuestClassForArrival = function(group) {
            // "cancel" if cancelled, "check-in" if not cancelled
            var classes = isCancelledGroup(group) ? 'cancel' : 'check-in';

            return classes;
        };

        /**
         * util function to get CSS class against guest for arrival
         * @param {Object} - group
         * @return {String}
         */
        $scope.getGuestClassForDeparture = function(group) {
            // "cancel" if cancelled, 'check-out' if not cancelled
            var classes = isCancelledGroup(group) ? 'cancel' : 'check-out';

            return classes;
        };

        /**
         * Function to clear from Date
         * @return {None}
         */
        $scope.clearFromDate = function() {
            $scope.fromDate = '';
            $scope.fromDateForAPI = '';

            runDigestCycle();

            // we have to search on changing the from date
            $scope.search();
        };

        /**
         * Function to clear to Date
         * @return {None}
         */
        $scope.clearToDate = function() {
            $scope.toDate = '';
            $scope.toDateForAPI = '';

            runDigestCycle();

            // we have to search on changing the from date
            $scope.search();
        };

        /**
         * Function to clear to search query
         * @return {None}
         */
        $scope.clearSearchQuery = function() {
            $scope.query = '';
            runDigestCycle();

            // we have to search on changing the from date
            $scope.search();
        };

        /**
         * function to stringify a string
         * sample use case:- directive higlight filter
         * sometimes through error parsing speial charactes
         * @param {String}
         * @return {String}
         */
        $scope.stringify = util.stringify;

        /**
         * to run angular digest loop,
         * will check if it is not running
         * return - None
         */
        var runDigestCycle = function() {
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        };

        /**
         * when the from Date choosed,
         * will assign fromDate to using the value got from date picker
         * return - None
         */
        var fromDateChoosed = function(date, datePickerObj) {
            $scope.fromDate = date;
            $scope.fromDateForAPI = tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

            runDigestCycle();

            // we have to search on changing the from date
            $scope.search();
        };

        /**
         * when the from Date choosed,
         * will assign fromDate to using the value got from date picker
         * return - None
         */
        var toDateChoosed = function(date, datePickerObj) {
            $scope.toDate = date;
            $scope.toDateForAPI = tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

            runDigestCycle();

            // we have to search on changing the to date
            $scope.search();
        };

        /**
         * Event propogated by ngrepeatstart directive
         * we used to show activity indicator
         */
        $scope.$on('NG_REPEAT_STARTED_RENDERING', function(event) {
            $scope.$emit('showLoader');
        });

        /**
         * Event propogated by ngrepeatend directive
         * we used to hide activity indicator & refresh scroller
         */
        $scope.$on('NG_REPEAT_COMPLETED_RENDERING', function(event) {
            $timeout(function() {
                refreshScrollers();
            }, 300);
            $scope.$emit('hideLoader');
        });

        /**
         * when there is any change in search query
         * this function will execute
         * @return {None}
         */
        $scope.hasPermissionToAddNewGroup = function() {
            return (rvPermissionSrv.getPermissionValue('CREATE_GROUP_SUMMARY'));
        };

        /**
         * when there is any change in search query
         * this function will execute
         * @return {None}
         */
        $scope.searchQueryChanged = function() {
            if ($scope.isEmpty($scope.query)) {
                return false;
            }

            $scope.search();
        };

        // Utility method to get selected status list.
        var fetchStatusIdList = function() {
            var statusIdList = [];

            if ($scope.groupStatusObj.list.length > 0) {
                _.each($scope.groupStatusObj.list, function( item ) {
                    if (item.active) {
                        statusIdList.push(item.id);
                    }
                });
            }

            return statusIdList;
        };

        /**
         * Utility function to form API params for group search
         * @param {Number} pageNo current page no
         * @return {Object} params Object containing the value of all filters chosen
         */
        var formGroupSearchParams = function(pageNo) {
            var params = {
                query: $scope.query,
                from_date: $scope.fromDateForAPI !== '' ? $filter('date')($scope.fromDateForAPI, $rootScope.dateFormatForAPI) : '',
                to_date: $scope.toDateForAPI !== '' ? $filter('date')($scope.toDateForAPI, $rootScope.dateFormatForAPI) : '',
                per_page: $scope.perPage,
                page: pageNo,
                status_ids: fetchStatusIdList()
            };

            return params;
        };

        /**
         * Search for groups with the given set of params
         * @param {Number} pageNo current page no
         * @return {void}
         */
        $scope.search = function(pageNo) {
            // am trying to search something, so we have to change the initial search helping screen if no rsults
            $scope.amFirstTimeHere = false;
            pageNo = pageNo || 1;

            var params = formGroupSearchParams(pageNo),
                options = {
                    params: params,
                    successCallBack: successCallBackOfSearch,
                    successCallBackParameters: pageNo,
                    failureCallBack: failureCallBackOfSearch
                };

            $scope.callAPI(rvGroupSrv.getGroupList, options);
        };

        /**
         * on success of search API
         * @param {Array} - array of objects - groups
         * @return {None}
         */
        var successCallBackOfSearch = function(data, pageNo) {
            // groupList
            $scope.groupList = data.groups;

            // total result count
            $scope.totalResultCount = data.total_count;

            refreshScrollers();

            $scope.refreshPagination(PAGINATION_ID);

            setTimeout(function() {
                $scope.$broadcast('updatePageNo', pageNo);
            }, 150);
        };

        /**
         * on success of search API
         * @param {Array} - error messages
         * @return {None}
         */
        var failureCallBackOfSearch = function(error) {
            $scope.errorMessage = error;
        };

        /**
         * utility function to set datepicker options
         * return - None
         */
        var setDatePickerOptions = function() {
            // date picker options - Common
            var commonDateOptions = {
                showOn: 'button',
                dateFormat: $rootScope.jqDateFormat,
                numberOfMonths: 1
            };

            // date picker options - From
            $scope.fromDateOptions = _.extend({
                onSelect: fromDateChoosed
            }, commonDateOptions);

            // date picker options - Departute
            $scope.toDateOptions = _.extend({
                onSelect: toDateChoosed
            }, commonDateOptions);

            // default from date, as per CICO-13899 it will be business date
            $scope.fromDate = $filter('date')(tzIndependentDate(businessDate.business_date),
                $rootScope.dateFormat);
            $scope.fromDateForAPI = tzIndependentDate(businessDate.business_date);

            // default to date, as per CICO-13899 it will be blank
            $scope.toDate = '';
            $scope.toDateForAPI = '';
        };

        /**
         * utiltiy function for setting scroller and things
         * return - None
         */
        var setScrollerForMe = function() {
            // setting scroller things
            var scrollerOptions = {
                tap: true,
                preventDefault: false,
                deceleration: 0.0001,
                shrinkScrollbars: 'clip'
            };

            $scope.setScroller('result_showing_area', scrollerOptions);
        };

        /**
         * utiltiy function for setting scroller and things
         * return - None
         */
        var refreshScrollers = function() {
            $scope.refreshScroller('result_showing_area');
        };

        /**
         * Pagination things
         */
        var setInitialPaginationValues = function() {
            // pagination
            $scope.perPage = rvGroupSrv.DEFAULT_PER_PAGE;
            $scope.start = 1;
            $scope.end = initialGroupListing.groups.length;

            // what is page that we are requesting in the API
            $scope.page = 1;
        };

        /**
         * we want to display date in what format set from hotel admin
         * @param {String/DateObject}
         * @return {String}
         */
        $scope.formatDateForUI = function(date_) {
            var type_ = typeof date_,
                returnString = '';

            switch (type_) {
                // if date string passed
                case 'string':
                    returnString = $filter('date')(new tzIndependentDate(date_), $rootScope.dateFormat);
                    break;

                    // if date object passed
                case 'object':
                    returnString = $filter('date')(date_, $rootScope.dateFormat);
                    break;
            }
            return (returnString);
        };

        /**
         * should we show pagination area
         * @return {Boolean}
         */
        $scope.shouldShowPagination = function() {
            return ($scope.totalResultCount >= $scope.perPage);
        };

        /**
         * has there any search results?
         * @return {Boolean}
         */
        var hasSomeSearchResults = function() {
            return ($scope.groupList && $scope.groupList.length > 0);
        };

        /**
         * [isFirstTimeWithNoResult description]
         * @return {Boolean} [description]
         */
        $scope.isFirstTimeWithNoResult = function() {
            return ($scope.amFirstTimeHere && !hasSomeSearchResults());
        };

        /**
         * [shouldShowNoResult description]
         * @return {[type]} [description]
         */
        $scope.shouldShowNoResult = function() {
            return (!$scope.amFirstTimeHere && !hasSomeSearchResults());
        };

        // just redirecting to group creation page
        $scope.gotoAddNewGroup = function() {
            $state.go('rover.groups.config', {
                'id': "NEW_GROUP",
                'newGroupName': $scope.query
            });
        };

        var getFilterParams = function() {
            return {
                fromDate: $scope.fromDate,
                fromDateForAPI: $scope.fromDateForAPI,
                toDate: $scope.toDate,
                toDateForAPI: $scope.toDateForAPI,
                query: $scope.query,
                page: $scope.pageOptions.currentPage,
                groupStatusObj: $scope.groupStatusObj
            };
        };

        var checkCachedFilterData = function() {
            var data = rvGroupSrv.getCache();

            // Once we entered group details screen and trying to came back to group list,
            // We will be showing the same state of data list with the filters selected as before.
            if (data && $stateParams.origin === 'BACK_TO_GROUP_SEARCH_LIST') {
                setDatePickerOptions();

                $scope.fromDate = data.fromDate;
                $scope.fromDateForAPI = data.fromDateForAPI;
                $scope.toDate = data.toDate;
                $scope.toDateForAPI = data.toDateForAPI;
                
                $scope.query = data.query;
                $scope.groupStatusObj = data.groupStatusObj;

                $scope.search(data.page);
                // Clearing cached data.
                rvGroupSrv.clearCache();
            }
            else {
                // date related setups and things
                setDatePickerOptions();

                // groupList
                $scope.groupList = initialGroupListing.groups;

                // total result count
                $scope.totalResultCount = initialGroupListing.total_count;

                // populate data for Group status dropdown-chboxes filter.
                fetchHoldStatusList();

                $scope.refreshPagination(PAGINATION_ID);
            }
        };

        /**
         * Navigate to the group configuration state for editing the group
         * @return undefined
         */
        $scope.gotoEditGroupConfiguration = function(groupId) {
            var params = getFilterParams();

            rvGroupSrv.updateCache(params);
            $state.go('rover.groups.config', {
                id: groupId,
                activeTab: 'SUMMARY'
            });
        };

        // Configuration pagination options for the directive
        var configurePagination = function () {
            $scope.pageOptions = {
                id: PAGINATION_ID,
                perPage: $scope.perPage,
                api: $scope.search
            };
        };

        // Fetch hold status list
        var fetchHoldStatusList = function() {
            var successCallBackOfgetHoldStatusList = function( data ) {
                $scope.groupStatusObj.list = data.hold_status;
            },
            options = {
                params: {
                    is_group: true
                },
                successCallBack: successCallBackOfgetHoldStatusList
            };

            $scope.callAPI(rvGroupSrv.getHoldStatusList, options);
        };

        // Handle Group status filter expansion toggle.
        $scope.clickedGroupStatus = function() {
            $scope.groupStatusObj.isExpanded = !$scope.groupStatusObj.isExpanded;
        };

        // Handle click on individual group status item checkbox.
        $scope.clickedGroupStatusItem = function( index ) {
            var clickedItem = $scope.groupStatusObj.list[index];

            clickedItem.active = !clickedItem.active;
            $scope.search();
        };

        /**
         * function used to set initlial set of values
         * @return {None}
         */
        var initializeMe = (function() {
            // chnaging the heading of the page
            $scope.setHeadingTitle('GROUPS');

            // updating the left side menu
            $scope.$emit("updateRoverLeftMenu", "menuManageGroup");

            // Yes am first time here
            $scope.amFirstTimeHere = true;

            // scroller and related things
            setScrollerForMe();

            // pagination & API things
            setInitialPaginationValues();

            configurePagination();

            checkCachedFilterData();

        }());

    }
]);