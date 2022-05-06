'use strict';

sntRover.controller('RVCommisionsHeaderCtrl', ['$scope', 'ngDialog', '$log', '$timeout', 'RVCommissionsSrv', '$filter', function ($scope, ngDialog, $log, $timeout, RVCommissionsSrv, $filter) {
    BaseCtrl.call(this, $scope);

    var setParamsInCurrentPage = function setParamsInCurrentPage(params) {
        params.selected_tas = [];
        _.each($scope.selectedAgentIds, function (id) {
            params.selected_tas.push(id);
        });
        return params;
    };

    var setParamsInCurrentPageAndOtherPages = function setParamsInCurrentPageAndOtherPages(params) {
        params.un_selected_tas = [];
        _.each($scope.commissionsData.accounts, function (account) {
            if (!account.isSelected) {
                params.un_selected_tas.push(account.id);
            }
        });
        return params;
    };

    var generateParams = function generateParams() {
        var params = {};

        if ($scope.areAllAgentsSelected()) {
            params.update_all_tas = true;
        } else {
            // if only items in the existing page are selected
            if ($scope.noOfTASelected <= $scope.filterData.perPage) {
                params = setParamsInCurrentPage(params);
            } else {
                // when more than per page items are selected and
                // some of the current page items are unchecked
                params = setParamsInCurrentPageAndOtherPages(params);
            }
            params.partially_selected_tas = [];
            params.selected_reservations_ids = [];
            _.each($scope.commissionsData.accounts, function (account) {
                if (account.isExpanded && account.selectedReservations.length && account.selectedReservations.length !== account.reservationsData.total_count) {
                    params.partially_selected_tas.push(account.id);
                    params.selected_reservations_ids = params.selected_reservations_ids.concat(account.selectedReservations);
                }
            });
        }
        params.begin_date = $scope.dateData.fromDateForAPI !== '' ? $filter('date')($scope.dateData.fromDateForAPI, 'yyyy-MM-dd') : '';
        params.end_date = $scope.dateData.toDateForAPI !== '' ? $filter('date')($scope.dateData.toDateForAPI, 'yyyy-MM-dd') : '';
        return params;
    };

    var setExportStatus = function setExportStatus(inProgress, failed, success) {
        $scope.exportSuccess = success;
        $scope.exportFailed = failed;
        $scope.exportInProgess = inProgress;
    };

    $scope.isValidEmail = function () {
        return (/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test($scope.filterData.receipientEmail)
        );
    };

    $scope.exportCommisions = function () {

        var params = {
            min_commission_amount: $scope.filterData.minAmount,
            query: $scope.filterData.searchQuery,
            sort_by: $scope.filterData.sort_by.value,
            receipient_email: $scope.filterData.receipientEmail,
            begin_date: $scope.dateData.fromDateForAPI !== '' ? $filter('date')($scope.dateData.fromDateForAPI, 'yyyy-MM-dd') : '',
            end_date: $scope.dateData.toDateForAPI !== '' ? $filter('date')($scope.dateData.toDateForAPI, 'yyyy-MM-dd') : '',
            include_non_commissionable: $scope.filterData.non_commissionable,
            email_report: $scope.filterData.email_report,
            travel_agent_ids: _.pluck($scope.commissionsData.accounts, 'id')
        };

        var options = {
            params: params,
            loader: 'NONE',
            successCallBack: function successCallBack() {
                // if success can be returned quickly
                // for now we will only show in progress status and then dismiss the
                // popup
                $timeout(function () {
                    setExportStatus(false, false, true);
                    ngDialog.close();
                }, 4000);
            },
            failureCallBack: function failureCallBack() {
                setExportStatus(false, true, false);
            }
        };

        setExportStatus(true, false, false);

        if ($scope.filterData.selectedExportType === 'standard') {
            $scope.callAPI(RVCommissionsSrv.exportCommissions, options);
        } else if ($scope.filterData.selectedExportType === 'onyx') {
            $scope.callAPI(RVCommissionsSrv.onyxExportCommissions, options);
        } else {
            // TACS will be implemented later
            $timeout(function () {
                setExportStatus(false, false, true);
                ngDialog.close();
            }, 4000);
        }
    };

    $scope.showExportPopup = function () {
        $scope.filterData.receipientEmail = '';
        // if the admin setting is turned ON for ONYX, make it as default export type
        if ($scope.filterData.exportType === 'onyx') {
            $scope.filterData.selectedExportType = 'onyx';
        }
        setExportStatus(false, false, false);
        ngDialog.open({
            template: '/assets/partials/financials/commissions/rvCommissionsExport.html',
            className: '',
            scope: $scope
        });
    };

    $scope.popupBtnAction = function (action) {
        var params = generateParams();

        params.action_type = action;
        var successCallBack = function successCallBack() {
            ngDialog.close();
            $scope.fetchAgentsData();
        };

        $scope.invokeApi(RVCommissionsSrv.updateCommissionPaidStatus, params, successCallBack);
    };

    var openNgDialogWithTemplate = function openNgDialogWithTemplate(template) {
        ngDialog.open({
            template: '/assets/partials/financials/commissions/' + template + '.html',
            className: '',
            scope: $scope
        });
    };

    $scope.openPopupWithTemplate = function (template) {
        openNgDialogWithTemplate(template);
    };
}]);