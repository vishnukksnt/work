'use strict';

sntRover.controller('RVAutoChargeController', ['$scope', '$rootScope', '$timeout', 'RVAutoChargeSrv', 'ngDialog', '$filter', 'RVBillCardSrv', '$window', '$stateParams', 'rvUtilSrv', function ($scope, $rootScope, $timeout, RVAutoChargeSrv, ngDialog, $filter, RVBillCardSrv, $window, $stateParams, util) {

    BaseCtrl.call(this, $scope);

    var that = this,
        isFromStayCard = $stateParams.isFromStayCard,
        commonDateOptions = {
        dateFormat: $rootScope.jqDateFormat,
        changeYear: true,
        changeMonth: true,
        yearRange: '-10:',
        maxDate: tzIndependentDate($rootScope.businessDate)
    },
        EOD = 'EOD_TAB',
        DEPOSIT = 'DEPOSIT_TAB',

    /*
     * function handle date changes event and Calls API
     * @return - {None}
     */
    dueDateChoosed = function dueDateChoosed(date, datePicker) {
        var dueDate = new tzIndependentDate(util.get_date_from_date_picker(datePicker));

        $scope.filters.due_date = $filter('date')(tzIndependentDate(dueDate), 'dd/MM/yyyy');
        $scope.due_date = date;
        $scope.fetchAutoCharge();
    },

    // add the print orientation before printing
    addPrintOrientation = function addPrintOrientation() {
        $('head').append('<style id=\'print-orientation\'>@page { size: portrait; }</style>');
    },

    // add the print orientation after printing
    removePrintOrientation = function removePrintOrientation() {
        $('#print-orientation').remove();
    },

    // To refresh the scroll
    refreshScroll = function refreshScroll() {
        $timeout(function () {
            $scope.refreshScroller('chargeScroller');
        }, 1000);
    },

    /*
     * function Configure Pagination Settings
     * @return - {None}
     */
    setPaginationConfig = function setPaginationConfig() {
        $scope.paginationConfig = {
            id: 'AUTO_CHARGE',
            api: $scope.fetchAutoCharge,
            perPage: 25
        };
    },

    /*
     * function Confidure DatePicker settings
     * @return - {None}
     */
    setDueDateOptions = function setDueDateOptions() {
        $scope.dueDateOptions = _.extend({
            onSelect: dueDateChoosed
        }, commonDateOptions);
    },

    /*
     * function Confidure scroller settings
     * @return - {None}
     */
    setScrollerOptions = function setScrollerOptions() {
        var scrollOptions = {
            preventDefaultException: { tagName: /^(INPUT|LI)$/ },
            preventDefault: false
        };

        $scope.setScroller('chargeScroller', scrollOptions);
    },

    /*
     * function to set Headinng
     * @return - {None}
     */
    setTitleAndHeading = function setTitleAndHeading() {
        var title = $filter('translate')('AUTO_CHARGE');

        $scope.setTitle(title);
        $scope.$parent.heading = title;
    },

    /*
     * function to filter params and call API
     * @return - {None}
     */
    setParamsAndFetchAutoCharge = function setParamsAndFetchAutoCharge() {
        if (isFromStayCard) {
            $scope.filters = RVAutoChargeSrv.getStateData().filters;
            $scope.due_date = RVAutoChargeSrv.getStateData().due_date;
            $scope.selectedTab = RVAutoChargeSrv.getStateData().selectedTab;
            $scope.fetchAutoCharge($scope.filters.page_no);
        } else {
            $scope.filters = {
                status: 'ALL',
                due_date: $filter('date')(tzIndependentDate($rootScope.businessDate), 'dd/MM/yyyy')
            };
            $scope.due_date = $filter('date')(tzIndependentDate($rootScope.businessDate), $rootScope.dateFormat);
            $scope.selectedTab = DEPOSIT;
            $scope.fetchAutoCharge();
        }
    },

    /*
     * function to set selection value
     * @return - [ObjList]
     */
    processAutoChargeSelections = function processAutoChargeSelections(autoCharges, value) {
        return _.map(autoCharges, function (autoCharge) {
            autoCharge.bill_balance = autoCharge.debits - autoCharge.credits;

            return _.extend(autoCharge, { 'isSelected': value });
        });
    },

    /*
     * function reset autocharge selction values
     * @return - none
     */
    resetSelections = function resetSelections() {
        $scope.isPartiallySelected = false;
        $scope.isAllSelected = false;
    },

    /*
     * function forms array of selected reservation ids
     * @return - [Integer]
     */
    generateRetryData = function generateRetryData() {
        var retryData = [];

        _.map($scope.autoCharges, function (autoCharge) {
            if (autoCharge.isSelected) {
                retryData.push({
                    reservation_id: autoCharge.reservation_id,
                    amount: autoCharge.deposit_paid
                });
            }
        });
        return retryData;
    };

    /*
     * function handle selection event for auto charge
     * @return - noe
     */
    $scope.handleAutoChargeSelection = function (selection_type) {
        var declinedAutoCharges = _.filter($scope.autoCharges, function (autoCharge) {
            return autoCharge.is_declined && autoCharge.can_retry_processing;
        });

        $scope.isDeclinedAutoChargesPresent = declinedAutoCharges.length !== 0;
        if (selection_type === 'ALL') {
            $scope.autoCharges = processAutoChargeSelections($scope.autoCharges, $scope.isAllSelected);
            $scope.isPartiallySelected = false;
        } else {
            $scope.isAllSelected = _.every(declinedAutoCharges, function (autoCharge) {
                return autoCharge.isSelected;
            });
            $scope.isPartiallySelected = _.some(declinedAutoCharges, function (autoCharge) {
                return autoCharge.isSelected;
            });
        }
    };
    // print the page
    that.printBill = function () {
        // CICO-9569 to solve the hotel logo issue
        $('header .logo').addClass('logo-hide');
        $('header .h2').addClass('text-hide');
        // add the orientation
        addPrintOrientation();

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
                }, 'RVCardPlugin', 'printWebView', ['', '0', '', 'P']);
            } else {
                $window.print();
                printCompletedActions();
            }
        }, 100);
    };

    // print bill
    $scope.clickedPrint = function () {
        $scope.closeDialog();
        that.printBill();
    };
    $scope.selectHeaderTab = function (value) {
        $scope.selectedTab = value;
        $scope.fetchAutoCharge();
    };
    // Call Api to load Auto Charge Details
    $scope.fetchAutoCharge = function (pageNo) {
        var params = {
            page_no: pageNo || 1,
            status: $scope.filters.status,
            due_date: $scope.filters.due_date,
            per_page: $scope.paginationConfig.perPage
        },
            stateData = {
            filters: params,
            due_date: $scope.due_date,
            selectedTab: $scope.selectedTab
        };

        RVAutoChargeSrv.setStateData(stateData);
        var options = {
            params: params,
            successCallBack: function successCallBack(response) {
                resetSelections();
                $scope.autoCharges = processAutoChargeSelections(response.details, false);
                $scope.totalCount = response.total_count;
                if (response.total_deposit) {
                    $scope.totalDeposite = response.total_deposit;
                }
                $scope.isAutoChargeProcessing = !!response.auto_charge_deposit_running;

                $timeout(function () {
                    $scope.handleAutoChargeSelection();
                    $scope.$broadcast('updatePagination', 'AUTO_CHARGE');
                    $scope.$broadcast('updatePageNo', params.page_no);
                    refreshScroll();
                }, 100);
            }
        };

        if ($scope.selectedTab !== EOD) {
            $scope.callAPI(RVAutoChargeSrv.fetchAutoCharge, options);
        } else {
            $scope.callAPI(RVAutoChargeSrv.fetchEodAutoCharge, options);
        }
    };
    // Call Api to process declined charges
    $scope.processSelectedAutoCharges = function () {
        var params = {
            due_date: $scope.filters.due_date,
            retry_data: generateRetryData()
        },
            options = {
            params: params,
            successCallBack: function successCallBack() {
                $timeout(function () {
                    $scope.fetchAutoCharge();
                }, 3000);
            }
        };

        $scope.callAPI(RVAutoChargeSrv.processAutoCharges, options);
    };
    /*
     * Initialization
     */
    that.init = function () {
        $scope.filters = {};
        setScrollerOptions();
        setPaginationConfig();
        setDueDateOptions();
        setTitleAndHeading();
        setParamsAndFetchAutoCharge();
    };

    that.init();
}]);