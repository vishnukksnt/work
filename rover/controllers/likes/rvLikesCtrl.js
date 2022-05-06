"use strict";

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {

		sntRover.controller('RVLikesController', ['$scope', 'RVLikesSrv', 'RVGuestCardsSrv', 'dateFilter', '$stateParams', function ($scope, RVLikesSrv, RVGuestCardsSrv, dateFilter, $stateParams) {

			$scope.errorMessage = "";
			$scope.guestCardData.likes = {};
			$scope.guestLikesData = {};
			$scope.setScroller('likes_info');
			$scope.calculatedHeight = 274; // height of Preferences + News paper + Room type + error message div
			var presentLikeInfo = {},
			    updateData = {},
			    isInitMethodInvoked = false;

			$scope.$on('clearNotifications', function () {
				$scope.errorMessage = "";
				$scope.successMessage = "";
			});

			$scope.init = function () {
				BaseCtrl.call(this, $scope);
				var fetchLikesFailureCallback = function fetchLikesFailureCallback(data) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = data;
				};
				var data = {
					'userId': $scope.guestCardData.contactInfo.user_id,
					'isRefresh': $stateParams.isrefresh || true
				};

				if ($scope.guestCardData.contactInfo && $scope.guestCardData.contactInfo.user_id) {
					$scope.invokeApi(RVLikesSrv.fetchLikes, data, $scope.fetchLikesSuccessCallback, fetchLikesFailureCallback, 'NONE');
				}
			};
			$scope.fetchLikesSuccessCallback = function (data) {

				$scope.$emit('hideLoader');

				$scope.guestLikesData = data;

				var i, j, k, l;
				var each, values, match;

				for (i = 0, j = $scope.guestLikesData.preferences.length; i < j; i++) {
					each = $scope.guestLikesData.preferences[i];
					values = each['values'];

					// create a model within each like when the type is dropdown or radio
					// otherwise it will be a checkbox, so model inside values
					if ('dropdown' == each.type || 'radio' == each.type) {

						if (!$scope.guestLikesData.user_preference.length) {
							each.isChecked = '';
						} else {
							match = _.find(values, function (item) {
								return _.contains($scope.guestLikesData.user_preference, item.id);
							});

							if (!!match) {
								each.isChecked = match.id;
							} else {
								each.isChecked = '';
							}
						}
					}
					for (k = 0, l = values.length; k < l; k++) {
						values[k]['isChecked'] = false;

						if (_.contains($scope.guestLikesData.user_preference, values[k]['id'])) {
							values[k]['isChecked'] = true;
						}
					}
				}
				// angular.forEach($scope.guestLikesData.preferences, function(eachPref) {
				// 	$scope.calculatedHeight += 34;
				// 	var rowCount = 0;
				// 	angular.forEach(eachPref.values, function(prefValue, prefKey) {
				// 		rowCount++;
				// 		if (rowCount % 2 !== 0) {
				// 			$scope.calculatedHeight += 50;
				// 		}
				// 		var userPreference = $scope.guestLikesData.user_preference;
				// 		if (userPreference.indexOf(prefValue.id) !== -1) {
				// 			prefValue.isChecked = true;
				// 			eachPref.isChecked = true;
				// 		} else {
				// 			prefValue.isChecked = false;
				// 			eachPref.isChecked = false;
				// 		}
				// 	});
				// });


				var rowCount = 0;

				angular.forEach($scope.guestLikesData.room_features, function (value, key) {

					angular.forEach(value.values, function (roomFeatureValue, roomFeatureKey) {
						rowCount++;
						if (rowCount > 6 && $scope.guestLikesData.preferences.length <= 2) {
							$scope.calculatedHeight += 50;
						}
						var userRoomFeature = value.user_selection;

						if (userRoomFeature.indexOf(roomFeatureValue.id) !== -1) {
							roomFeatureValue.isSelected = true;
						} else {
							roomFeatureValue.isSelected = false;
						}
					});
				});
				$scope.guestCardData.likes = $scope.guestLikesData;

				setTimeout(function () {
					$scope.refreshScroller('likes_info');
				}, 1000);
			};

			$scope.$on('SHOWGUESTLIKESINFO', function () {
				$scope.init();
			});

			$scope.$on('REFRESHLIKESSCROLL', function () {
				$scope.refreshScroller('likes_info');
			});
			$scope.$on("$viewContentLoaded", function () {
				$scope.refreshScroller('likes_info');
			});

			/**
    * This function is used to get the guest id while taking the guest card from the menu
    * as well as during the create reservation flow
    */
			var getGuestId = function getGuestId() {
				var guestId;

				// Guest id during the create reservation flow
				if ($scope.reservationData && $scope.reservationData.guest && $scope.reservationData.guest.id) {
					guestId = $scope.reservationData.guest.id;
					// Guest id while navigating to the guest card from the menu
				} else if ($scope.guestCardData && $scope.guestCardData.contactInfo && $scope.guestCardData.contactInfo.user_id) {
					guestId = $scope.guestCardData.contactInfo.user_id;
				}

				return guestId;
			};

			/**
    * Save likes
    * @param {object} data response object
    * @return {undefined}
    */
			$scope.saveLikes = function (data) {

				var saveUserInfoSuccessCallback = function saveUserInfoSuccessCallback(data) {
					$scope.$emit('hideLoader');
				};
				var saveUserInfoFailureCallback = function saveUserInfoFailureCallback(data) {
					$scope.$emit('hideLoader');
					$scope.errorMessage = data;
					$scope.$emit('likesInfoError', true);
				};

				presentLikeInfo = JSON.parse(JSON.stringify(updateData));

				updateData.guest_id = $scope.guestCardData.contactInfo.guest_id;
				updateData.preference = [];
				angular.forEach($scope.guestLikesData.newspapers, function (value, key) {
					var newsPaperUpdateData = {};

					if (value.id === $scope.guestLikesData.user_newspaper) {
						newsPaperUpdateData.type = "NEWSPAPER";
						newsPaperUpdateData.value = value.name;
						updateData.preference.push(newsPaperUpdateData);
					}
				});
				angular.forEach($scope.guestLikesData.roomtype, function (value, key) {
					var roomTypeUpdateData = {};

					if (value.id === $scope.guestLikesData.user_roomtype) {
						roomTypeUpdateData.type = "ROOM TYPE";
						roomTypeUpdateData.value = value.name;
						updateData.preference.push(roomTypeUpdateData);
					}
				});

				angular.forEach($scope.guestLikesData.room_features, function (value, key) {
					angular.forEach(value.values, function (roomFeatureValue, roomFeatureKey) {
						var roomFeatureUpdateData = {};

						if (roomFeatureValue.isSelected) {
							roomFeatureUpdateData.type = "ROOM FEATURE";
							roomFeatureUpdateData.value = roomFeatureValue.details;
							updateData.preference.push(roomFeatureUpdateData);
						}
					});
				});

				angular.forEach($scope.guestLikesData.preferences, function (value, key) {

					// also this object created is nevery updated inside the loop below
					// and that F&*KS UP the data sent to the server
					// yeah its Vijay who wrote this comment, no need to git blame
					var preferenceUpdateData = {};

					angular.forEach(value.values, function (prefValue, prefKey) {

						if (prefValue.isChecked) {
							updateData.preference.push({
								'type': value.name,
								'value': prefValue.details
							});
						}
					});

					// who the F&*K would want to push the value after the above loop!!
					// yeah its Vijay who wrote this comment, no need to git blame
					// updateData.preference.push(preferenceUpdateData);
				});

				var dataToUpdate = JSON.parse(JSON.stringify(updateData)),
				    dataUpdated = angular.equals(dataToUpdate, presentLikeInfo) ? true : false,
				    guestId = getGuestId(),
				    isGuestFetchComplete = data && data.isFromGuestCardSection ? true : RVGuestCardsSrv.isGuestFetchComplete(guestId),
				    saveData = {
					userId: guestId,
					data: updateData
				};

				if (guestId && isGuestFetchComplete && !dataUpdated) {
					$scope.invokeApi(RVLikesSrv.saveLikes, saveData, saveUserInfoSuccessCallback, saveUserInfoFailureCallback);
				}
			};

			/**
    * to handle click actins outside this tab
    */
			var saveLikeListener = $scope.$on('SAVELIKES', function (event, data) {
				$scope.saveLikes(data);
			});

			$scope.$on('$destroy', saveLikeListener);

			$scope.changedCheckboxPreference = function (parentIndex, index) {
				angular.forEach($scope.guestLikesData.preferences[parentIndex].values, function (value, key) {
					if (key !== index) {
						value.isChecked = false;
					}
				});
			};

			$scope.changedRadioComboPreference = function (index) {
				_.each($scope.guestLikesData.preferences[index]['values'], function (item) {

					if (item.id === $scope.guestLikesData.preferences[index]['isChecked']) {
						item.isChecked = !item.isChecked;
						if (!item.isChecked) {
							$scope.guestCardData.likes.preferences[index].isChecked = "";
						}
					} else {
						item.isChecked = false;
					}
				});
			};

			$scope.getHalfArray = function (ar) {
				// TODO: Cross check math.ceil for all browsers
				var out = new Array(Math.ceil(ar.length / 2));

				return out;
			};
			/*
    * If number of elements in odd, then show if value exists
    */
			$scope.showLabel = function (featureName) {
				var showDiv = true;

				if (featureName === '' || featureName === undefined) {
					showDiv = false;
				}
				return showDiv;
			};

			$scope.getHalfArrayPref = function (ar) {
				// TODO: Cross check math.ceil for all browsers
				var out = new Array(Math.ceil(ar.length / 2));

				return out;
			};
			$scope.shouldShowRoomFeatures = function (roomFeatures) {
				var showRoomFeature = false;

				angular.forEach(roomFeatures, function (value, key) {
					if (value.values.length > 0) {
						showRoomFeature = true;
					}
				});
				return showRoomFeature;
			};

			var guestLikeTabActivateListener = $scope.$on('GUESTLIKETABACTIVE', function () {

				/**
     * Restrict the api call to trigger only once within a guest card
     * No need to invoke the api every time while switching the tabs
     */
				if (!isInitMethodInvoked) {
					isInitMethodInvoked = true;
					$scope.init();
				}
			});

			$scope.$on('$destroy', guestLikeTabActivateListener);

			// Checks whether any of the room feature is selected
			$scope.hasRoomFeatures = function () {
				var isAnyFeatureOptionSelected = false;

				_.each($scope.guestLikesData.room_features, function (value, key) {
					_.each(value.values, function (roomFeatureValue, roomFeatureKey) {

						if (roomFeatureValue.isSelected) {
							isAnyFeatureOptionSelected = true;
						}
					});
				});
				return isAnyFeatureOptionSelected;
			};

			$scope.init();
		}]);
	}, {}] }, {}, [1]);