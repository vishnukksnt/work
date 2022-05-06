'use strict';

angular.module('sntRover').service('RVMergeCardsSrv', ['$q', 'rvBaseWebSrvV2', function ($q, RVBaseWebSrvV2) {

    /**
     * Verify whether the given cards are eligible for merge
     * @param {Object} params contains array of ids of the cards
     * @return {Promise} promise
     */
    this.verifyCardMerge = function (params) {
        var deferred = $q.defer(),
            url = '/api/accounts/validate_card_merge';

        if (params.isGuestCard) {
            url = '/api/guest_details/validate_card_merge';
            delete params.isGuestCard;
        }

        RVBaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };

    /**
     * Merge the non-primary cards to primary card
     * @param {Object} params contains primary card id, non-primary card ids and card type
     * @return {Promise} promise
     */
    this.mergeCards = function (params) {
        var deferred = $q.defer(),
            url = '/api/accounts/merge_cards';

        if (params.isGuestCard) {
            url = '/api/guest_details/merge_cards';
            delete params.isGuestCard;
            delete params.card_type;
        }

        RVBaseWebSrvV2.postJSON(url, params).then(function (data) {
            deferred.resolve(data);
        }, function (data) {
            deferred.reject(data);
        });
        return deferred.promise;
    };
}]);