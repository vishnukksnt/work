angular.module('sntRover').controller('allotmentAvailabilityMainController', [
	'$scope',
	'rvAvailabilitySrv',
	'$rootScope',
	'ngDialog',
	'$filter',
	'$timeout',
	function($scope, rvAvailabilitySrv, $rootScope, ngDialog, $filter, $timeout) {


	BaseCtrl.call(this, $scope);

	$scope.page.title = "Allotments";
	// default number of selected days is 14
	$scope.numberOfDaysSelected = '14';


	$scope.data = {};

	// default date value
	$scope.data.selectedDate = $rootScope.businessDate;
	$scope.data.formattedSelectedDate = $filter('date')($scope.data.selectedDate, $rootScope.dateFormat);

	// To popup contract start date
	$scope.clickedOnDatePicker = function() {
		ngDialog.open({
			template: '/assets/partials/common/rvDatePicker.html',
			controller: 'rvRoomAvailabilityDatePickerController',
			className: '',
			scope: $scope,
			closeByDocument: true
		});
	};

	/**
	* success call of availability data fetch
	*/
	var successCallbackOfAvailabilityFetch = function(data) {
		$scope.$emit("hideLoader");
		$scope.$broadcast("changedRoomAvailableData");
		// for this successcallback we are not hiding the activty indicator
		// we will hide it only after template loading.

	};

	/**
	* error call of availability data fetch
	*/
	var failureCallbackOfAvailabilityFetch = function(errorMessage) {
		$scope.$emit("hideLoader");
	};


	/**
	* When there is any change of for availability data params we need to call the api
	*/
	$scope.changedAvailabilityDataParams = function() {
		$timeout(function() {
		// calculating date after number of dates selected in the select box
			var dateAfter = tzIndependentDate ($scope.data.selectedDate);

			dateAfter.setDate (dateAfter.getDate() + parseInt($scope.numberOfDaysSelected) - 1);
			var dataForWebservice = {
				'from_date': $filter('date')(tzIndependentDate ($scope.data.selectedDate), $rootScope.dateFormatForAPI),
				'to_date': $filter('date')(tzIndependentDate (dateAfter), $rootScope.dateFormatForAPI)
			};

			$scope.invokeApi(rvAvailabilitySrv.fetchAllotmentAvailabilityDetails, dataForWebservice, successCallbackOfAvailabilityFetch, failureCallbackOfAvailabilityFetch);
		}, 0);
	};


	$scope.changedAvailabilityDataParams();
	}]);
