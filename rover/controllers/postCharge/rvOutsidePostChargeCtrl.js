sntRover.controller('RVOutsidePostChargeController',
	[
		'$rootScope',
		'$scope',
		'RVPostChargeSrvV2',
		'RVSearchSrv',
		'$timeout', 'ngDialog', '$stateParams',
		'rvPermissionSrv',
		function($rootScope, $scope, RVPostChargeSrvV2, RVSearchSrv, $timeout, ngDialog, $stateParams, rvPermissionSrv ) {

			// hook up the basic things
			BaseCtrl.call( this, $scope );
			$scope.reservationsArray = [];

			$scope.fetchedData = {};
			$scope.isOutsidePostCharge = true;
			$scope.shouldShowChargesForMobile = false;

			$scope.init = function() {
				// Show/hide reservations or items
				$scope.itemsVisible = true;
				$scope.firstTime = true;
				$scope.search = {};
				$scope.search.guest_company_agent = '';
				$scope.search.room = '';
				$scope.showInitialSearchScreen = false;
				$scope.showSearchScreen = false;

				$scope.isCardAttched = false;
				$scope.noGuestOrRoomSelected = false;
				$scope.guestHasNotCheckedin = false;
				$scope.selectedReservationPostNotAllowed = false;
				$scope.chargePosted = false;
				$scope.cardAttached = {};
				$scope.disableOutsidePostChargeButton = false;
			};

			$scope.init();

			$scope.closeDialog = function() {
				// to add stjepan's popup showing animation
      			$rootScope.modalOpened = false;
      			$timeout(function() {
      				ngDialog.close();
      			}, 200);
  			};

			var oldSearchGuestText = '';
			var oldSearchRoomValue = '';

			$scope.setScroller('result_showing_area_post_charg', {'click': true, 'tap': true});
			$scope.roomSearchStatus = false;
			$scope.guestCompanySearchStatus = false;
			/**
			* function used for refreshing the scroller
			*/
			var refreshScroller = function() {
				$timeout(function() {
					if ($scope.myScroll && $scope.myScroll['result_showing_area_post_charg']) {
						$scope.myScroll['result_showing_area_post_charg'].refresh();
					}
					$scope.refreshScroller('result_showing_area_post_charg');
				}, 500);
			};

			$scope.searchForResultsSuccess = function(data) {
				$scope.$emit( 'hideLoader' );
				$scope.reservationsArray = data;

				oldSearchGuestText = $scope.search.guest_company_agent;
				oldSearchRoomValue = $scope.search.room;
				angular.forEach($scope.reservationsArray, function(value, key) {
					value.shouldShowReservation = true;
				});

				if ($scope.reservationsArray.length === 0) {
					$scope.showNoMatches = true;
				}
				$scope.showInitialSearchScreen = false;

				refreshScroller();
			};

			function isSearchOnSingleDigit(searchTerm) {
				if ($rootScope.isSingleDigitSearch) {
					return $scope.search.room.length >= 3;
				} else {
					return true;
				}
			}

			$scope.searchForResults = function() {
				$scope.showNoMatches = false;
				$scope.refreshApi = true;

				// CICO-11081 - Default page should be displayed when no data is entered in Search fields
				if ($scope.search.guest_company_agent.length === 0 && $scope.search.room.length === 0) {
					$scope.showInitialSearchScreen = true;
					$scope.$apply();
				}
				if ($scope.search.guest_company_agent.length === 0 && $scope.search.room.length === 0
																&& $scope.reservationsArray.length === 0) {
					$scope.showInitialSearchScreen = true;
				}

				// single difit search parameter is turned on in admin, room number search is made for single digit
				// company/TA/guest search will be done for 3 characters.
				// CICO-10323
				var search = false;

				if ($scope.search.guest_company_agent.length >= 3) {
					search = true;
				}
				if ($scope.search.room.length >= 3 && !$rootScope.isSingleDigitSearch) {
					search = true;
				}
				if ($scope.search.room.length >= 1 && $rootScope.isSingleDigitSearch) {
					search = true;
				}

				if (!search) {
					return false;
				}

				if (oldSearchGuestText.length > 0) {
					if ((oldSearchGuestText.length < $scope.search.guest_company_agent.length) && ($scope.search.guest_company_agent.indexOf(oldSearchGuestText) !== -1 )) {
						$scope.refreshApi = true;
					}
				}

				else if (oldSearchRoomValue.length > 0) {
					if ((oldSearchRoomValue.length < $scope.search.room.length) && ($scope.search.room.indexOf(oldSearchRoomValue) !== -1 )) {
						$scope.refreshApi = false;
					}
				}
				var dataToSrv = {
					"refreshApi": $scope.refreshApi,
				    "postData": {
				    	"room_no": $scope.search.room,
				    	"account": $scope.search.guest_company_agent
				    }
				};

				$scope.invokeApi(RVSearchSrv.fetchReservationsToPostCharge, dataToSrv, $scope.searchForResultsSuccess);
				$scope.itemsVisible = false;
			};
			$scope.clickedCancel = function() {
				$scope.search.guest_company_agent = '';
				$scope.search.room = '';
				$scope.showInitialSearchScreen = true;
				$scope.reservationsArray.length = 0;
				$scope.showNoMatches = false;
				$scope.itemsVisible = false;
				$scope.showSearchScreen = false;
			};
			$scope.showHideInitialSearchScreen = function() {
				if ($scope.search.guest_company_agent.length === 0 && $scope.search.room.length === 0
																&& $scope.reservationsArray.length === 0) {
					$scope.showInitialSearchScreen = true;
				}
				$scope.showSearchScreen = true;
				$scope.itemsVisible = false;
			};
			$scope.successGetBillDetails = function(data) {
				$scope.$emit( 'hideLoader' );
				data.isFromOut = true;
				$rootScope.$broadcast("UPDATED_BILLNUMBERS", data);
			};
			$scope.clickedReservationToPostCharge = function(reservationData) {
				$scope.selectedReservationId = reservationData.id;
				if (!!reservationData.restrict_post) {
					$scope.selectedReservationPostNotAllowed = true;
				} else {
					$scope.showPostChargesScreen();
					$scope.invokeApi(RVPostChargeSrvV2.getReservationBillDetails, $scope.selectedReservationId, $scope.successGetBillDetails);
				}

			};
			$scope.proceedWithPostCharge = function() {
				event.stopImmediatePropagation();
				$scope.selectedReservationPostNotAllowed = false;
				$scope.showPostChargesScreen();
				$scope.invokeApi(RVPostChargeSrvV2.getReservationBillDetails, $scope.selectedReservationId, $scope.successGetBillDetails);
			};
			$scope.showPostChargesScreen = function() {
				$scope.showInitialSearchScreen = false;
				$scope.showSearchScreen = false;
			};
			/**
			* function to check whether the user has permission to allow post with no credit
			* @return {Boolean}
			*/
			$scope.hasPermissionToAllowPostWithNoCredit = function() {
				return rvPermissionSrv.getPermissionValue('ALLOW_POST_WHEN_RESTRICTED');
			};

			/*
			* function used in template to map the reservation status to the view expected format
			*/
			$scope.getGuestStatusMapped = function(reservationStatus, isLateCheckoutOn) {
				  var viewStatus = "";

			      if (isLateCheckoutOn && "CHECKING_OUT" === reservationStatus) {
			        viewStatus = "late-check-out";
			        return viewStatus;
			      }
			      if ("RESERVED" === reservationStatus) {
			        viewStatus = "arrival";
			      } else if ("CHECKING_IN" === reservationStatus) {
			        viewStatus = "check-in";
			      } else if ("CHECKEDIN" === reservationStatus) {
			        viewStatus = "inhouse";
			      } else if ("CHECKEDOUT" === reservationStatus) {
			        viewStatus = "departed";
			      } else if ("CHECKING_OUT" === reservationStatus) {
			        viewStatus = "check-out";
			      } else if ("CANCELED" === reservationStatus) {
			        viewStatus = "cancel";
			      } else if (("NOSHOW" === reservationStatus) || ("NOSHOW_CURRENT" === reservationStatus)) {
			        viewStatus = "no-show";
			      }
			      return viewStatus;
		  };

		  // Map the room status to the view expected format
		  $scope.getRoomStatusMapped = function(roomstatus, fostatus) {
			    var mappedStatus = "";

			    if (roomstatus === "READY" && fostatus === "VACANT") {
			    mappedStatus = 'ready';
			    } else {
			    mappedStatus = "not-ready";
			    }
			    return mappedStatus;
		  };

		  // function that converts a null value to a desired string.

		   // if no replace value is passed, it returns an empty string

		  $scope.escapeNull = function(value, replaceWith) {
		      var newValue = "";

		      if ((typeof replaceWith !== "undefined") && (replaceWith !== null)) {
		       newValue = replaceWith;
		       }
		      var valueToReturn = ((value === null || typeof value === 'undefined' ) ? newValue : value);

		      return valueToReturn;
		   };

		   /*
		   * function to get reservation class against reservation status
		   */
		   $scope.getReservationClass = function(reservationStatus) {
		   		var classes = {
		   			"CHECKING_IN": 'guest-check-in',
		   			"CHECKEDIN": 'guest-inhouse',
		   			"CHECKING_OUT": 'guest-check-out',
		   			"CANCELED": 'guest-cancel',
		   			"NOSHOW": 'guest-no-show',
		   			"NOSHOW_CURRENT": 'guest-no-show'
		   		};

		   		if (reservationStatus.toUpperCase() in classes) {
		   			return classes[reservationStatus.toUpperCase()];
		   		}
		   	};

			$scope.getQueueClass = function(isReservationQueued, isQueueRoomsOn) {
		  	    var queueClass = '';

		  		if (isReservationQueued === "true" && isQueueRoomsOn === "true") {
		 			queueClass = 'queued';
		 		}
		 		return queueClass;
		    };

		    $scope.getMappedClassWithResStatusAndRoomStatus = function(reservation_status, roomstatus, fostatus, roomReadyStatus, checkinInspectedOnly) {
		       var mappedStatus = "room-number";

		       if (reservation_status === 'CHECKING_IN') {

			      	switch (roomReadyStatus) {

						case "INSPECTED":
							mappedStatus += ' room-green';
							break;
						case "CLEAN":
							if (checkinInspectedOnly === "true") {
								mappedStatus += ' room-orange';
								break;
							} else {
								mappedStatus += ' room-green';
								break;
							}
							break;
						case "PICKUP":
							mappedStatus += " room-orange";
							break;

						case "DIRTY":
							mappedStatus += " room-red";
							break;
					}
			    }
			   	return mappedStatus;
		   	};

			/*
			 * Method to handle selection of guest/compny/TA item
			 */
			$scope.selectReservation = function(item) {
				$scope.isCardAttched = true;
				$scope.cardAttached = item;
			};
			/*
			 * Method to handle DETACH CARD button click.
			 */
			$scope.clickedDetachCard = function(item) {
				$scope.isCardAttched = false;
				$scope.cardAttached = {};
				$scope.search.room = '';
				$scope.search.guest_company_agent = '';
				$scope.fetchedData.bill_numbers = [];
			};
			/*
			 * Method to handle POST CHARGE button click.
			 */
			$scope.clickedPostCharges = function( event ) {

                event.stopImmediatePropagation();
                event.stopPropagation();

				if (!$scope.isCardAttched) {
					$scope.noGuestOrRoomSelected = true;
				}
				else if ($scope.cardAttached.reservation_status === 'CHECKING_IN' || $scope.cardAttached.reservation_status === 'RESERVED') {
					$scope.guestHasNotCheckedin = true;
				}
				else {
					$scope.reservation_id = $scope.cardAttached.id;
					$scope.restrict_post = $scope.cardAttached.restrict_post;
					$rootScope.$broadcast('POSTCHARGE');
					$scope.disableOutsidePostChargeButton = true;
				}
			};
			/*
			 * Method to handle ADD GUEST OR ROOM button click
			 * On 'No guest/room selected!'
			 */
			$scope.clickedAddGuestOrRoom = function() {
				$scope.noGuestOrRoomSelected = false;
				$scope.showHideInitialSearchScreen();
			};
			$scope.clickedAddGuestOrRoomCancel = function() {
				$scope.noGuestOrRoomSelected = false;
			};
			/*
			 * Method to handle POST CHARGE button click,
			 * On 'Guest has not yet checked in!' popup.
			 */
			$scope.clickedPostCharge = function( event ) {

				event.stopImmediatePropagation();
                event.stopPropagation();

				$scope.guestHasNotCheckedin = false;
				$scope.reservation_id = $scope.cardAttached.id;
				$scope.restrict_post = $scope.cardAttached.restrict_post;
				$rootScope.$broadcast('POSTCHARGE');
				$scope.disableOutsidePostChargeButton = true;
			};
			$scope.clickedPostChargeCancel = function() {
				$scope.guestHasNotCheckedin = false;
				$scope.selectedReservationPostNotAllowed = false;
				$scope.clickedDetachCard();
			};

			/*
			 * Method to handle POST ANOTHER CHARGE button click
			 * On 'Charge posted' popup
			 */
			$scope.clickedPostAnotherCharge = function() {
				$scope.init();
				$scope.chargePosted = false;
				$rootScope.$broadcast('RESETPOSTCHARGE');
			};
			$scope.clickedPostAnotherChargeCancel = function() {
				$scope.chargePosted = false;
				$scope.closeDialog();
			};
			/*
			 * On charge posted successfully.
			 */
			$rootScope.$on('CHARGEPOSTED', function(event, data) {
			    $scope.guestHasNotCheckedin = false;
				$scope.chargePosted = true;
				$scope.disableOutsidePostChargeButton = false;
			});
			$scope.keyDownRoom = function() {
				$scope.roomSearchStatus = true;
			};
			$scope.keyBlurRoom = function() {
				$scope.roomSearchStatus = false;
			};
			$scope.keyDownGuestCompany = function() {
				$scope.guestCompanySearchStatus = true;
			};
			$scope.keyBlurGuestCompany = function() {
				$scope.guestCompanySearchStatus = false;
			};
			$scope.escapeNullStr = function(value, replaceWith) {
				var newValue = "";

				if ((typeof replaceWith !== "undefined") && (replaceWith !== null)) {
					newValue = replaceWith;
				}
				var valueToReturn = ((value === null || typeof value === 'undefined') ? newValue : value);

				if (valueToReturn.indexOf('null') !== -1) {
					valueToReturn = '';// removes unwanted ", null" type of values
				}
				return valueToReturn;
			};

			var clickedViewChargesListener = $rootScope.$on('CLICKED_VIEW_CHARGES', function() {
				$scope.shouldShowChargesForMobile = true;
			});

			var backToChargesListListener = $rootScope.$on('BACK_TO_CHARGES_LIST', function() {
				$scope.shouldShowChargesForMobile = false;
			});

			$scope.$on('$destroy', clickedViewChargesListener);
			$scope.$on('$destroy', backToChargesListListener);
		}
	]
);