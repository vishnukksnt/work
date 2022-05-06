'use strict';

angular.module('sntRover').controller('rvCardSearchContractedRateCtrl', ['$scope', 'rvCompanyCardContractsSrv', '$timeout', 'ngDialog', '$stateParams', function ($scope, rvCompanyCardContractsSrv, $timeout, ngDialog, $stateParams) {

    BaseCtrl.call(this, $scope);
    var that = this,
        SCROLL_DELAY = 500;

    that.initialise = function () {
        $scope.contractData.searchResults = [];
        $scope.setScroller('searchResultsList');
    };

    // Handle refresh scroll
    that.refreshSearchList = function () {
        $timeout(function () {
            $scope.refreshScroller('searchResultsList');
        }, SCROLL_DELAY);
    };

    /* 
     *  Handle API call to fetch contract rates.
     */
    that.fetchRateContract = function () {
        var fetchRateContractSuccessCallback = function fetchRateContractSuccessCallback(data) {
            $scope.contractData.searchResults = data.contract_rates;
            $scope.$emit('refreshContractsScroll');
            that.refreshSearchList();
        },
            fetchRateContractFailureCallback = function fetchRateContractFailureCallback(errorMessage) {
            $scope.$emit('setErrorMessage', errorMessage);
        },
            accountId = !_.isEmpty($scope.contactInformation) ? $scope.contactInformation.id : $stateParams.id;

        var options = {
            successCallBack: fetchRateContractSuccessCallback,
            failureCallBack: fetchRateContractFailureCallback,
            params: {
                'query': $scope.contractData.rateSearchQuery,
                'selected_rate_ids': _.pluck($scope.contractData.selectedRateList, 'id'),
                'account_id': accountId
            }
        };

        if ($scope.contractData.mode === 'EDIT') {
            options.params.contract_id = $scope.contractData.selectedContractId;
        }

        $scope.callAPI(rvCompanyCardContractsSrv.fetchRateContract, options);
    };

    // Handle rate search.
    $scope.searchRate = function () {
        if ($scope.contractData.rateSearchQuery.length > 2) {
            that.fetchRateContract();
        } else {
            $scope.contractData.searchResults = [];
        }
    };
    // Handle clear search.
    $scope.clearQuery = function () {
        $scope.contractData.rateSearchQuery = '';
        $scope.contractData.searchResults = [];
        $scope.$emit('refreshContractsScroll');
    };
    /* 
     *  Handle click on each item in the result list
     *  @params {Number} [index of the searchResults]
     */
    $scope.clickedOnResult = function (index) {
        var clickedItem = $scope.contractData.searchResults[index],
            linkRateSuccessCallback = function linkRateSuccessCallback() {
            $scope.contractData.selectedRateList.push(clickedItem);
            $scope.$emit('refreshContractsScroll');
            $scope.contractData.searchResults = [];
            $scope.contractData.rateSearchQuery = '';
        },
            linkRateFailureCallback = function linkRateFailureCallback(errorMessage) {
            $scope.$emit('setErrorMessage', errorMessage);
        },
            accountId = !_.isEmpty($scope.contactInformation) ? $scope.contactInformation.id : $stateParams.id;

        var options = {
            successCallBack: linkRateSuccessCallback,
            failureCallBack: linkRateFailureCallback,
            params: {
                "id": $scope.contractData.selectedContractId,
                "rate_id": clickedItem.id,
                "account_id": accountId
            }
        };

        $scope.callAPI(rvCompanyCardContractsSrv.linkRate, options);
    };
    /* 
     *  Handle click(for remove) on each item in the selected rate list
     *  @params {Number} [index of the selected rate list]
     */
    $scope.removeRate = function (index) {
        $scope.rateObj = $scope.contractData.selectedRateList[index];
        ngDialog.open({
            template: '/assets/partials/companyCard/contracts/rvConfirmRemoveRate.html',
            className: '',
            closeByDocument: false,
            scope: $scope
        });
    };

    // Show Error Message in popup.
    var showErrorMessagePopup = function showErrorMessagePopup(errorMessage) {
        $scope.rateErrorMessage = errorMessage[0];
        ngDialog.open({
            template: '/assets/partials/companyCard/contracts/rvErrorOnRemoveRate.html',
            className: '',
            closeByDocument: false,
            scope: $scope
        });
    };

    // Unlink a Rate after confirmation popup.
    $scope.confirmRemoveRate = function (rateId) {
        ngDialog.close();
        var unlinkRateSuccessCallback = function unlinkRateSuccessCallback() {
            var removeIndex = $scope.contractData.selectedRateList.map(function (item) {
                return item.id;
            }).indexOf(rateId);

            $scope.contractData.selectedRateList.splice(removeIndex, 1);
            $scope.$emit('refreshContractsScroll');
        },
            unlinkRateFailureCallback = function unlinkRateFailureCallback(errorMessage) {
            showErrorMessagePopup(errorMessage);
        },
            accountId = !_.isEmpty($scope.contactInformation) ? $scope.contactInformation.id : $stateParams.id;

        var options = {
            successCallBack: unlinkRateSuccessCallback,
            failureCallBack: unlinkRateFailureCallback,
            params: {
                "id": $scope.contractData.selectedContractId,
                "rate_id": rateId,
                "account_id": accountId
            }
        };

        $scope.callAPI(rvCompanyCardContractsSrv.unlinkRate, options);
    };

    that.initialise();
}]);