'use strict';

angular.module('sntRover').controller('mergeCardsController', ['$scope', 'RVMergeCardsSrv', '$timeout', function ($scope, RVMergeCardsSrv, $timeout) {

    var self = this;

    var filterValues = {
        ALL: 'ALL',
        AR_ONLY: 'AR_ONLY'
    };

    var mergeStatusText = {
        VERIFYING_MERGE: 'Verifying Merge',
        OK_TO_MERGE: 'Ok to Merge',
        MERGE_NOT_POSSIBLE: 'Merge not possible'
    };

    var SELECTED_CARDS_FOR_MERGE_SCROLL = 'selected_cards_for_merge_scroll';

    $scope.setScroller(SELECTED_CARDS_FOR_MERGE_SCROLL, {
        tap: true,
        preventDefault: false,
        deceleration: 0.0001,
        shrinkScrollbars: 'clip'
    });

    self.refreshSelectedCardsScroller = function () {
        $timeout(function () {
            $scope.refreshScroller(SELECTED_CARDS_FOR_MERGE_SCROLL);
        }, 300);
    };

    /**
     * Handles the primary guest selection from the cards chosen for merge
     * @param {Number} id - id of the card
     * @return {void}
     */
    $scope.onPrimaryGuestSelectionChange = function (id) {
        $scope.viewState.selectedCardsForMerge.forEach(function (card) {
            if (card.id === id) {
                card.isPrimary = true;
                $scope.viewState.selectedPrimaryCard = card;
            } else {
                card.isPrimary = false;
            }
        });
    };

    /**
     * Get the merge btn class name based on the current state of the merge process
     * @return {String} className  - style class
     */
    $scope.getMergeActionClassName = function () {
        var className = '';

        if ($scope.viewState.selectedCardsForMerge.length === 1 || $scope.showVerifyMergeProcessActivityIndicator || !$scope.isEmpty($scope.viewState.mergeStatusErrors)) {
            className = 'grey';
        } else if ($scope.viewState.selectedCardsForMerge.length > 1) {
            className = 'purple';
        }
        return className;
    };

    /**
     * Verifying whether the cards selected are eligible for merging
     */
    $scope.verifyMerge = function () {
        var onVerificationSuccess = function onVerificationSuccess(data) {
            if (data.can_merge) {
                $scope.viewState.canMerge = data.can_merge;
                $scope.viewState.mergeStatusText = mergeStatusText.OK_TO_MERGE;
            } else {
                $scope.viewState.mergeStatusErrors = data.errors;
                $scope.viewState.mergeStatusText = mergeStatusText.MERGE_NOT_POSSIBLE;
            }
            $scope.showVerifyMergeProcessActivityIndicator = false;
            self.refreshSelectedCardsScroller();
        },
            onVerificationFailure = function onVerificationFailure() {};

        $scope.showVerifyMergeProcessActivityIndicator = true;

        var postData = {
            card_ids: self.getNonPrimaryCardIds(),
            isGuestCard: $scope.isGuestCard
        };

        $scope.viewState.mergeStatusText = mergeStatusText.VERIFYING_MERGE;
        $scope.viewState.hasInitiatedMergeVerification = true;
        $scope.callAPI(RVMergeCardsSrv.verifyCardMerge, {
            params: postData,
            onSuccess: onVerificationSuccess,
            onFailure: onVerificationFailure
        });
    };

    /**
     * Checks whether any of the selected cards have validation error after the verification process
     * @param {Object} card selected card
     * @return {Boolean} 
     */
    $scope.hasMergeVerificationErrors = function (card) {
        if (_.isEmpty($scope.viewState.mergeStatusErrors)) {
            return false;
        }

        var errorMsgs = $scope.viewState.mergeStatusErrors[card.id];

        return errorMsgs && errorMsgs.length > 0;
    };

    /**
     * Get the validation error message for the given card after the verification process
     * @param {Object} card holds the card details
     * @return {String} errorMsgs - contains all the validation error messages
     */
    $scope.getErrorMsg = function (card) {
        if (_.isEmpty($scope.viewState.mergeStatusErrors)) {
            return '';
        }

        var errorMsgs = $scope.viewState.mergeStatusErrors[card.id];

        if (errorMsgs) {
            errorMsgs = errorMsgs.join(',');
        } else {
            errorMsgs = '';
        }
        return errorMsgs;
    };

    /**
     * Handle the cancel action on the merge view
     */
    $scope.cancelSelections = function () {
        var selectedIds = _.pluck($scope.viewState.selectedCardsForMerge, 'id');

        $scope.results.forEach(function (card) {
            if (selectedIds.indexOf(card.id) !== -1) {
                card.selected = false;
                card.isPrimary = false;
            }
        });
        self.resetSelectionsForMerge();
        $scope.viewState.isViewSelected = true;
        $scope.cardFilter = filterValues.ALL;
        $scope.queryEntered();
    };

    /**
     * Perform merging of cards
     */
    $scope.mergeCards = function () {
        var postData = {
            card_ids: self.getNonPrimaryCardIds(),
            primary_card_id: $scope.viewState.selectedPrimaryCard.id,
            card_type: $scope.viewState.isCompanyCardSelected ? 'COMPANY' : 'TRAVELAGENT',
            isGuestCard: $scope.isGuestCard
        },
            onMergeSuccess = function onMergeSuccess() {
            self.resetSelectionsForMerge();
            $scope.queryEntered();
        },
            onMergeFailure = function onMergeFailure(error) {
            $scope.viewState.mergeStatusText = error;
            $scope.viewState.canMerge = false;
        };

        $scope.callAPI(RVMergeCardsSrv.mergeCards, {
            params: postData,
            onSuccess: onMergeSuccess,
            onFailure: onMergeFailure
        });
    };

    /**
     * Remove the given card from the list of cards selected for merge
     * @param {Object} card the card to be removed
     * @return {void}
     */
    $scope.removeSelectedCard = function (card) {
        // Remove the cards from the list
        $scope.viewState.selectedCardsForMerge = _.reject($scope.viewState.selectedCardsForMerge, function (cardDetails) {
            return cardDetails.id === card.id;
        });

        var isDeleteCardPrimary = !!card.isPrimary;

        if (card.isPrimary) {
            card.isPrimary = false;
            $scope.viewState.selectedPrimaryCard = {};
        }

        var selectedCard = _.find($scope.results, { id: card.id });

        // Mark the search result entry as non-selected
        if (selectedCard) {
            selectedCard.selected = false;
        }

        // Set the first card in the list as primary, if the given card for deletion is primary
        if (isDeleteCardPrimary && $scope.viewState.selectedCardsForMerge.length > 0) {
            $scope.viewState.selectedCardsForMerge[0].isPrimary = true;
            $scope.viewState.selectedPrimaryCard = $scope.viewState.selectedCardsForMerge[0];
        }

        if ($scope.viewState.mergeStatusErrors && $scope.viewState.mergeStatusErrors[card.id]) {
            delete $scope.viewState.mergeStatusErrors[card.id];
        }

        if ($scope.isEmpty($scope.viewState.mergeStatusErrors) && $scope.viewState.selectedCardsForMerge.length > 1) {
            $scope.viewState.canMerge = true;
            $scope.viewState.mergeStatusText = mergeStatusText.OK_TO_MERGE;
        }

        if ($scope.viewState.selectedCardsForMerge.length === 1) {
            $scope.viewState.hasInitiatedMergeVerification = false;
        }
    };

    /**
     * Resetting the values of variables 
     */
    self.resetSelectionsForMerge = function () {
        $scope.viewState.selectedPrimaryCard = {};
        $scope.viewState.selectedCardsForMerge = [];
        $scope.viewState.mergeStatusText = [];
        $scope.viewState.mergeStatusErrors = {};
        $scope.viewState.hasInitiatedMergeVerification = false;
    };

    /**
     * Get non-primary cards ids
     */
    self.getNonPrimaryCardIds = function () {
        var selectedNonPrimaryCards = _.reject($scope.viewState.selectedCardsForMerge, function (card) {
            return card.isPrimary;
        }),
            ids = [];

        if (selectedNonPrimaryCards.length > 0) {
            ids = _.pluck(selectedNonPrimaryCards, 'id');
        }
        return ids;
    };

    // Reset the selections for merge
    $scope.addListener('RESET_SELECTIONS_FOR_MERGE', function () {
        self.resetSelectionsForMerge();
    });

    // Refresh the selected cards for merge scroller
    $scope.addListener('REFRESH_SELECTED_CARDS_FOR_MERGE_SCROLLER', function () {
        self.refreshSelectedCardsScroller();
    });
}]);