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
        sntRover.controller('companyCardCommissionsCtrl', ['$scope', '$state', '$rootScope', '$stateParams', 'RVCompanyCardSrv', 'ngDialog', '$timeout', 'rvPermissionSrv', 'rvUtilSrv', '$window', '$vault', 'sntActivity', function ($scope, $state, $rootScope, $stateParams, RVCompanyCardSrv, ngDialog, $timeout, rvPermissionSrv, util, $window, $vault, sntActivity) {
            BaseCtrl.call(this, $scope);

            // Get the request parameters for the commission filtering
            var getRequestParams = function getRequestParams() {
                var params = {};

                if ($scope.filterData.fromDate) {
                    params.from_date = $scope.filterData.fromDate;
                }

                if ($scope.filterData.toDate) {
                    params.to_date = $scope.filterData.toDate;
                }
                params.paid_status = $scope.filterData.paidStatus;
                params.commission_status = $scope.filterData.commissionStatus;
                params.per_page = $scope.filterData.perPage;
                params.page = $scope.filterData.page;
                params.hotel_id = parseInt($scope.filterData.selectedHotel);
                return params;
            };

            $scope.setScroller('commission-list');
            var refreshScroll = function refreshScroll() {
                $timeout(function () {
                    $scope.refreshScroller('commission-list');
                }, 3000);
            };

            refreshScroll();
            // Refresh the scroller when the tab is active.
            $scope.$on('commissionsTabActive', function () {
                // CICO-46891
                fetchCommissionDetails(true);
            });

            var fetchCommissionDetailsForPage = function fetchCommissionDetailsForPage(page_no) {
                $scope.filterData.page = page_no || 1;
                fetchCommissionDetails(true);
            };

            // Fetches the commission details for the given filter options
            var fetchCommissionDetails = function fetchCommissionDetails(isPageChanged) {
                var hideLoaderIfWasStarted = function hideLoaderIfWasStarted() {
                    // check if this is the first time API call and was navigated from Commission summary
                    if (!$scope.filterData.commissionsLoaded && $stateParams.origin === 'COMMISION_SUMMARY') {
                        sntActivity.stop('NAVIGATING_TO_TA_COMMISSIONS');
                    }
                    return;
                };
                var onCommissionFetchSuccess = function onCommissionFetchSuccess(data) {

                    _.each(data.commission_details, function (element, index) {
                        _.extend(element, { is_checked: false });
                    });
                    $scope.currencySymbol = data.currency.symbol;
                    $scope.commissionDetails = data.commission_details;
                    $scope.commissionSummary.totalCommissionableRevenue = data.total_commissionable_revenue;
                    $scope.commissionSummary.totalReservationsRevenue = data.total_reservations_revenue;
                    $scope.commissionSummary.totalCommission = data.total_commission - data.total_commission_unpaid;
                    $scope.commissionSummary.totalUnpaidCommission = data.total_commission_unpaid;
                    $scope.commissionSummary.taxOnCommissions = data.tax_on_commissions;
                    // set pagination controls values
                    $scope.pagination.totalResultCount = data.total_count;
                    $timeout(function () {
                        $scope.$broadcast('updatePagination', $scope.paginationData.id);
                    }, 1000);
                    $scope.$emit('hideLoader');
                    refreshScroll();
                    hideLoaderIfWasStarted();
                    $scope.filterData.commissionsLoaded = true;
                    clearCurrentSelection();
                },
                    onCommissionFetchFailure = function onCommissionFetchFailure(error) {
                    $scope.$emit('hideLoader');
                    $scope.commissionDetails = [];
                    $scope.commissionSummary = {};
                    hideLoaderIfWasStarted();
                };

                var requestData = {};

                requestData.params = getRequestParams();
                requestData.accountId = $scope.accountId;
                // CICO-44105 : Removing api call on creating new cards.
                if ($scope.accountId !== 'add') {
                    $scope.invokeApi(RVCompanyCardSrv.fetchTACommissionDetails, requestData, onCommissionFetchSuccess, onCommissionFetchFailure);
                }
            };

            /* Checking permission for edit PAID & UNPAID   */

            $scope.hasPermissionToEditPaid = function () {
                return rvPermissionSrv.getPermissionValue('EDIT_COMMISSIONS_TAB');
            };

            /*
             * Navigate to staycard from commissions tab reservations
             * @param reservation_id reservation id
             * @param confirmation_no confirmation no
             */
            $scope.goToStayCard = function (reservation_id, confirmation_no) {
                if ($rootScope.hotelDetails.userHotelsData.current_hotel_id === parseInt($scope.filterData.selectedHotel)) {
                    $state.go('rover.reservation.staycard.reservationcard.reservationdetails', { 'id': reservation_id,
                        'confirmationId': confirmation_no,
                        'isrefresh': true,
                        'isFromTACommission': true }, {
                        reload: true
                    });
                }
            };

            $scope.clearToDateField = function () {
                $scope.filterData.toDate = '';
                $scope.onFilterChange();
            };
            $scope.clearFromDateField = function () {
                $scope.filterData.fromDate = '';
                $scope.onFilterChange();
            };

            $scope.shouldShowPagination = function () {
                return $scope.commissionDetails.length > 0 && $scope.pagination.totalResultCount > $scope.filterData.perPage;
            };

            // To handle from date change
            $scope.$on('fromDateChanged', function () {
                $scope.onFilterChange();
            });

            // To handle to date change
            $scope.$on('toDateChanged', function () {
                $scope.onFilterChange();
            });

            // Generic function to call on the change of filter parameters
            $scope.onFilterChange = function () {
                $scope.selectedCommissions = [];
                $scope.prePaidCommissions = [];
                fetchCommissionDetails(true);
            };

            /* Handling different date picker clicks */
            $scope.clickedFromDate = function () {
                $scope.popupCalendar('FROM');
            };
            $scope.clickedToDate = function () {
                $scope.popupCalendar('TO');
            };
            // Show calendar popup.
            $scope.popupCalendar = function (clickedOn) {
                $scope.clickedOn = clickedOn;
                ngDialog.open({
                    template: '/assets/partials/companyCard/contracts/rvCompanyCardContractsCalendar.html',
                    controller: 'RVCommissionsDatePickerController',
                    className: '',
                    scope: $scope
                });
            };

            var updateCommissionSummary = function updateCommissionSummary(commissionList) {
                var unpaidCommission = 0,
                    totalRevenue = 0,
                    paidCommission = 0;

                commissionList.forEach(function (commission) {
                    if (!isEmptyObject(commission.commission_data)) {
                        if (commission.commission_data.paid_status === 'Unpaid' || commission.commission_data.paid_status === 'On Hold') {
                            unpaidCommission += commission.commission_data.amount;
                        } else {
                            // count in Paid and Prepaid commission
                            paidCommission += commission.commission_data.amount;
                        }
                    }

                    totalRevenue += commission.commissionable_revenue;
                });

                $scope.commissionSummary.totalUnpaidCommission = unpaidCommission;
                $scope.commissionSummary.totalRevenue = totalRevenue;
                $scope.commissionSummary.totalCommission = paidCommission;
            };

            // Selecting individual record checkbox
            $scope.onCheckBoxSelection = function (commission) {
                $scope.filterData.commssionRecalculationValue = '';
                if (commission.is_checked) {
                    if (commission.commission_data.paid_status == 'Prepaid') {
                        $scope.prePaidCommissions.push(commission);
                    } else {
                        $scope.selectedCommissions.push(commission);
                    }
                } else {
                    $scope.selectedCommissions = _.filter($scope.selectedCommissions, function (value) {
                        return value.reservation_id != commission.reservation_id;
                    });
                    $scope.prePaidCommissions = _.filter($scope.prePaidCommissions, function (value) {
                        return value.reservation_id != commission.reservation_id;
                    });
                    // If any one of the items is unselected, set the all select flag to false
                    $scope.filterData.selectAll = false;
                }
                if ($scope.selectedCommissions.length == 0 && $scope.prePaidCommissions.length == 0) {
                    fetchCommissionDetails(false);
                    $scope.status.groupPaidStatus = '';
                } else {
                    $scope.status.groupPaidStatus = '';
                    var commissionList = $scope.selectedCommissions.concat($scope.prePaidCommissions);

                    updateCommissionSummary(commissionList);
                }

                // Check if all the items have been selected, if selected toggle on the select all checbox
                var isAllCommissionsSelected = _.every($scope.commissionDetails, function (commissionDetail) {
                    return commissionDetail.is_checked;
                });

                // TODO: Adding the fix to solve the selection issue. The code above this comment needs to be revisisted
                if ($scope.selectedCommissions.length === 0 && $scope.prePaidCommissions.length === 0) {
                    $scope.filterData.selectAll = false;
                    $scope.toggleSelection();
                } else if (isAllCommissionsSelected) {
                    $scope.filterData.selectAll = true;
                    $scope.toggleSelection();
                }
            };

            // Updates the checked status of the current  page records while making the whole selection
            var updateCheckedStatus = function updateCheckedStatus(status) {
                for (var i in $scope.commissionDetails) {
                    $scope.commissionDetails[i].is_checked = status;
                }
            };

            // Select all checkbox action
            $scope.toggleSelection = function () {

                $scope.filterData.commssionRecalculationValue = '';

                if ($scope.filterData.selectAll) {
                    updateCheckedStatus(true);
                    $scope.selectedCommissions = Object.assign([], $scope.commissionDetails);
                    $scope.prePaidCommissions = [];
                    updateCommissionSummary($scope.commissionDetails);
                    $scope.status.groupPaidStatus = '';
                } else {
                    updateCheckedStatus(false);
                    $scope.selectedCommissions = [];
                    $scope.prePaidCommissions = [];
                    fetchCommissionDetails(false);
                    $scope.status.groupPaidStatus = '';
                }
                $scope.isCommissionFilterTabOpened = true;
            };

            // Updates the paid status to the server
            var updatePaidStatus = function updatePaidStatus(reqData) {
                var onCommissionStatusUpdateSuccess = function onCommissionStatusUpdateSuccess(data) {
                    clearCurrentSelection();
                    fetchCommissionDetails(false);
                },
                    onCommissionStatusUpdateFailure = function onCommissionStatusUpdateFailure(error) {
                    clearCurrentSelection();
                    fetchCommissionDetails(false);
                };

                $scope.invokeApi(RVCompanyCardSrv.saveTACommissionDetails, reqData, onCommissionStatusUpdateSuccess, onCommissionStatusUpdateFailure);
            };

            // Clear the selections after the paid status updation as we are refreshing the list after that
            var clearCurrentSelection = function clearCurrentSelection() {
                $scope.selectedCommissions = [];
                $scope.prePaidCommissions = [];
                $scope.filterData.selectAll = false;
            };

            /*
             * Toggle global button
             */
            $scope.isTogglePaidStatusEnabled = function () {
                var isToggleEnabled = true;

                if ($scope.contactInformation.is_global_enabled) {
                    isToggleEnabled = false;
                    if (rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE')) {
                        isToggleEnabled = true;
                    }
                }
                return isToggleEnabled;
            };

            // Action for the paid/unpaid toggle button for individual record
            $scope.togglePaidStatus = function (commission) {

                var commissionToUpdate = {};

                commissionToUpdate.reservation_id = commission.reservation_id;
                commissionToUpdate.status = commission.commission_data.paid_status == 'Paid' ? 'Unpaid' : 'Paid';

                var requestData = {};

                requestData.accountId = $scope.accountId;
                requestData.commissionDetails = [commissionToUpdate];
                updatePaidStatus(requestData);
            };

            $scope.toggleHoldStatus = function ($event, commission) {
                if (commission.commission_data.paid_status == "Paid" || commission.commission_data.paid_status == "Prepaid") {
                    $scope.errorMessage = ['Only transactions on \'UNPAID\' status can be set to On Hold'];
                    $event.stopPropagation();
                    return;
                }

                var commissionToUpdate = {};

                commissionToUpdate.reservation_id = commission.reservation_id;
                commissionToUpdate.status = commission.commission_data.paid_status == 'On Hold' ? 'Unpaid' : 'On Hold';

                var requestData = {};

                requestData.accountId = $scope.accountId;
                requestData.commissionDetails = [commissionToUpdate];
                updatePaidStatus(requestData);
            };

            // Updates the paid status of all the selected records
            $scope.onGroupPaidStatusChange = function (isFromHoldStatus) {

                var commissionListToUpdate = [],
                    isSelectionError = false;

                if ($scope.filterData.selectAll) {
                    $scope.commissionDetails.forEach(function (commission) {
                        if (isFromHoldStatus && commission.commission_data.paid_status != 'Unpaid' && commission.commission_data.paid_status != 'On Hold') {
                            isSelectionError = true;
                        }
                        if (commission.commission_data.paid_status != 'Prepaid') {
                            commissionListToUpdate.push({ reservation_id: commission.reservation_id,
                                status: $scope.status.groupPaidStatus });
                        }
                    });
                } else {
                    $scope.selectedCommissions.forEach(function (commission) {
                        if (isFromHoldStatus && commission.commission_data.paid_status != 'Unpaid' && commission.commission_data.paid_status != 'On Hold') {
                            isSelectionError = true;
                        }
                        if (commission.commission_data.paid_status != 'Prepaid') {
                            commissionListToUpdate.push({ reservation_id: commission.reservation_id,
                                status: $scope.status.groupPaidStatus });
                        }
                    });
                }

                var requestData = {};

                requestData.accountId = $scope.accountId;
                requestData.commissionDetails = commissionListToUpdate;
                if (isSelectionError) {
                    $timeout(function () {
                        $scope.errorMessage = ["The hold status can be updated only for unpaid or on hold commissions"];
                    }, 500);
                } else {
                    updatePaidStatus(requestData);
                }
            };

            $scope.showToggleButton = function (commissionDetail) {
                var hasShownToggleBtn = commissionDetail.commission_data.paid_status == 'Paid' || commissionDetail.commission_data.paid_status == 'Unpaid';

                return hasShownToggleBtn ? { 'visibility': 'visible' } : { 'visibility': 'hidden' };
            };
            // add the print orientation before printing
            var addPrintOrientation = function addPrintOrientation() {
                $('head').append('<style id=\'print-orientation\'>@page { size: landscape; }</style>');
            },
                removePrintOrientation = function removePrintOrientation() {
                $('#print-orientation').remove();
            };

            $scope.$on("CLEAR_ERROR_MESSAGE", function () {
                $scope.errorMessage = '';
            });
            // To print the current screen details.
            $scope.clickedPrintButton = function () {

                addPrintOrientation();

                $('header .logo').addClass('logo-hide');
                $('header .h2').addClass('text-hide');
                var printCompletedActions = function printCompletedActions() {
                    $timeout(function () {
                        // CICO-9569 to solve the hotel logo issue
                        $('header .logo').removeClass('logo-hide');
                        $('header .h2').addClass('text-hide');

                        // remove the orientation after similar delay
                        removePrintOrientation();
                    }, 100);
                };

                $timeout(function () {
                    if (sntapp.cordovaLoaded) {
                        cordova.exec(printCompletedActions, function (error) {
                            // handle error if needed
                            printCompletedActions();
                        }, 'RVCardPlugin', 'printWebView', ['', '0', '', 'L']);
                    } else {
                        $window.print();
                        printCompletedActions();
                    }
                }, 100);
            };
            // Handle toggle commssion action
            $scope.toggleCommission = function () {
                $scope.filterData.toggleCommission = !$scope.filterData.toggleCommission;
            };
            // Method to fetch selected reservatio ids list
            var getSelectedReservationsHavingCommission = function getSelectedReservationsHavingCommission() {

                var commissionListToUpdate = [];

                if ($scope.filterData.selectAll) {
                    $scope.commissionDetails.forEach(function (commission) {
                        if (commission.commission_data.paid_status != 'Prepaid') {
                            commissionListToUpdate.push(commission.reservation_id);
                        }
                    });
                } else {
                    $scope.selectedCommissions.forEach(function (commission) {
                        if (commission.commission_data.paid_status != 'Prepaid') {
                            commissionListToUpdate.push(commission.reservation_id);
                        }
                    });
                }

                return commissionListToUpdate;
            };

            // Method to select toggle mode
            var getCommissionRecalculateType = function getCommissionRecalculateType() {
                var type = 'percent';

                if ($scope.filterData.toggleCommission) {
                    type = 'amount';
                }

                return type;
            };

            $scope.recalculationValueChanged = function () {
                if (isNaN($scope.filterData.commssionRecalculationValue)) {
                    $scope.filterData.commssionRecalculationValue = '';
                }
            };

            // Handle recalculate button click
            $scope.clickedRecalculate = function () {

                var recalculateCommissionSuccess = function recalculateCommissionSuccess(data) {
                    clearCurrentSelection();

                    $timeout(function () {
                        fetchCommissionDetails(false);
                    }, 2000);
                },
                    recalculateCommissionFailure = function recalculateCommissionFailure(error) {
                    $scope.errorMessage = error;
                    $scope.$emit('hideLoader');
                };

                var postData = {
                    'type': getCommissionRecalculateType(),
                    'value': $scope.filterData.commssionRecalculationValue,
                    'reservation_ids': getSelectedReservationsHavingCommission()
                };

                $scope.invokeApi(RVCompanyCardSrv.recalculateCommission, postData, recalculateCommissionSuccess, recalculateCommissionFailure);
            };
            /*
             * Fetch multi properties
             */
            var fetchMultiProperties = function fetchMultiProperties() {
                var onPropertyFetchSuccess = function onPropertyFetchSuccess(data) {

                    $scope.multiProperies = data.multi_properties;
                    $scope.$emit('hideLoader');
                };

                var requestData = {};

                requestData.accountId = $scope.accountId === "add" ? $scope.contactInformation.id : $scope.accountId;

                $scope.invokeApi(RVCompanyCardSrv.fetchMultiProperties, requestData, onPropertyFetchSuccess);
            };

            $scope.toggleFilter = function () {
                $scope.isCommissionFilterTabOpened = !$scope.isCommissionFilterTabOpened;
            };

            $scope.$on('LOAD_SUBSCRIBED_MPS', function () {
                if ($scope.contactInformation.is_global_enabled && $rootScope.isAnMPHotel && rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE') && $rootScope.hotelDetails.userHotelsData.hotel_list.length > 0 && rvPermissionSrv.getPermissionValue('MULTI_PROPERTY_SWITCH')) {
                    $scope.shouldShowPropertyDropDown = true;
                    fetchMultiProperties();
                } else {
                    $scope.shouldShowPropertyDropDown = false;
                    init();
                }
            });
            // CICO-47385 : Commissions: Status selection is not switching to "Commissionable" while opting a different property
            $scope.onPropertyFilterChange = function () {
                if ($rootScope.hotelDetails.userHotelsData.current_hotel_id !== parseInt($scope.filterData.selectedHotel)) {
                    $scope.filterData.commissionStatus = "Commissionable";
                }
                $scope.onFilterChange();
            };

            // Initailizes the controller
            var init = function init() {
                $scope.commissionDetails = [];
                $scope.commissionSummary = {};
                $scope.isCommissionFilterTabOpened = true;
                $scope.shouldShowPropertyDropDown = false;

                $scope.filterData = {
                    fromDate: $stateParams.fromDate,
                    toDate: $stateParams.toDate,
                    paidStatus: "Unpaid",
                    commissionStatus: "Commissionable",
                    perPage: 25, // RVCompanyCardSrv.DEFAULT_PER_PAGE,
                    page: 1,
                    start: 1,
                    selectAll: false,
                    toggleCommission: false,
                    commssionRecalculationValue: '',
                    // By default set the value to current hotel
                    selectedHotel: parseInt($rootScope.hotelDetails.userHotelsData.current_hotel_id),
                    commissionsLoaded: false
                };
                // NOTE: This controller runs under stay card too; In such a case, the $stateParams.id will have the reservation ID
                $scope.accountId = $state.current.name === 'rover.reservation.staycard.reservationcard.reservationdetails' ? $scope.travelAgentInformation.id : $stateParams.id;
                $scope.isEmpty = util.isEmpty;
                $scope.isEmptyObject = isEmptyObject;

                $scope.pagination = {
                    start: 1,
                    end: RVCompanyCardSrv.DEFAULT_PER_PAGE,
                    totalResultCount: 0
                };
                $scope.selectedCommissions = [];
                $scope.prePaidCommissions = [];
                $scope.status = {
                    groupPaidStatus: ''
                };
                $scope.businessDate = $rootScope.businessDate;
                // CICO-46891
                if ($scope.currentSelectedTab === 'cc-commissions') {
                    fetchCommissionDetails(true);
                }
                if ($state.current.name === 'rover.companycarddetails') {
                    $vault.set('travelAgentId', $stateParams.id);
                    $vault.set('travelAgentType', $stateParams.type);
                    $vault.set('travelAgentQuery', $stateParams.query);
                }

                $scope.paginationData = {
                    id: 'RESERVATION_LIST_' + $scope.accountId,
                    api: fetchCommissionDetailsForPage,
                    perPage: $scope.filterData.perPage
                };
            };

            init();
        }]);
    }, {}] }, {}, [1]);