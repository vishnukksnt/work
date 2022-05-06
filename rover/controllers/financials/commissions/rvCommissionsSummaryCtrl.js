'use strict';

sntRover.controller('RVCommissionsSummaryController', ['$scope', '$rootScope', '$stateParams', '$filter', 'RVCommissionsSrv', '$timeout', '$window', '$state', 'businessDate', 'rvUtilSrv', 'sntActivity', function ($scope, $rootScope, $stateParams, $filter, RVCommissionsSrv, $timeout, $window, $state, businessDate, util, sntActivity) {

    BaseCtrl.call(this, $scope);
    $scope.filterData = RVCommissionsSrv.filterData;

    var runDigestCycle = function runDigestCycle() {
        if (!$scope.$$phase) {
            $scope.$digest();
        }
    };

    var updateHeader = function updateHeader() {
        var isPrint = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        // Setting up the screen heading and browser title.
        // Need to change the header for print template
        var title = isPrint ? $filter('translate')('COMMISSIONS_REPORT_TITLE') : $filter('translate')('MENU_COMMISIONS');

        $scope.$emit('HeaderChanged', title);
        $scope.setTitle(title);
        $scope.$emit('updateRoverLeftMenu', 'commisions');
    };

    var refreshArOverviewScroll = function refreshArOverviewScroll() {
        $timeout(function () {
            $scope.refreshScroller('commissionOverViewScroll');
        }, 500);
    };

    var calculateTotalSelectedBillAmount = function calculateTotalSelectedBillAmount() {
        var total_amount = 0,
            totalBillAmountOnCurrentPage = 0;

        _.each($scope.commissionsData.accounts, function (account) {
            totalBillAmountOnCurrentPage += parseFloat(account.commission_amount);
            if (account.isSelected) {
                // if account is fully selected, the amount owing will be the total amount
                total_amount += parseFloat(account.commission_amount);
            } else {
                // sum the amounts owing for the selected reservations for the account
                if (account.reservationsData && account.reservationsData.reservations) {
                    _.each(account.reservationsData.reservations, function (reservation) {
                        if (reservation.isSelected) {
                            total_amount += parseFloat(reservation.commission_amount);
                        }
                    });
                }
            }
        });

        if ($scope.filterData.filterTab === 'PAID') {
            //  TODO: handle PAID tab when checkbox selection is shown
            $scope.commissionsData.selectedBillsAmount = $scope.commissionsData.amount_totals.paid;
        } else if (!$scope.allCommisionsSelected) {
            $scope.commissionsData.selectedBillsAmount = total_amount;
        } else {
            var totalAmountForSelectedTab;

            if ($scope.filterData.filterTab === 'ON_HOLD') {
                totalAmountForSelectedTab = $scope.commissionsData.amount_totals.on_hold;
            } else if ($scope.filterData.filterTab === 'PAYABLE') {
                totalAmountForSelectedTab = $scope.commissionsData.amount_totals.unpaid;
            } else {
                totalAmountForSelectedTab = $scope.commissionsData.amount_totals.paid;
            }

            $scope.commissionsData.selectedBillsAmount = parseFloat(totalAmountForSelectedTab) - totalBillAmountOnCurrentPage + total_amount;
        }
    };

    $scope.resetSelections = function () {
        $scope.noOfTASelected = 0;
        $scope.noOfBillsSelected = 0;
        $scope.noOfTAInOtherPagesSelected = 0;
        $scope.allCommisionsSelected = false;
        $scope.selectedAgentIds = [];
        $scope.commissionsData.selectedBillsAmount = 0;
        _.each($scope.commissionsData.accounts, function (account) {
            account.isSelected = false;
            account.isSemiSelected = false;
            account.isExpanded = false;
            account.isSemiSelected = false;
            account.reservationsData = {};
            account.selectedReservations = [];
        });
    };

    // clicked on the expandable icon
    $scope.expandCommision = function (account) {
        account.reservationsData = {};
        account.selectedReservations = [];
        // if already expanded, collapse
        if (account.isExpanded) {
            account.isExpanded = false;
            account.isSemiSelected = false;
        } else {
            account.fetchReservationData();
        }
        calculateTotalSelectedBillAmount();
    };

    // based on selections, the top menu changes.
    // check if all agents are selected
    $scope.areAllAgentsSelected = function () {
        return $scope.commissionsData.total_count > 0 && $scope.commissionsData.total_count === $scope.noOfTASelected;
    };

    // check if any one of the agents is selected
    $scope.areAgentsPartialySelected = function () {
        return $scope.noOfTASelected > 0 && $scope.commissionsData.total_count !== $scope.noOfTASelected;
    };

    // check if any one of the reservation inside any agent is selected
    $scope.areAnyReservationsPartialySelected = function () {
        if ($scope.commissionsData.accounts) {
            var isAnyReservationIsSelected = false;

            _.each($scope.commissionsData.accounts, function (account) {
                if (account.isExpanded && account.selectedReservations.length) {
                    isAnyReservationIsSelected = true;
                }
            });
            return isAnyReservationIsSelected;
        }
        return false;
    };

    var deleteFromSelectedAgentList = function deleteFromSelectedAgentList(account) {
        var indexOfOpenedAccount = $scope.selectedAgentIds.indexOf(account.id);

        if (indexOfOpenedAccount !== -1) {
            $scope.selectedAgentIds.splice(indexOfOpenedAccount, 1);
        }
    };

    var setReservationSelectedStatus = function setReservationSelectedStatus(account, isSelected, isSemiSelected) {
        account.isSelected = isSelected;
        account.isSemiSelected = isSemiSelected;
    };

    var addRemoveFromSelectedReservationsList = function addRemoveFromSelectedReservationsList(account, reservation) {
        var selectedIndex = account.selectedReservations.indexOf(reservation.id);

        if (account.isSelected) {
            // if the account was fully selected and then item is deselected, remove all unpaid bills
            // from no of bills selected and consider only the no of selected bills on the current page
            $scope.noOfBillsSelected = $scope.noOfBillsSelected - account.number_of_bills + account.selectedReservations.length;
        }

        // is checked and was not added before
        if (reservation.isSelected && selectedIndex === -1) {
            account.selectedReservations.push(reservation.id);
            $scope.noOfBillsSelected = $scope.noOfBillsSelected + 1;
        } else if (!reservation.isSelected && selectedIndex !== -1) {
            // was unchecked and was added before --> remove the item from array
            account.selectedReservations.splice(selectedIndex, 1);
            $scope.noOfBillsSelected = $scope.noOfBillsSelected - 1;
            if (account.isSelected) {
                $scope.noOfTASelected--;
            }
            if (account.selectedReservations.length > 0) {
                account.isSemiSelected = true;
            }
            account.isSelected = false;
        }
    };

    // based on the change in reservation selection, the corresponding 
    // agent and all agent selected/ semi selected flag need to be set.
    $scope.reservationSelectionChanged = function (account, reservation) {
        // if selected, add to the array
        addRemoveFromSelectedReservationsList(account, reservation);
        // set the checked status of the outer account, based on inner checkbox selections
        if (account.selectedReservations.length === 0) {
            // if no items are selected
            setReservationSelectedStatus(account, false, false);
            deleteFromSelectedAgentList(account);
        } else if (account.selectedReservations.length !== account.reservationsData.total_count) {
            // check if only some are selected
            setReservationSelectedStatus(account, false, true);
            deleteFromSelectedAgentList(account);
        } else if (account.selectedReservations.length === account.reservationsData.total_count) {
            // check if ALL reservations are selected
            // if so turn ON corresponding commision and based on other 
            // commisions, turn ON main allCommisionsSelected
            setReservationSelectedStatus(account, true, false);
            if ($scope.selectedAgentIds.indexOf(account.id) === -1) {
                $scope.selectedAgentIds.push(account.id);
            }
            $scope.noOfTASelected++;
        } else {
            return;
        }
        calculateTotalSelectedBillAmount();
    };

    var handleExpandedReservationsList = function handleExpandedReservationsList(account) {
        if (account.isSelected) {
            _.each(account.reservationsData.reservations, function (reservation) {
                reservation.isSelected = true;
                var indexOfRes = account.selectedReservations.indexOf(reservation.id);

                if (reservation.isSelected && indexOfRes === -1) {
                    account.selectedReservations.push(reservation.id);
                } else if (!reservation.isSelected && indexOfRes !== -1) {
                    account.selectedReservations.slice(indexOfRes, 1);
                }
            });
        } else {
            _.each(account.reservationsData.reservations, function (reservation) {
                reservation.isSelected = false;
            });
            account.selectedReservations = [];
        }
    };

    // based on the commision selection, set the no of bills.
    $scope.commisionSelectionChanged = function (account) {

        account.isSemiSelected = false;
        $scope.selectedAgentIds = [];
        // based on selection, update no of bills
        if (account.isSelected) {
            $scope.noOfTASelected++;
            // substract all selected Resevations and add all reservations again
            $scope.noOfBillsSelected = $scope.noOfBillsSelected - account.selectedReservations.length + account.number_of_bills;
        } else if ($scope.noOfTASelected > 0) {
            $scope.noOfTASelected--;
            $scope.noOfBillsSelected = $scope.noOfBillsSelected - account.number_of_bills;
        } else {
            $scope.noOfTASelected = 0;
            $scope.noOfBillsSelected = $scope.noOfBillsSelected - account.number_of_bills;
        }
        // check if any one of the entity is selected
        _.each($scope.commissionsData.accounts, function (account) {
            if (account.isSelected) {
                $scope.selectedAgentIds.push(account.id);
            }
        });
        // set the checked status of the inner reservations list
        if (account.isExpanded) {
            handleExpandedReservationsList(account);
        }
        calculateTotalSelectedBillAmount();
    };

    // check / uncheck all commisions dispayed based on the main selection
    $scope.allCommisionsSelectionChanged = function () {

        $scope.selectedAgentIds = [];

        // check/ uncheck all the commisions appearing
        _.each($scope.commissionsData.accounts, function (account) {
            account.isSelected = $scope.allCommisionsSelected;
            account.isExpanded = false;
            account.reservationsData = {};
            account.selectedReservations = [];
            account.isSemiSelected = false;
            if (account.isSelected) {
                $scope.selectedAgentIds.push(account.id);
            }
        });

        if ($scope.allCommisionsSelected) {
            $scope.noOfTASelected = $scope.commissionsData.total_count;
            $scope.noOfTAInOtherPagesSelected = $scope.commissionsData.total_count - $scope.commissionsData.accounts.length;
            $scope.noOfBillsSelected = $scope.filterData.filterTab === 'ON_HOLD' ? $scope.commissionsData.bill_count_totals.on_hold : $scope.commissionsData.bill_count_totals.open;
        } else {
            $scope.noOfTASelected = 0;
            $scope.noOfTAInOtherPagesSelected = 0;
            $scope.noOfBillsSelected = 0;
        }
        calculateTotalSelectedBillAmount();
    };

    // main tab switch - On Hold and To pay
    $scope.setFilterTab = function (selectedTab) {
        $scope.commissionsData = {};
        if (selectedTab === 'ON_HOLD') {
            $scope.filterData.billStatus.value = 'ON_HOLD';
        } else if (selectedTab === 'PAYABLE') {
            $scope.filterData.billStatus.value = 'UN_PAID';
        } else {
            $scope.filterData.billStatus.value = 'PAID';
        }
        $scope.fetchAgentsData();
        $scope.filterData.filterTab = selectedTab;
    };

    /**   *************** Search starts here *****************/

    var reservationsListFetchCompletedActions = function reservationsListFetchCompletedActions(account, response) {
        account.isExpanded = true;
        account.reservationsData = response;
        // if the account is selected, the reservation list 
        // inside should be selected
        _.each(account.reservationsData.reservations, function (reservation) {
            var indexOfRes = account.selectedReservations.indexOf(reservation.id);

            // if the account is selected, the expanded reservation list should also be selected
            reservation.isSelected = account.isSelected;

            if (reservation.isSelected && indexOfRes === -1) {
                account.selectedReservations.push(reservation.id);
            }
        });
        // start with page 1
        account.reservationsPageNo = 1;
        account.showResPagination = account.reservationsData.total_count > $scope.filterData.innerPerPage;
        $timeout(function () {
            $scope.$broadcast('updatePagination', 'RESERVATION_LIST_' + account.id);
        }, 100);
        refreshArOverviewScroll();
    };

    var setUpReserationsListForAgents = function setUpReserationsListForAgents() {
        _.each($scope.commissionsData.accounts, function (account) {
            account.isExpanded = false;
            account.fetchReservationData = function (pageNo) {
                var page = pageNo ? pageNo : 1;

                var onFetchListSuccess = function onFetchListSuccess(response) {
                    // reset selections to avoid issues with selection + pagination
                    account.selectedReservations = [];
                    account.isSemiSelected = false;
                    reservationsListFetchCompletedActions(account, response);
                };

                $scope.callAPI(RVCommissionsSrv.fetchReservationOfCommissions, {
                    params: {
                        id: account.id,
                        'page': page,
                        'per_page': $scope.filterData.innerPerPage,
                        'action_type': $scope.filterData.filterTab,
                        'begin_date': $scope.dateData.fromDateForAPI !== '' ? $filter('date')($scope.dateData.fromDateForAPI, 'yyyy-MM-dd') : '',
                        'end_date': $scope.dateData.toDateForAPI !== '' ? $filter('date')($scope.dateData.toDateForAPI, 'yyyy-MM-dd') : '',
                        'include_non_commissionable': $scope.filterData.non_commissionable
                    },
                    successCallBack: onFetchListSuccess,
                    failureCallBack: function failureCallBack(response) {
                        $scope.errorMessage = response;
                    }
                });
            };
            account.paginationData = {
                id: 'RESERVATION_LIST_' + account.id,
                api: account.fetchReservationData,
                perPage: $scope.filterData.innerPerPage
            };
        });
    };

    var getParams = function getParams() {
        return {
            'query': $scope.filterData.searchQuery,
            'page': $scope.filterData.page,
            'per_page': $scope.filterData.perPage,
            'bill_status': $scope.filterData.billStatus.value,
            'sort_by': $scope.filterData.sort_by.value,
            'min_commission_amount': $scope.filterData.minAmount,
            'begin_date': $scope.dateData.fromDateForAPI !== '' ? $filter('date')($scope.dateData.fromDateForAPI, 'yyyy-MM-dd') : '',
            'end_date': $scope.dateData.toDateForAPI !== '' ? $filter('date')($scope.dateData.toDateForAPI, 'yyyy-MM-dd') : '',
            'include_non_commissionable': $scope.filterData.non_commissionable
        };
    };

    $scope.fetchAgentsData = function (pageNo) {
        $scope.filterData.page = pageNo ? pageNo : 1;
        var onFetchSuccess = function onFetchSuccess(data) {
            $scope.commissionsData = data;
            setUpReserationsListForAgents();
            $scope.resetSelections();
            $scope.showPagination = !($scope.commissionsData.total_count <= $scope.filterData.perPage);
            $scope.errorMessage = '';
            $scope.$emit('hideLoader');
            refreshArOverviewScroll();
            $timeout(function () {
                $scope.$broadcast('updatePagination', 'TA_LIST');
            }, 100);
            $scope.initialLoading = false;
            $scope.sideFilterData.openSideFilter = false; // close the side filter
            calculateTotalSelectedBillAmount();
            $scope.filterData.noCommissionsMsg = setNoCommissionsMsg();
        };

        $scope.callAPI(RVCommissionsSrv.fetchCommissions, {
            params: getParams(),
            successCallBack: onFetchSuccess,
            failureCallBack: function failureCallBack(response) {
                $scope.errorMessage = response;
            }
        });
    };

    var setNoCommissionsMsg = function setNoCommissionsMsg() {
        var message = '';

        if ($scope.filterData.filterTab === 'PAYABLE') {
            message = 'There are no Travel Agents with Payable commission records';
        } else if ($scope.filterData.filterTab === 'ON_HOLD') {
            message = 'There are no Travel Agents with On Hold commission records';
        } else {
            message = 'There are no Travel Agents with Paid commission records';
        }

        message += $scope.filterData.searchQuery ? ' that match your search.' : '.';
        return message;
    };

    $scope.clearSearchQuery = function () {
        $scope.filterData.searchQuery = '';
        $scope.fetchAgentsData();
    };

    $scope.openSideFilters = function () {
        // set the filter data wrt applied filter data. Discard previous non applied filters
        $scope.sideFilterData.minAmount = angular.copy($scope.filterData.minAmount);
        $scope.sideFilterData.sort_by.value = angular.copy($scope.filterData.sort_by.value);
        $scope.sideFilterData.non_commissionable = angular.copy($scope.filterData.non_commissionable);

        $scope.sideFilterData.openSideFilter = !$scope.sideFilterData.openSideFilter;
    };

    $scope.returnNumberOfFilterApplied = function () {
        var filtersSelected = 0;

        if ($scope.filterData.minAmount.length) {
            filtersSelected++;
        }
        if ($scope.filterData.sort_by.value.length) {
            filtersSelected++;
        }
        if ($scope.filterData.non_commissionable) {
            filtersSelected++;
        }
        return filtersSelected;
    };

    $scope.applyFilter = function () {
        $scope.filterData.minAmount = angular.copy($scope.sideFilterData.minAmount);
        $scope.filterData.sort_by.value = angular.copy($scope.sideFilterData.sort_by.value);
        $scope.filterData.non_commissionable = angular.copy($scope.sideFilterData.non_commissionable);
        $scope.fetchAgentsData();
    };

    /* *************** search ends here **************************** */
    $scope.printButtonClick = function () {

        var printCompletedActions = function printCompletedActions() {
            $timeout(function () {
                // remove the orientation after similar delay
                removePrintOrientation();
            }, 100);
        },
            addPrintOrientation = function addPrintOrientation() {
            $('head').append('<style id=\'print-orientation\'>@page { size: landscape; }</style>');
        },

        // add the print orientation after printing
        removePrintOrientation = function removePrintOrientation() {
            $('#print-orientation').remove();
        },
            successCallback = function successCallback(data) {
            $scope.printData = data;
            $scope.$emit('hideLoader');
            updateHeader(true);
            $timeout(function () {
                addPrintOrientation();
                if (sntapp.cordovaLoaded) {
                    cordova.exec(printCompletedActions, function (error) {
                        // handle error if needed
                        printCompletedActions();
                    }, 'RVCardPlugin', 'printWebView', ['', '0', '', 'L']);
                } else {
                    $window.print();
                    printCompletedActions();
                }
                updateHeader();
            }, 500);
        };

        var printParams = getParams();

        printParams.travel_agent_ids = _.pluck($scope.commissionsData.accounts, 'id');

        $scope.callAPI(RVCommissionsSrv.printCommissionOverview, {
            params: printParams,
            successCallBack: successCallback,
            failureCallBack: function failureCallBack(response) {
                $scope.errorMessage = response;
            }
        });
    };

    $scope.navigateToTA = function (account) {
        sntActivity.start('NAVIGATING_TO_TA_COMMISSIONS');
        // https://stayntouch.atlassian.net/browse/CICO-40583
        // Can navigate to TA even if commission is off.
        $state.go('rover.companycarddetails', {
            id: account.id,
            fromDate: $scope.dateData.fromDateForAPI !== '' ? $filter('date')($scope.dateData.fromDateForAPI, 'yyyy-MM-dd') : '',
            toDate: $scope.dateData.toDateForAPI !== '' ? $filter('date')($scope.dateData.toDateForAPI, 'yyyy-MM-dd') : '',
            type: 'TRAVELAGENT',
            origin: 'COMMISION_SUMMARY'
        });
    };

    var fetchExportTypeData = function fetchExportTypeData() {
        var options = {
            params: {},
            successCallBack: function successCallBack(exportTypeData) {
                $scope.filterData.exportType = exportTypeData.export_type;
                $scope.filterData.non_commissionable = angular.copy(exportTypeData.export_type === 'onyx');
                $scope.sideFilterData.non_commissionable = angular.copy(exportTypeData.export_type === 'onyx');
                // fetch initial data
                $scope.fetchAgentsData();
            },
            failureCallBack: function failureCallBack() {
                $scope.filterData.exportType = '';
            }
        };

        $scope.callAPI(RVCommissionsSrv.fetchExportTypeData, options);
    };

    $scope.dateData = {};

    // set default from date as last week
    var lastWeekDay = new Date(tzIndependentDate(businessDate.business_date));

    lastWeekDay.setDate(lastWeekDay.getDate() - 7);
    // default from date, as per CICO-13899 it will be business date
    $scope.fromDate = $filter('date')(lastWeekDay, $rootScope.dateFormat);
    $scope.dateData.fromDateForAPI = $filter('date')(lastWeekDay, 'yyyy-MM-dd');

    // set end date as previous day
    var lastDay = new Date(tzIndependentDate(businessDate.business_date));

    lastDay.setDate(lastDay.getDate() - 1);
    $scope.toDate = $filter('date')(lastDay, $rootScope.dateFormat);
    $scope.dateData.toDateForAPI = $filter('date')(lastDay, 'yyyy-MM-dd');

    var fromDateChoosed = function fromDateChoosed(date, datePickerObj) {
        $scope.fromDate = date;
        $scope.dateData.fromDateForAPI = tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
        runDigestCycle();
        $scope.fetchAgentsData();
    };

    var toDateChoosed = function toDateChoosed(date, datePickerObj) {
        $scope.toDate = date;
        $scope.dateData.toDateForAPI = tzIndependentDate(util.get_date_from_date_picker(datePickerObj));
        runDigestCycle();
        $scope.fetchAgentsData();
    };

    $scope.clearFromDate = function () {
        $scope.fromDate = '';
        $scope.dateData.fromDateForAPI = '';
        // TODO: find why the input value is not clearing on setting model empty.
        $('#commisions-date-from').val('');
        runDigestCycle();
        $scope.fetchAgentsData();
    };

    $scope.clearToDate = function () {
        $scope.toDate = '';
        $scope.dateData.toDateForAPI = '';
        // TODO: find why the input value is not clearing on setting model empty.
        $('#commisions-date-to').val('');
        runDigestCycle();
        $scope.fetchAgentsData();
    };

    // date picker options - Common
    var commonDateOptions = {
        showOn: 'button',
        dateFormat: $rootScope.jqDateFormat,
        changeYear: true,
        changeMonth: true,
        yearRange: "-5:+5"
    };

    // date picker options - From
    $scope.fromDateOptions = _.extend({
        onSelect: fromDateChoosed
    }, commonDateOptions);

    // date picker options - Departute
    $scope.toDateOptions = _.extend({
        onSelect: toDateChoosed
    }, commonDateOptions);

    (function () {
        updateHeader();
        $scope.errorMessage = '';
        $scope.commissionsData = {};
        $scope.filterData.filterTab = 'PAYABLE';
        $scope.filterData.billStatus.value = 'UN_PAID';
        // side filetr date is to be applied only after the apply filter button is clicked 
        $scope.sideFilterData = {
            'openSideFilter': false,
            'minAmount': '',
            'sort_by': {
                'value': 'NAME_ASC',
                'name': 'NAME_ASC'
            },
            'non_commissionable': false
        };

        // reset all filter values which are set from service
        $scope.filterData.non_commissionable = $scope.sideFilterData.non_commissionable;
        $scope.filterData.minAmount = '';
        $scope.filterData.searchQuery = '';
        $scope.filterData.selectedExportType = 'standard';
        $scope.filterData.receipientEmail = '';
        $scope.filterData.noCommissionsMsg = '';

        fetchExportTypeData();
        // set intial values
        $scope.noOfTASelected = 0;
        // if select ALL is applied, it will update all items in other pages also.
        $scope.noOfTAInOtherPagesSelected = 0;
        $scope.allCommisionsSelected = false;
        $scope.selectedAgentIds = [];
        $scope.pageNo = 1;
        $scope.noOfBillsSelected = 0;
        $scope.paginationData = {
            id: 'TA_LIST',
            api: $scope.fetchAgentsData,
            perPage: $scope.filterData.perPage
        };
        $scope.setScroller('commissionOverViewScroll', {});
        $scope.initialLoading = true;
    })();
}]);