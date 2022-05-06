sntRover.controller('rvChargeCodesAndBillingGroupCtrl', ['$scope', '$rootScope', '$filter', 'RVBillinginfoSrv', 'RVGuestCardSrv', 'ngDialog', 'RVBillCardSrv', 'RVPaymentSrv', function($scope, $rootScope, $filter, RVBillinginfoSrv, RVGuestCardSrv, ngDialog, RVBillCardSrv, RVPaymentSrv) {

    BaseCtrl.call(this, $scope);

    /**
     * Function to switch between the charge code and billing groups views
     * @return {undefined}
     */
    $scope.toggleChargeType = function() {
        $scope.billingInfoFlags.isBillingGroup = !$scope.billingInfoFlags.isBillingGroup;

        if ($scope.billingInfoFlags.isBillingGroup) {
            $scope.refreshScroller('billingGroups');
        }
        else {
            $scope.refreshScroller('chargeCodes');
        }
        $scope.billingInfoFlags.showChargeCodes = false;
    };

    /**
     * Function to know if the billing group is selected or not, to adjust the UI
     * @param {Object}
     * @return {Boolean}
     */
    $scope.isBillingGroupSelected = function(billingGroup) {
        if ($scope.selectedEntity.attached_billing_groups) {
            for (var i = 0; i < $scope.selectedEntity.attached_billing_groups.length; i++) {
                if ($scope.selectedEntity.attached_billing_groups[i].id === billingGroup.id) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * Function to switch the billing group selection
     * @param {Object}
     * @return {undefined}
     */
    $scope.toggleSelectionForBillingGroup = function(billingGroup) {
        for (var i = 0; i < $scope.selectedEntity.attached_billing_groups.length; i++) {
            if ($scope.selectedEntity.attached_billing_groups[i].id === billingGroup.id) {
                $scope.selectedEntity.attached_billing_groups.splice(i, 1);
                return;
            }
        }

        $scope.selectedEntity.attached_billing_groups.push(billingGroup);
        $scope.refreshScroller('billingGroups');
    };

    /**
     * Function to remove the charge code
     * @param {Object} [charge code to be removed]
     * @return {undefined}
     */
    $scope.removeChargeCode = function(chargeCode) {
        for (var i = 0; i < $scope.selectedEntity.attached_charge_codes.length; i++) {
            if ($scope.selectedEntity.attached_charge_codes[i].id === chargeCode.id) {
                $scope.selectedEntity.attached_charge_codes.splice(i, 1);
                return;
            }
        }
    };

    /**
     * Function to show available charge code list on clicking the dropdown
     * @return {undefined}
     */
    $scope.showAvailableChargeCodes = function() {
        $scope.clearResults();
        displayFilteredResultsChargeCodes();
        $scope.billingInfoFlags.showChargeCodes = !$scope.billingInfoFlags.showChargeCodes;
    };

    /**
     * Function to select charge code
     * @return {undefined}
     */
    var addChargeCode = function() {
        for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
            if ($scope.availableChargeCodes[i].id === $scope.chargeCodeToAdd) {
                for (var j = 0; j < $scope.selectedEntity.attached_charge_codes.length; j++) {
                    if ($scope.selectedEntity.attached_charge_codes[j].id === $scope.chargeCodeToAdd) {
                        return;
                    }
                }
                $scope.selectedEntity.attached_charge_codes.push($scope.availableChargeCodes[i]);
                $scope.refreshScroller('chargeCodes');
                return;
            }
        }
    };

    /**
     * Function to select the charge code to be used in UI
     * @param {Number} [id of selected charge code]
     * @return {undefined}
     */
    $scope.selectChargeCode = function(selectedChargecodeId) {
        $scope.chargeCodeToAdd = selectedChargecodeId;
        addChargeCode();
        $scope.chargeCodeSearchText = '';
        $scope.billingInfoFlags.showChargeCodes = false;
    };

    /**
     * Function to trigger the filtering when the search text is entered
     * @return {undefined}
     */
    $scope.chargeCodeEntered = function() {
        $scope.billingInfoFlags.showChargeCodes = false;
        displayFilteredResultsChargeCodes();
        var queryText = $scope.chargeCodeSearchText;

        $scope.chargeCodeSearchText = queryText.charAt(0).toUpperCase() + queryText.slice(1);
    };

    /**
     * Function to clear the charge code search text
     * @return {undefined}
     */
    $scope.clearResults = function() {
        $scope.chargeCodeSearchText = "";
    };

    /**
     * Function to perform filering on results.
     * if not found in the data, it will request for webservice
     * @return {undefined}
     */
    var displayFilteredResultsChargeCodes = function() {

        // if the entered text's length < 3, we will show everything, means no filtering
        if ($scope.chargeCodeSearchText.length < 3) {

            // based on 'is_row_visible' parameter we are showing the data in the template
            for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
                if ($scope.isChargeCodeSelected($scope.availableChargeCodes[i])) {
                    $scope.availableChargeCodes[i].is_row_visible = false;
                    $scope.availableChargeCodes[i].is_selected    = false;
                } 
                else {
                    $scope.availableChargeCodes[i].is_row_visible = true;
                    $scope.availableChargeCodes[i].is_selected    = true;
                }
            }
            $scope.refreshScroller('chargeCodesList');
            // we have changed data, so we are refreshing the scrollerbar
        }
        else {
            var value = "";
            // searching in the data we have, we are using a variable 'visibleElementsCount' to track matching
            // if it is zero, then we will request for webservice

            for (var i = 0; i < $scope.availableChargeCodes.length; i++) {
                value = $scope.availableChargeCodes[i];
                if ((($scope.escapeNull(value.code).toUpperCase()).indexOf($scope.chargeCodeSearchText.toUpperCase()) >= 0 ||
                    ($scope.escapeNull(value.description).toUpperCase()).indexOf($scope.chargeCodeSearchText.toUpperCase()) >= 0) && 
                    (!$scope.isChargeCodeSelected($scope.availableChargeCodes[i]))) {

                    $scope.availableChargeCodes[i].is_row_visible = true;
                }
                else {
                  $scope.availableChargeCodes[i].is_row_visible = false;
                }
            }
            $scope.refreshScroller('chargeCodesList');
        }
    };

    /**
     * Function that converts a null value to a desired string.
     * if no replace value is passed, it returns an empty string.
     * @return {String}
     */
    $scope.escapeNull = function(value, replaceWith) {
        return escapeNull(value, replaceWith);
    };

    /**
     * Function to know if the charge code is selected, to adjust in UI
     * @param {Object}
     * @return {Boolean}
     */
    $scope.isChargeCodeSelected = function(chargeCode) {
        if ($scope.selectedEntity.attached_charge_codes) {
            for (var i = 0; i < $scope.selectedEntity.attached_charge_codes.length; i++) {
                if ($scope.selectedEntity.attached_charge_codes[i].id === chargeCode.id ) {
                    return true;
                }
            }
        }
        return false;
    };

}]);
