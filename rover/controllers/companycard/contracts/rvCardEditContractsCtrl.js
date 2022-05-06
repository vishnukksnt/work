'use strict';

angular.module('sntRover').controller('rvCardEditContractsCtrl', ['$scope', 'rvCompanyCardContractsSrv', '$stateParams', 'ngDialog', '$timeout', function ($scope, rvCompanyCardContractsSrv, $stateParams, ngDialog, $timeout) {
    BaseCtrl.call(this, $scope);

    $scope.setScroller('editContractScroller');
    var refreshEditScroller = function refreshEditScroller() {
        $timeout(function () {
            $scope.refreshScroller('editContractScroller');
        }, 500);
    };

    /**
     * Listener for edit scroller refresh
     */
    $scope.addListener('refreshEditScroller', refreshEditScroller);

    /**
     * Function for updating the contract
     */
    $scope.updateContract = function () {
        var changedData = {
            'access_code': $scope.contractData.editData.access_code,
            'contract_name': $scope.contractData.editData.contract_name,
            'begin_date': $scope.contractData.editData.begin_date,
            'end_date': $scope.contractData.editData.end_date,
            'total_contracted_nights': $scope.contractData.editData.total_contracted_nights,
            'is_active': $scope.contractData.editData.is_active,
            'rate_ids': _.pluck($scope.contractData.selectedRateList, 'id'),
            'owner_id': $scope.contractData.contractOwner.selectedOwner.id || null
        },
            updateContractSuccessCallback = function updateContractSuccessCallback() {
            $scope.$emit('setErrorMessage', []);
            $scope.$emit('fetchContractsList');
            $scope.$emit('updateContractedNights', $scope.contractData.editData.occupancy);
        },
            updateContractFailureCallback = function updateContractFailureCallback(data) {
            $scope.$emit('setErrorMessage', data);
            $scope.$parent.currentSelectedTab = 'cc-contracts';
        },
            accountId = !_.isEmpty($scope.contactInformation) ? $scope.contactInformation.id : $stateParams.id,
            options = {
            params: {
                'account_id': accountId,
                "contract_id": $scope.contractData.selectedContractId,
                'postData': changedData
            },
            failureCallBack: updateContractFailureCallback,
            successCallBack: updateContractSuccessCallback
        };

        $scope.callAPI(rvCompanyCardContractsSrv.updateContract, options);
    };

    /**
     * Function to delete a contract
     */
    $scope.deleteContract = function () {
        var accountId,
            deleteContractFailureCallback = function deleteContractFailureCallback(error) {
            $scope.$emit('setErrorMessage', error);
        },
            deleteContractSuccessCallback = function deleteContractSuccessCallback() {
            $scope.contractData.selectedContractId = '';
            $scope.$emit('fetchContractsList');
        };
        accountId = $scope.contactInformation.id;
        var options = {
            params: {
                'account_id': accountId,
                "contract_id": $scope.contractData.selectedContractId
            },
            failureCallBack: deleteContractFailureCallback,
            successCallBack: deleteContractSuccessCallback
        };

        $scope.callAPI(rvCompanyCardContractsSrv.deleteContract, options);
    };

    /**
     * Function to toggle contract active status
     */
    $scope.toggleActiveStatus = function () {
        if (!$scope.contractData.disableFields) {
            $scope.contractData.editData.is_active = !$scope.contractData.editData.is_active;
        }
    };

    /**
     * Restore the original contract data
     */
    $scope.restoreContract = function () {
        $scope.contractData.linkContractsSearch.query = '';
        $scope.contractData.linkContractsSearch.results = [];
        $scope.$emit('fetchContract', $scope.contractData.selectedContractId);
    };

    /**
     * Determine if access code should be editable
     */
    $scope.editAccessCode = function () {
        var isReadOnly;

        if ($scope.contractData.hasEditAccessCodePermission) {
            /**
             * Should be readonly for expired contracts, irrespective of permission.
             * If contract is not expired, disableFields = false
             * so isReadonly = false, accesscode is not readonly
             * i.e., accesscode is editable
             */
            isReadOnly = $scope.contractData.disableFields;
        } else {
            // Otherwise accesscode is not editable, i.e., it's readonly
            isReadOnly = true;
        }
        return isReadOnly;
    };

    // To popup contract start date
    $scope.contractStart = function () {
        if (!$scope.contractData.disableFields) {
            ngDialog.open({
                template: '/assets/partials/companyCard/contracts/rvCompanyCardContractsCalendar.html',
                controller: 'rvContractStartCalendarCtrl',
                className: '',
                scope: $scope
            });
        }
    };

    // To popup contract end date
    $scope.contractEnd = function () {
        if (!$scope.contractData.disableFields) {
            ngDialog.open({
                template: '/assets/partials/companyCard/contracts/rvCompanyCardContractsCalendar.html',
                controller: 'rvContractEndCalendarCtrl',
                className: '',
                scope: $scope
            });
        }
    };

    // Show contracted nights popup
    $scope.editContractedNights = function () {
        if (!$scope.contractData.disableFields) {
            ngDialog.open({
                template: '/assets/partials/companyCard/contracts/rvContractedNightsPopup.html',
                controller: 'rvContractedNightsCtrl',
                className: '',
                scope: $scope
            });
        }
    };

    // Handle unlink Contract
    $scope.unlinkContractsCofirmed = function () {
        $scope.closeDialog();
        var unLinkContractSuccessCallback = function unLinkContractSuccessCallback() {
            $scope.$emit('fetchContractsList', 'UNLINK');
        },
            unLinkContractFailureCallback = function unLinkContractFailureCallback(errorMessage) {
            $scope.$emit('setErrorMessage', errorMessage);
        };

        var options = {
            successCallBack: unLinkContractSuccessCallback,
            failureCallBack: unLinkContractFailureCallback,
            params: {
                "id": $scope.contractData.selectedContractId,
                "account_id": $scope.contractData.accountId
            }
        };

        if ($scope.contractData.editData.is_master_contract) {
            options.params.from_account_id = $scope.contractData.accountId;
            options.params.account_id = $scope.contractData.unlinkAccountId;
        }

        $scope.callAPI(rvCompanyCardContractsSrv.unLinkContract, options);
    };

    // Handle unlink Contract click to show confirm popup.
    $scope.clickedUnlinkContracts = function (index) {
        var clickedItem = $scope.contractData.editData.account_details[index];

        if ($scope.contractData.editData.is_master_contract) {
            $scope.cardName = clickedItem.name;
            $scope.contractData.unlinkAccountId = clickedItem.id;
        } else {
            $scope.cardName = $scope.contactInformation.account_details.account_name;
        }

        ngDialog.open({
            template: '/assets/partials/companyCard/contracts/rvConfirmUnlinkContract.html',
            className: '',
            closeByDocument: false,
            scope: $scope
        });
    };
}]);