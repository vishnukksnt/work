'use strict';

angular.module('sntRover').controller('rvCardContractListCtrl', ['$timeout', '$scope', function ($timeout, $scope) {
    BaseCtrl.call(this, $scope);
    $scope.setScroller('contractListScroller');
    var refreshScroller = function refreshScroller() {
        $timeout(function () {
            $scope.refreshScroller('contractListScroller');
        }, 500);
    };
    var init = function init() {
        var openedContract = $scope.contractData.selectedContractId,
            contractsList = $scope.contractData.contractsList;

        angular.forEach(contractsList, function (item) {
            item.opened = false;
            angular.forEach(item.contracts, function (contract) {
                if (openedContract === contract.id) {
                    item.opened = true;
                }
            });
        });
        refreshScroller();
    };

    // Clear Rate search.
    var clearRateSearchBox = function clearRateSearchBox() {
        // Reset Contract Rate Search Component.
        $scope.contractData.selectedRateList = [];
        $scope.contractData.rateSearchQuery = '';
    },

    // Clear Rate search.
    clearContractLinkSearchBox = function clearContractLinkSearchBox() {
        // Reset Contract Link Search Component.
        $scope.contractData.linkContractsSearch.query = '';
        $scope.contractData.linkContractsSearch.results = [];
    };

    /**
     * Open the selected contracts list
     * @param {String} listType - PAST, PRESENT, FUTURE string values
     */
    $scope.openContractsList = function (item) {
        item.opened = !item.opened;
        refreshScroller();
    };
    /**
     * Fetch selected contract deatails
     * @param {Number} contractId - ID of the selected contract
     */
    $scope.fetchDetails = function (contractId) {
        if (contractId !== $scope.contractData.selectedContractId || $scope.contractData.mode !== 'EDIT') {
            $scope.contractData.mode = 'EDIT';
            clearRateSearchBox();
            clearContractLinkSearchBox();
            $scope.$emit('fetchContract', contractId);
        }
    };
    /**
     * Function for adding a new contract
     */
    $scope.newContract = function () {
        $scope.contractData.mode = 'ADD';
        $scope.contractData.disableFields = false;
        $scope.contractData.contractOwner.selectedOwner.id = null;
        $scope.contractData.contractOwner.isInactive = false;
        clearRateSearchBox();
        clearContractLinkSearchBox();
        $scope.$emit('refreshContractsScroll');
    };

    /**
     * Function for linking existing contracts.
     */
    $scope.linkContract = function () {
        $scope.contractData.mode = 'LINK';
        clearRateSearchBox();
        clearContractLinkSearchBox();
    };

    /**
     * Listener for initializing the contracts list
     */
    $scope.addListener('initContractsList', init);
}]);