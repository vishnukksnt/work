"use strict";

// rate auto complete feature
(function () {

	var rvCompanyCardSrv,
	    highlightFilter_ = null,
	    autocompleteEl;

	/**
  * [autoCompleteLinkFn description]
  * @param  {[type]} scope [description]
  * @param  {[type]} el    [description]
  * @param  {[type]} attrs [description]
  * @return {[type]}       [description]
  */
	var autoCompleteCtrlFn = function autoCompleteCtrlFn($scope) {
		BaseCtrl.call(this, $scope);

		var minLengthToTrigger;

		var successCallBackOfFetchRates = function successCallBackOfFetchRates(data, successCallBackParameters) {
			if (data.contract_rates.length === 0) {
				$scope.$emit("showErrorMessage", ["Unable find charge code against '" + $scope.rate_name + "'"]);
				$scope.rate_id = '';
				return;
			}
			successCallBackParameters.callBackToAutoComplete(data.contract_rates);
		};

		/**
   * [fetchRates description]
   * @return {[type]} [description]
   */
		var fetchRates = function fetchRates(callBackToAutoComplete) {
			var params = {
				query: $scope.rate_name,
				account_id: $scope.account_id
			};
			var options = {
				params: params,
				successCallBack: successCallBackOfFetchRates,
				successCallBackParameters: {
					callBackToAutoComplete: callBackToAutoComplete
				}
			};

			$scope.callAPI(rvCompanyCardSrv.fetchRates, options);
		};

		$scope.clearConfigValues = function () {
			$scope.rate_id = '';
			$scope.rate_name = '';
			$(autocompleteEl).find('#company-rate-query').autocomplete('close');
		};

		// jquery autocomplete Souce handler
		// get two arguments - request object and response callback function
		var autoCompleteSourceHandler = function autoCompleteSourceHandler(request, callBackToAutoComplete) {
			if (request.term.length === 0) {
				$scope.clearConfigValues();
				runDigestCycle();
			} else if (request.term.length > minLengthToTrigger) {
				fetchRates(callBackToAutoComplete);
			}
		};

		/**
   * to run angular digest loop,
   * will check if it is not running
   * return - None
   */
		var runDigestCycle = function runDigestCycle() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		/**
   * [autoCompleteSelectHandler description]
   * @param  {[type]} event [description]
   * @param  {[type]} ui    [description]
   * @return {[type]}       [description]
   */
		var autoCompleteSelectHandler = function autoCompleteSelectHandler(event, ui) {
			$scope.rate_id = ui.item.id;
			$scope.rate_name = ui.item.name;
			$scope.$emit('RATE_SELECTED', ui.item);
			runDigestCycle();
			return false;
		};

		$scope.processEachItem = function (item, scope) {
			var $content = highlightFilter_(item.name, $scope.rate_name),
			    $result = $("<a></a>").html($content),
			    defIconText = '',
			    $image = '';

			switch (item.classification_name) {
				case 'SPECIALS':
				case 'PUBLIC':
					defIconText = 'Public';
					break;
				case 'CORPORATE':
					defIconText = 'Corporate';
					break;
				default:
					break;
			}
			$image = '<span class="label ' + defIconText + '">' + defIconText + '</span>';

			if (item.classification_name) {
				$($image).appendTo($result);
			}

			return $result;
		};
		/**
   * Initialization stuffs
   * @return {undefiend}
   */
		var initializeMe = function () {
			$scope.rateAutocompleteOptions = {
				delay: _.isUndefined($scope.delay) ? 600 : parseInt($scope.delay),
				minLength: 0,
				position: {
					my: "left top",
					at: "left bottom",
					collision: 'flip'
				},
				source: autoCompleteSourceHandler,
				select: autoCompleteSelectHandler
			};
			setTimeout(function () {
				$scope.$apply(function () {
					$scope.label = _.isUndefined($scope.label) ? 'Contracted Rate' : $scope.label;
					$scope.entryDivClass = _.isUndefined($scope.entryDivClass) ? 'find-rate margin' : $scope.entryDivClass;
					minLengthToTrigger = _.isUndefined($scope.minLengthToTrigger) ? 1 : parseInt($scope.minLengthToTrigger);
				});
			}, 100);
		}();
	};

	var linkFn = function linkFn(scope, el) {
		autocompleteEl = el;
	};

	angular.module('sntRover').directive('rateAutoComplete', ['RVCompanyCardSrv', 'highlightFilter', function (RVCompanyCardSrv, highlightFilter) {
		rvCompanyCardSrv = RVCompanyCardSrv, highlightFilter_ = highlightFilter;
		return {
			restrict: 'AE',
			replace: true,
			scope: {
				rate_id: '=selectedRateId',
				rate_name: '=ngModel',
				label: '@label',
				entryDivClass: '@entryDivClass',
				delay: '@delay',
				minLengthToTrigger: '@minLengthToTrigger',
				account_id: '=accountId'
			},
			link: linkFn,
			controller: autoCompleteCtrlFn,
			templateUrl: '/assets/directives/rateAutoComplete/rateautocompletedir.html'
		};
	}]);
})();