'use strict';

angular.module('sntRover').controller("RVCompanyCardTravelAgentStatisticsController", ['$scope', '$rootScope', 'RVCompanyCardSrv', '$timeout', '$vault', '$state', '$stateParams', 'Toggles', function ($scope, $rootScope, RVCompanyCardSrv, $timeout, $vault, $state, $stateParams, Toggles) {
    var listeners = [],
        SIDEBAR_SCROLLER = 'cc-sidebar-scroller',
        MONTHLY_DATA_SCROLLER = 'cc-monthly-data-scroller',
        SUMMARY_SIDEBAR_SCROLLER = 'cc-statistics-summary-sidebar-scroller',
        SUMMARY_DATA_SCROLLER = 'cc-statistics-summary-data-scroller',
        PER_PAGE_COUNT = 25;

    BaseCtrl.call(this, $scope);
    StatisticsBaseCtrl.call(this, $scope, $rootScope);

    // Set the hotel list grouped by section
    var setHotelListForEachStatisticsSection = function setHotelListForEachStatisticsSection() {
        $scope.hotelListByStatisticsSection.stays = _.keys($scope.statistics.summaryViewData.details.stay_count);
        $scope.hotelListByStatisticsSection.nights = _.keys($scope.statistics.summaryViewData.details.night_count);
        $scope.hotelListByStatisticsSection.cancellation = _.keys($scope.statistics.summaryViewData.details.cancellation_count);
        $scope.hotelListByStatisticsSection.noShows = _.keys($scope.statistics.summaryViewData.details.no_show_count);
        $scope.hotelListByStatisticsSection.adr = _.keys($scope.statistics.summaryViewData.details.adr);
        $scope.hotelListByStatisticsSection.roomRevenue = _.keys($scope.statistics.summaryViewData.details.room_revenue);
        $scope.hotelListByStatisticsSection.totalRevenue = _.keys($scope.statistics.summaryViewData.details.total_revenue);
    };

    // Load the cc/ta statistics summary
    var loadStatisticsSummary = function loadStatisticsSummary() {
        var onStatisticsFetchSuccess = function onStatisticsFetchSuccess(data) {
            initializeStatisticsSummarySectionExpandState();
            $scope.statistics.summaryViewData = data;

            // Set if current view is for either chain or property group
            if (!$scope.filterData.hotelId) {
                setHotelListForEachStatisticsSection(data);
            }
            $timeout(function () {
                reloadScroller(true);
            }, 200);
            isSummaryViewScrollReady();
        },
            onStatistcsFetchFailure = function onStatistcsFetchFailure() {
            $scope.statistics.summaryViewData = {};
        };

        var params = {
            year: $scope.filterData.selectedYear,
            accountId: getAccountId()
        };

        if ($scope.filterData.hotelId) {
            params.hotel_id = $scope.filterData.hotelId;
        } else if ($scope.filterData.propertyGroupId) {
            params.property_group_id = $scope.filterData.propertyGroupId;
        }

        var requestConfig = {
            params: params,
            onSuccess: onStatisticsFetchSuccess,
            onFailure: onStatistcsFetchFailure
        };

        $scope.callAPI(RVCompanyCardSrv.fetchCompanyTravelAgentStatisticsSummary, requestConfig);
    },

    // Load the statistic details for the given CC/TA
    loadStatisticsDetails = function loadStatisticsDetails() {
        var onStatisticsDetailsFetchSuccess = function onStatisticsDetailsFetchSuccess(data) {
            $scope.statistics.details = data;
            $scope.statistics.details.monthly_data = $scope.statistics.details.monthly_data.reverse();
            $timeout(function () {
                reloadScroller(true);
            }, 500);
            isDetailedViewScrollReady();
        },
            onStatistcsDetailsFetchFailure = function onStatistcsDetailsFetchFailure() {
            $scope.statistics.details = {};
        },
            requestConfig = {
            params: {
                year: $scope.filterData.selectedYear,
                accountId: getAccountId()
            },
            onSuccess: onStatisticsDetailsFetchSuccess,
            onFailure: onStatistcsDetailsFetchFailure
        };

        $scope.callAPI(RVCompanyCardSrv.fetchCompanyTravelAgentStatisticsDetails, requestConfig);
    },

    // Set the listeners for the controller
    setListeners = function setListeners() {
        listeners['LOAD_GUEST_STATISTICS'] = $scope.$on('LOAD_GUEST_STATISTICS', function () {
            loadStatisticsSummary();
        }), listeners['UPDATE_CONTACT_INFO'] = $scope.$on('UPDATE_CONTACT_INFO', function () {
            setUpData();
        });
    },

    // Destroy the listeners
    destroyListeners = function destroyListeners() {
        angular.forEach(function (listener) {
            $scope.$on('$destroy', listener);
        });
    },

    // Get account id
    getAccountId = function getAccountId() {
        var id = '';

        if ($scope.contactInformation && $scope.contactInformation.id) {
            id = $scope.contactInformation.id;
        }
        if (!id) {
            id = $stateParams.id;
        }
        return id;
    };

    // Set statistics tab active view - summary | details
    $scope.setActiveView = function (view, year) {
        $scope.activeView = view;

        if (view === 'details') {
            $scope.filterData.selectedYear = year || $scope.getCurrentYear();
            configureScroller();
            isDetailedViewScrollReady();
            populateYearDropDown();
            loadStatisticsDetails();
        } else {
            $scope.filterData.selectedYear = $scope.getCurrentYear() - 1;
            configureScroller();
            isSummaryViewScrollReady();
            populateYearDropDown();
            loadStatisticsSummary();
        }

        $scope.$emit('UPDATE_STATISTICS_TAB_ACTIVE_VIEW', {
            activeView: view
        });
    };

    $scope.getReservationByPage = function (pageNo) {
        loadReservations(pageNo, $scope.selectedMonthData);
    };

    var loadReservations = function loadReservations(pageNo, monthlyData) {
        var onMonthlyReservationsFetchSuccess = function onMonthlyReservationsFetchSuccess(data) {
            $scope.totalResultCount = data.total_count;
            monthlyData.reservations = data.reservations;
            refreshPagination();
            $timeout(function () {
                reloadScroller();
                $scope.getScroller(MONTHLY_DATA_SCROLLER).scrollToElement('.res-active', 500, 0, 0);
            }, 1000);
            isDetailedViewScrollReady();
        },
            onMonthlyReservationsFetchFailure = function onMonthlyReservationsFetchFailure() {
            monthlyData.reservations = [];
        },
            requestConfig = {
            params: {
                year: $scope.filterData.selectedYear,
                month: monthlyData.month,
                accountId: getAccountId(),
                per_page: PER_PAGE_COUNT,
                page: pageNo
            },
            onSuccess: onMonthlyReservationsFetchSuccess,
            onFailure: onMonthlyReservationsFetchFailure
        };

        $scope.callAPI(RVCompanyCardSrv.fetchCompanyTravelAgentMonthlyReservations, requestConfig);
    },
        refreshPagination = function refreshPagination() {
        $timeout(function () {
            $scope.$broadcast('updatePagination', 'STATISTICS_PAGINATION');
        }, 200);
    };

    // Checks whether reservation listing should be shown or not
    $scope.shouldShowReservations = function (monthlyData) {
        return monthlyData.reservations_count !== 0;
    };

    // Toggle the reservation list view displayed for a month
    $scope.showMonthlyReservations = function (monthlyData) {
        if (!$scope.shouldShowReservations(monthlyData)) {
            return false;
        }

        if (!monthlyData.isOpen) {
            $scope.totalResultCount = 0;
            refreshPagination();
            $scope.selectedMonthData = monthlyData;
            $scope.statistics.details.monthly_data.forEach(function (data, index) {
                if (data.month !== monthlyData.month) {
                    $scope.statistics.details.monthly_data[index].isOpen = false;
                    data.reservations = [];
                }
            });
            loadReservations(1, monthlyData);
            monthlyData.isOpen = !monthlyData.isOpen;
        } else {
            monthlyData.isOpen = !monthlyData.isOpen;
            $timeout(function () {
                reloadScroller();
            }, 200);
        }
    };

    // Processes the year change event
    $scope.onChangeYear = function () {
        if ($scope.activeView === 'summary') {
            loadStatisticsSummary();
        } else {
            loadStatisticsDetails();
        }
    };

    // create the year dropdown options
    var populateYearDropDown = function populateYearDropDown() {
        $scope.populateYearDropDown($scope.contactInformation.first_stay_year);
    };

    // Navigate to staycard
    $scope.navigateToStayCard = function (reservation) {
        if ($state.current.name !== 'rover.companycarddetails') {
            return false;
        }

        $vault.set('cardId', $scope.accountId);
        $vault.set('type', $scope.contactInformation.account_details.account_type);
        $vault.set('selectedYear', $scope.filterData.selectedYear);
        $state.go("rover.reservation.staycard.reservationcard.reservationdetails", {
            id: reservation.reservation_id,
            confirmationId: reservation.confirmation_no,
            isrefresh: true,
            isFromCardStatistics: true
        });
    };

    // Checks whether the navigation to the staycard should be shown or not in the details screen
    $scope.shouldShowNavigation = function () {
        var shouldHide = true;

        if ($state.current.name === 'rover.companycarddetails') {
            shouldHide = false;
        }
        return shouldHide;
    };

    // Get style for statistics details expanded view
    $scope.getStyleForExpandedView = function (monthlyData) {
        var styleClass = {},
            count = monthlyData.reservations && monthlyData.reservations.length;

        if (monthlyData.isOpen) {
            var margin = count * 70 + 30;

            if ($scope.totalResultCount > $scope.perPage) {
                margin = margin + 60;
            }

            styleClass['margin-bottom'] = margin + 'px';
        }
        return styleClass;
    };

    // Set up the data required during initialization
    var setUpData = function setUpData() {
        $scope.accountId = getAccountId();
        $scope.currentYear = $scope.getCurrentYear();
        populateYearDropDown();

        $scope.hotelListByStatisticsSection = {
            stays: [],
            nights: [],
            cancellation: [],
            noShows: [],
            adr: [],
            roomRevenue: [],
            totalRevenue: []
        };
    },

    // Configure the left and right scroller
    configureScroller = function configureScroller() {
        $scope.setScroller(SIDEBAR_SCROLLER, {
            'preventDefault': false,
            'probeType': 3
        });
        $scope.setScroller(MONTHLY_DATA_SCROLLER, {
            'preventDefault': false,
            'probeType': 3,
            'scrollX': true
        });
        $scope.setScroller(SUMMARY_SIDEBAR_SCROLLER, {
            'preventDefault': false,
            'probeType': 3
        });
        $scope.setScroller(SUMMARY_DATA_SCROLLER, {
            'preventDefault': false,
            'probeType': 3,
            'scrollX': true
        });
    },

    // Refreshes the two scrollers in the screen
    reloadScroller = function reloadScroller(shouldSrollToTop) {
        $timeout(function () {
            if ($scope.myScroll.hasOwnProperty(SIDEBAR_SCROLLER)) {
                $scope.refreshScroller(SIDEBAR_SCROLLER);
                if (shouldSrollToTop) {
                    $scope.myScroll[SIDEBAR_SCROLLER].scrollTo(0, 0, 100);
                }
            }

            if ($scope.myScroll.hasOwnProperty(MONTHLY_DATA_SCROLLER)) {
                $scope.refreshScroller(MONTHLY_DATA_SCROLLER);
                if (shouldSrollToTop) {
                    $scope.myScroll[MONTHLY_DATA_SCROLLER].scrollTo(0, 0, 100);
                }
            }

            if ($scope.myScroll.hasOwnProperty(SUMMARY_SIDEBAR_SCROLLER)) {
                $scope.refreshScroller(SUMMARY_SIDEBAR_SCROLLER);
                if (shouldSrollToTop) {
                    $scope.myScroll[SUMMARY_SIDEBAR_SCROLLER].scrollTo(0, 0, 100);
                }
            }
            if ($scope.myScroll.hasOwnProperty(SUMMARY_DATA_SCROLLER)) {
                $scope.refreshScroller(SUMMARY_DATA_SCROLLER);
                if (shouldSrollToTop) {
                    $scope.myScroll[SUMMARY_DATA_SCROLLER].scrollTo(0, 0, 100);
                }
            }
        }, 200);
    },

    // Set up scroll listeners for detailed view left and right pane
    setUpDetailedViewScrollListner = function setUpDetailedViewScrollListner() {
        if ($scope.myScroll.hasOwnProperty(SIDEBAR_SCROLLER) && $scope.myScroll.hasOwnProperty(MONTHLY_DATA_SCROLLER)) {
            $scope.myScroll[SIDEBAR_SCROLLER].on('scroll', function () {
                $scope.myScroll[MONTHLY_DATA_SCROLLER].scrollTo(0, this.y);
            });
            $scope.myScroll[MONTHLY_DATA_SCROLLER].on('scroll', function () {
                $scope.myScroll[SIDEBAR_SCROLLER].scrollTo(0, this.y);
            });
        }
    },

    // Set up scroll listeners for summary view left and right pane
    setUpSummaryViewScrollListner = function setUpSummaryViewScrollListner() {
        if ($scope.myScroll.hasOwnProperty(SUMMARY_SIDEBAR_SCROLLER) && $scope.myScroll.hasOwnProperty(SUMMARY_DATA_SCROLLER)) {
            $scope.myScroll[SUMMARY_SIDEBAR_SCROLLER].on('scroll', function () {
                $scope.myScroll[SUMMARY_DATA_SCROLLER].scrollTo(0, this.y);
            });
            $scope.myScroll[SUMMARY_DATA_SCROLLER].on('scroll', function () {
                $scope.myScroll[SUMMARY_SIDEBAR_SCROLLER].scrollTo(0, this.y);
            });
        }
    },

    // Check whether detailed view scroll is ready
    isDetailedViewScrollReady = function isDetailedViewScrollReady() {
        if ($scope.myScroll.hasOwnProperty(SIDEBAR_SCROLLER) && $scope.myScroll.hasOwnProperty(MONTHLY_DATA_SCROLLER)) {
            setUpDetailedViewScrollListner();
        } else {
            $timeout(isDetailedViewScrollReady, 1000);
        }
    },

    // Check whether summary view scroll is ready
    isSummaryViewScrollReady = function isSummaryViewScrollReady() {
        if ($scope.myScroll.hasOwnProperty(SUMMARY_SIDEBAR_SCROLLER) && $scope.myScroll.hasOwnProperty(SUMMARY_DATA_SCROLLER)) {
            setUpSummaryViewScrollListner();
        } else {
            $timeout(isSummaryViewScrollReady, 1000);
        }
    },

    // Initialize the pagination params
    initialisePagination = function initialisePagination() {
        $scope.perPage = PER_PAGE_COUNT;
        $scope.page = 1;
    },

    // Configure page options
    configurePagination = function configurePagination() {
        $scope.pageOptions = {
            id: "STATISTICS_PAGINATION",
            perPage: $scope.perPage,
            api: $scope.getReservationByPage
        };
    },
        initializeStatisticsSummarySectionExpandState = function initializeStatisticsSummarySectionExpandState() {
        $scope.summaryStatisticsExpandedViewStateBySection = {
            stays: false,
            nights: false,
            cancellations: false,
            noShows: false,
            adr: false,
            roomRevenue: false,
            totalRevenue: false
        };
    };

    $scope.addListener('UPDATE_FILTER', function (event, data) {
        _.extend($scope.filterData, data);
        loadStatisticsSummary();
    });

    /**
     * Should show the expanded hotel view
     * @param {Object} data - hold the statistics section data from API response like stay_count, night_count etc
     * @return {Boolean} 
     */
    $scope.shouldShowExpandedHotelView = function (data) {
        return !$scope.filterData.hotelId && !_.isEmpty(data);
    };

    /**
     * Toggle each statistics summary section
     * @param {String} sectionName section name
     * @return {void}
     */
    $scope.toggleSummarySectionState = function (sectionName) {
        $scope.summaryStatisticsExpandedViewStateBySection[sectionName] = !$scope.summaryStatisticsExpandedViewStateBySection[sectionName];
        $timeout(function () {
            $scope.refreshScroller(SUMMARY_SIDEBAR_SCROLLER);
            $scope.refreshScroller(SUMMARY_DATA_SCROLLER);
        }, 100);
    };

    // Initialize the controller
    var init = function init() {
        $scope.activeView = "summary";
        $scope.statistics = {
            summaryViewData: {},
            details: {}
        };
        $scope.filterData = {
            selectedYear: $scope.getCurrentYear() - 1,
            hotelId: $rootScope.currentHotelId,
            propertyGroupId: ''
        };
        setUpData();
        isDetailedViewScrollReady();
        isSummaryViewScrollReady();
        setListeners();
        destroyListeners();
        initialisePagination();
        configurePagination();
        initializeStatisticsSummarySectionExpandState();

        $scope.isMultiPropertyStatisticsEnabled = Toggles.isEnabled('multi_property_statistics');

        if ($stateParams.isBackFromStaycard) {
            $scope.filterData.selectedYear = $stateParams.selectedStatisticsYear ? $stateParams.selectedStatisticsYear : $scope.filterData.selectedYear;
            $scope.setActiveView('details', $scope.filterData.selectedYear);
        } else {
            $scope.setActiveView('summary');
        }
    };

    init();
}]);