"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

		angular.module('sntRover').controller('stayCardMainCtrl', ['$rootScope', '$scope', 'RVCompanyCardSrv', '$stateParams', 'RVReservationCardSrv', 'RVGuestCardSrv', 'RVGuestCardsSrv', 'ngDialog', '$state', 'RVReservationSummarySrv', '$timeout', 'dateFilter', 'RVContactInfoSrv', '$q', 'RVReservationStateService', 'RVReservationDataService', 'rvGroupConfigurationSrv', 'rvAllotmentConfigurationSrv', 'RVReservationPackageSrv', function ($rootScope, $scope, RVCompanyCardSrv, $stateParams, RVReservationCardSrv, RVGuestCardSrv, RVGuestCardsSrv, ngDialog, $state, RVReservationSummarySrv, $timeout, dateFilter, RVContactInfoSrv, $q, RVReservationStateService, RVReservationDataService, rvGroupConfigurationSrv, rvAllotmentConfigurationSrv, RVReservationPackageSrv) {
			BaseCtrl.call(this, $scope);
			// Switch to Enable the new cards addition funcitonality
			$scope.addNewCards = true;
			var that = this;

			if ($scope.guestCardData.cardHeaderImage === undefined || $scope.guestCardData.cardHeaderImage === "") {
				$scope.guestCardData.cardHeaderImage = '/ui/pms-ui/images/avatar-trans.png';
			}
			$scope.pendingRemoval = {
				status: false,
				cardType: ""
			};

			$scope.$on('parentShowError', function (event, error) {
				$scope.errorMessage = error;
			});

			var roomAndRatesState = 'rover.reservation.staycard.mainCard.room-rates',
			    staycardState = 'rover.reservation.staycard.reservationcard.reservationdetails';

			$scope.setHeadingTitle = function (heading) {
				$scope.heading = heading;
				$scope.setTitle(heading);
			};

			$scope.cardSaved = function () {
				$scope.viewState.isAddNewCard = false;
			};

			var successCallbackOfCountryListFetch = function successCallbackOfCountryListFetch(data) {
				$scope.countries = data;
			};

			// fetching country list
			$scope.invokeApi(RVCompanyCardSrv.fetchCountryList, {}, successCallbackOfCountryListFetch);

			$scope.initGuestCard = function (guestData) {
				if (!guestData) {
					guestData = {
						id: ""
					};
				}

				if (!!guestData.id || !!$scope.reservationDetails.guestCard.id || !!$scope.reservationData.guest.id) {
					var param = {
						'id': guestData.id || $scope.reservationDetails.guestCard.id || $scope.reservationData.guest.id
					};

					$scope.guestCardData.userId = param.id;
					$scope.guestCardData.guestId = param.id;
					angular.merge($scope.guestCardData.contactInfo, _defineProperty({
						first_name: $scope.reservationData.guest.firstName,
						last_name: $scope.reservationData.guest.lastName,
						phone: $scope.reservationData.guest.phone,
						mobile: $scope.reservationData.guest.mobile,
						vip: $scope.reservationData.guest.is_vip,
						email: $scope.reservationData.guest.email,
						avatar: $scope.reservationData.guest.image,
						address: $scope.reservationData.guest.address,
						notes_count: $scope.reservationData.guest.notes_count,
						user_id: param.id,
						nationality_id: $scope.guestCardData.nationality_id
					}, "address", {
						country_id: $scope.guestCardData.contactInfo.address !== undefined ? $scope.guestCardData.contactInfo.address.country_id : ''
					}));

					// Timeout to allow the RVGuestCardCtrl(app/assets/rover/controllers/cards/guestCardControl.js) to initiate
					$timeout(function () {
						$scope.$broadcast('loyaltyLevelAvailable', $scope.reservationData.guest.membership_type);
					}, 1000);

					RVGuestCardsSrv.setGuest(param.id);

					// CICO-40614 In case of soft reload of stay card (eg. shared room other staycard navigation) the guestCard should be inititated
					$scope.$broadcast('guestCardAvailable');

					/**
     * CICO-40606
     * In case of editing a hourly reservation, the guest details aren't transferred from the diary to the confirmation screen (as the diary comes under a different state)
     * Hence, for the scenario where we have a guest id, and we are coming into the summary screen in case of hourly reservations, we will have to make this call and fetch
     * the guest details
      */
					if ($stateParams.mode === "EDIT_HOURLY" || $rootScope.isHourlyRateOn && $state.current.name !== 'rover.reservation.staycard.reservationcard.reservationdetails') {
						$scope.callAPI(RVGuestCardsSrv.fetchGuestDetailsInformation, {
							successCallBack: function successCallBack(data) {
								fetchGuestCardDataSuccessCallback(data);
							},
							failureCallBack: function failureCallBack(errorMessage) {
								$scope.errorMessage = errorMessage;
								$scope.$emit('hideLoader');
							},
							params: param.id
						});
					}
				}
			};

			/**
    * Method to handle the succesful response of guest details fetching
    * @param {Object} data API response
    * @return {undefined}
    */
			function fetchGuestCardDataSuccessCallback(data) {
				var contactInfoData, guestInfo;

				$scope.idTypeList = data.id_type_list;
				// No more future reservations returned with this API call
				/**
     *    CICO-9169
     *    Guest email id is not checked when user adds Guest details in the Payment page of Create reservation
     *  -- To have the primary email id in
     *  app/assets/rover/partials/reservation/rvSummaryAndConfirm.html checked if the user attached has one!
     */

				// Handles cases where Guest with email is replaced with a Guest w/o an email address!
				$scope.otherData.isGuestPrimaryEmailChecked = !!(data.email && data.email.length > 0);

				if (!data.stayCount) {
					data.stayCount = $scope.guestCardData && $scope.guestCardData.contactInfo && $scope.guestCardData.contactInfo.stayCount;
				}

				//	CICO-9169
				contactInfoData = {
					'contactInfo': data,
					'countries': $scope.countries,
					// While coming in the guest Id might be retained in reservationData.guest.id
					// in case another reservation is created for the same guest
					'userId': $scope.reservationDetails.guestCard.id || $scope.reservationData.guest.id,
					'avatar': $scope.guestCardData.cardHeaderImage,
					'guestId': $scope.reservationDetails.guestCard.id || $scope.reservationData.guest.id,
					'vip': data.vip
				};
				$scope.guestCardData.contactInfo = contactInfoData.contactInfo;
				if ($scope.guestCardData.contactInfo.birthday !== null) {
					$scope.guestCardData.contactInfo.birthday = moment($scope.guestCardData.contactInfo.birthday).format("YYYY-MM-DD");
				}
				if ($scope.guestCardData.contactInfo.id_issue_date !== null) {
					$scope.guestCardData.contactInfo.id_issue_date = moment($scope.guestCardData.contactInfo.id_issue_date).format("YYYY-MM-DD");
				}
				if ($scope.guestCardData.contactInfo.entry_date !== null) {
					$scope.guestCardData.contactInfo.entry_date = moment($scope.guestCardData.contactInfo.entry_date).format("YYYY-MM-DD");
				}
				if ($scope.guestCardData.contactInfo.id_expiration_date !== null) {
					$scope.guestCardData.contactInfo.id_expiration_date = moment($scope.guestCardData.contactInfo.id_expiration_date).format("YYYY-MM-DD");
				}

				$scope.guestCardData.contactInfo.avatar = contactInfoData.avatar;
				$scope.guestCardData.contactInfo.vip = contactInfoData.vip;
				$scope.countriesList = $scope.countries;
				$scope.guestCardData.userId = contactInfoData.userId;
				$scope.guestCardData.guestId = contactInfoData.guestId;
				$scope.guestCardData.contactInfo.genderTypeList = data.gender_list;

				guestInfo = {
					'user_id': contactInfoData.userId,
					'guest_id': null
				};

				$scope.searchData.guestCard.guestFirstName = '';
				$scope.searchData.guestCard.guestLastName = '';
				$scope.searchData.guestCard.guestCity = '';
				$scope.searchData.guestCard.guestLoyaltyNumber = '';
				$scope.searchData.guestCard.email = '';

				$scope.guestCardData.contactInfo.user_id = contactInfoData.userId;
				$scope.reservationData.guest.email = data.email;
				$scope.showGuestPaymentList(guestInfo);
				RVContactInfoSrv.completeContactInfoClone = JSON.parse(JSON.stringify($scope.guestCardData.contactInfo));

				// CICO-16013 - fixing multiple API calls on staycard loading
				$scope.$broadcast('guestSearchStopped');
				$scope.$broadcast('guestCardAvailable');
				$scope.$broadcast('resetGuestTab');
				$scope.$emit('hideLoader');
			}

			$scope.$on('UPDATE_GUEST_CARD_DETAILS', function (event, data) {
				fetchGuestCardDataSuccessCallback(data);
			});

			/**
   * [successCallbackOfGroupDetailsFetch description]
   * @return {[type]} [description]
   */
			var successCallbackOfGroupDetailsFetch = function successCallbackOfGroupDetailsFetch(response) {
				_.extend($scope.groupConfigData, {
					activeTab: 'SUMMARY', // Possible values are SUMMARY, ROOM_BLOCK, ROOMING, ACCOUNT, TRANSACTIONS, ACTIVITY
					summary: response.groupSummary,
					selectAddons: false, // To be set to true while showing addons full view
					addons: {},
					selectedAddons: []
				});
			};

			/**
    * CB on success of allotments fetch
    * @param  {[type]} response [description]
    * @return {[type]}          [description]
    */
			var onAllotmentSummaryFetchSuccess = function onAllotmentSummaryFetchSuccess(response) {
				_.extend($scope.allotmentConfigData, {
					activeTab: 'SUMMARY', // Possible values are SUMMARY, ROOM_BLOCK, ROOMING, ACCOUNT, TRANSACTIONS, ACTIVITY
					summary: response.allotmentSummary,
					selectAddons: false, // To be set to true while showing addons full view
					addons: {},
					selectedAddons: []
				});
			};

			var onAllotmentsHoldListFetchSuccess = function onAllotmentsHoldListFetchSuccess(holdStatusList) {
				_.extend($scope.allotmentConfigData, {
					holdStatusList: holdStatusList.data.hold_status
				});
			};

			/**
    * [successCallBackOfGroupHoldListFetch description]
    * @param  {[type]} holdStatusList [description]
    * @return {[type]}                [description]
    */
			var successCallBackOfGroupHoldListFetch = function successCallBackOfGroupHoldListFetch(holdStatusList) {
				_.extend($scope.groupConfigData, {
					holdStatusList: holdStatusList.data.hold_status
				});
			};

			/**
    * [successFetchOfAllReqdForGroupDetailsShowing description]
    * @param  {[type]} data [description]
    * @return {[type]}      [description]
    */
			var successFetchOfAllReqdForGroupDetailsShowing = function successFetchOfAllReqdForGroupDetailsShowing(data) {
				$scope.$broadcast('groupCardAvailable');
				$scope.$broadcast('groupSummaryDataChanged', $scope.groupConfigData);
				$scope.$emit("hideLoader");
			};

			var onInitAllotmentSuccess = function onInitAllotmentSuccess(data) {
				$scope.$broadcast('allotmentCardAvailable');
				$scope.$broadcast('allotmentSummaryDataChanged', $scope.allotmentConfigData);
				$scope.$emit("hideLoader");
			};

			/**
    * [failedToFetchOfAllReqdForGroupDetailsShowing description]
    * @return {[type]} [description]
    */
			var failedToFetchOfAllReqdForGroupDetailsShowing = function failedToFetchOfAllReqdForGroupDetailsShowing(errorMessage) {
				$scope.errorMessage = errorMessage;
				$scope.$emit("hideLoader");
			};

			var fetchExistingAddonsAndGotoRoomRates = function fetchExistingAddonsAndGotoRoomRates(options) {
				$scope.invokeApi(RVReservationPackageSrv.getReservationPackages, $scope.reservationData.reservationId, function (response) {
					$scope.$emit('hideLoader');
					var roomData = $scope.reservationData.rooms[0]; // Accessing from staycard -> ONLY one room/reservation!
					// Reset addons package

					roomData.addons = [];
					angular.forEach(response.existing_packages, function (addon) {
						roomData.addons.push({
							quantity: addon.addon_count,
							id: addon.id,
							price: parseFloat(addon.amount),
							amountType: addon.amount_type,
							postType: addon.post_type,
							title: addon.name,
							totalAmount: addon.addon_count * parseFloat(addon.amount),
							is_inclusive: addon.is_inclusive,
							taxes: addon.taxes,
							is_rate_addon: addon.is_rate_addon,
							allow_rate_exclusion: addon.allow_rate_exclusion,
							excluded_rate_ids: addon.excluded_rate_ids
						});
					});
					if (options) {
						$scope.navigateToRoomAndRates(options);
					} else {
						if (!$scope.reservationData.keepExistingRate) {
							$scope.navigateToRoomAndRates(options);
						} else {
							$state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
								"id": typeof $stateParams.id === "undefined" ? $scope.reservationData.reservationId : $stateParams.id,
								"confirmationId": $stateParams.confirmationId
							});
						}
					}
				});
			};

			$scope.initGroupCard = function (groupId) {
				var promises = [];
				// we are not using our normal API calling since we have multiple API calls needed

				$scope.$emit('showLoader');

				$scope.groupConfigData = {
					activeScreen: 'STAY_CARD'
				};

				// CICO-49183
				if (!!groupId) {
					// group details fetch
					var paramsForGroupDetails = {
						groupId: groupId
					};

					promises.push(rvGroupConfigurationSrv.getGroupSummary(paramsForGroupDetails).then(successCallbackOfGroupDetailsFetch));

					// reservation list fetch
					var paramsForHoldListFetch = {
						is_group: true
					};

					promises.push(rvGroupConfigurationSrv.getHoldStatusList(paramsForHoldListFetch).then(successCallBackOfGroupHoldListFetch));

					// Lets start the processing
					$q.all(promises).then(successFetchOfAllReqdForGroupDetailsShowing, failedToFetchOfAllReqdForGroupDetailsShowing);
				}
			};

			/**
    * [initAllotmentCard description]
    * @param  {[type]} allotmentId [description]
    * @return {[type]}             [description]
    */
			$scope.initAllotmentCard = function (allotmentId) {
				var promises = [];

				$scope.$emit('showLoader');

				$scope.allotmentConfigData = {
					activeScreen: 'STAY_CARD'
				};

				// Preload the summary data and the hold status options
				promises.push(rvAllotmentConfigurationSrv.getAllotmentSummary({
					allotmentId: allotmentId
				}).then(onAllotmentSummaryFetchSuccess));
				promises.push(rvGroupConfigurationSrv.getHoldStatusList({
					is_allotment: true
				}).then(onAllotmentsHoldListFetchSuccess));
				$q.all(promises).then(onInitAllotmentSuccess, failedToFetchOfAllReqdForGroupDetailsShowing);
			};

			// fetch reservation company card details
			$scope.initCompanyCard = function () {
				var companyCardFound = function companyCardFound(data) {
					$scope.$emit("hideLoader");
					data.id = $scope.reservationDetails.companyCard.id;
					$scope.companyContactInformation = data;
					// No more future reservations returned with this API call

					$scope.$broadcast('companyCardAvailable');
				};
				//	companycard defaults to search mode
				// 	Hence, do API call only if a company card ID is returned

				if ($scope.reservationDetails.companyCard.id !== '' && $scope.reservationDetails.companyCard.id !== null) {
					var param = {
						'id': $scope.reservationDetails.companyCard.id
					};

					$scope.invokeApi(RVCompanyCardSrv.fetchContactInformationAndMandatoryFields, param, companyCardFound);
				}
			};

			// fetch reservation travel agent card details
			$scope.initTravelAgentCard = function () {
				var successCallbackOfInitialFetch = function successCallbackOfInitialFetch(data) {
					$scope.$emit("hideLoader");
					data.id = $scope.reservationDetails.travelAgent.id;
					$scope.travelAgentInformation = data;

					// No more future reservations returned with this API call

					$scope.$broadcast('travelAgentFetchComplete');
				};
				//	TAcard defaults to search mode
				// 	Hence, do API call only if a company card ID is returned

				if ($scope.reservationDetails.travelAgent.id !== '' && $scope.reservationDetails.travelAgent.id !== null) {
					var param = {
						'id': $scope.reservationDetails.travelAgent.id
					};

					$scope.invokeApi(RVCompanyCardSrv.fetchContactInformationAndMandatoryFields, param, successCallbackOfInitialFetch);
				}
			};

			$scope.$on('cardIdsFetched', function (event, isCardSame) {
				// Restore view state
				$scope.viewState.pendingRemoval.status = false;
				$scope.viewState.pendingRemoval.cardType = "";
				var timer = 0;

				// init all cards with new data
				if (!isCardSame.guest) {
					$scope.$broadcast('guestCardDetached');
					$scope.initGuestCard();
					timer += 300;
				}

				// CICO-20547 do NOT init group cards for overlays
				if (!isCardSame.group && $rootScope.isStandAlone) {
					$timeout(function () {
						$scope.$broadcast('groupCardDetached');
						$scope.initGroupCard($scope.reservationDetails.group.id);
					}, timer);
					timer += 300;
				}

				// CICO-20547 do NOT init group cards for overlays
				if (!isCardSame.allotment && $rootScope.isStandAlone) {
					$timeout(function () {
						$scope.$broadcast('groupCardDetached');
						$scope.initAllotmentCard($scope.reservationDetails.allotment.id);
					}, timer);
					timer += 300;
				}

				if (!isCardSame.company) {
					$timeout(function () {
						$scope.$broadcast('companyCardDetached');
						$scope.initCompanyCard();
					}, timer);
					timer += 300;
				}

				if (!isCardSame.agent) {
					$timeout(function () {
						$scope.$broadcast('travelAgentDetached');
						$scope.initTravelAgentCard();
					}, timer);
				}

				// The future counts of the cards attached with the reservation
				// will be received here!
				// This code should be HIT everytime there is a removal or a replacement of
				// any of the cards attached!
				// if cards are not attached future reservation values are coming in as null
				var futureCounts = $scope.reservationListData.future_reservation_counts;

				$scope.reservationDetails.guestCard.futureReservations = futureCounts.guest === null ? 0 : futureCounts.guest;
				$scope.reservationDetails.companyCard.futureReservations = futureCounts.company === null ? 0 : futureCounts.company;
				$scope.reservationDetails.travelAgent.futureReservations = futureCounts.travel_agent === null ? 0 : futureCounts.travel_agent;

				// TODO: Remove the following commented out code!
				// Leaving it now for further debugging if required

			});

			/**
    * to navigate to room & rates screen
    * @return {[type]} [description]
    */
			$scope.navigateToRoomAndRates = function (options) {
				var _$state$go;

				var resData = $scope.reservationData,
				    disableBackToStaycard = options && options.disableBackToStaycard,
				    isGroupDetachmentRequested = options && options.isGroupDetachmentRequested;

				$state.go(roomAndRatesState, (_$state$go = {
					from_date: resData.arrivalDate,
					to_date: resData.departureDate,
					fromState: function () {
						if ($state.current.name === "rover.reservation.staycard.reservationcard.reservationdetails") {
							return 'STAY_CARD';
						} else {
							return $state.current.name;
						}
					}(),
					company_id: resData.company.id,
					allotment_id: resData.allotment.id,
					travel_agent_id: resData.travelAgent.id,
					group_id: resData.group && resData.group.id
				}, _defineProperty(_$state$go, "allotment_id", resData.allotment && resData.allotment.id), _defineProperty(_$state$go, "disable_back_staycard", disableBackToStaycard), _defineProperty(_$state$go, "view", "ROOM_RATE"), _defineProperty(_$state$go, "room_type_id", $scope.$parent.reservationData.tabs[$scope.viewState.currentTab].roomTypeId), _defineProperty(_$state$go, "adults", $scope.$parent.reservationData.tabs[$scope.viewState.currentTab].numAdults), _defineProperty(_$state$go, "children", $scope.$parent.reservationData.tabs[$scope.viewState.currentTab].numChildren), _defineProperty(_$state$go, "isGroupDetachmentRequested", isGroupDetachmentRequested), _$state$go));
			};

			/**
    * if we wanted to reload particular staycard details
    * @return {undeifned} [description]
    */
			$scope.reloadTheStaycard = function (shouldReload) {
				if (shouldReload) {
					$state.reload($state.current.name);
				} else {
					$state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
						"id": typeof $stateParams.id === "undefined" ? $scope.reservationData.reservationId : $stateParams.id,
						"confirmationId": $stateParams.confirmationId || $scope.reservationData.confirmNum,
						"isrefresh": false
					});
				}
			};

			/**
    * if current screen is in staycard
    * @return {Boolean} [description]
    */
			$scope.isInStayCardScreen = function () {
				return $scope.viewState.identifier === "STAY_CARD";
			};

			// closure for remove card logics
			(function () {
				var removedCard = null;

				/**
     * Final success callback for card removal API
     * @param {object} API response
     */
				var onRemoveCardSuccessCallBack = function onRemoveCardSuccessCallBack(response) {
					$scope.$emit('hideLoader');
					$scope.cardRemoved(removedCard);
					$scope.$broadcast("CARD_REMOVED", removedCard);

					/* CICO-20270: Redirect to rooms and rates if contracted rate was previously selected
      * else reload staycard after detaching card */
					if (response.contracted_rate_was_present && removedCard !== 'guest') {
						fetchExistingAddonsAndGotoRoomRates({
							disableBackToStaycard: true
						});
					} else {
						that.reloadStaycard();
					}
				};

				var onRemoveCardFailureCallBack = function onRemoveCardFailureCallBack(error) {
					$scope.$emit('hideLoader');
					if (error.hasOwnProperty('httpStatus')) {
						if (error.httpStatus === 470) {
							/* CICO-20270: a 470 failure response indicates that transactions exist
        * in bill routing. we need to show user a warning in this case */
							var data = {
								errorMessages: error.errorMessage
							};

							ngDialog.open({
								template: '/assets/partials/cards/popups/detachCardsAPIErrorPopup.html',
								className: 'ngdialog-theme-default stay-card-alerts',
								scope: $scope,
								closeByDocument: false,
								closeByEscape: false,
								data: JSON.stringify(data)
							});
						} else {
							$scope.errorMessage = error;
						}
					}
				};

				/**
     * Handle individual, remove success
     * @param {object} API response
     */
				var onRemoveEachCardSuccessCallBack = function onRemoveEachCardSuccessCallBack(response) {};

				/**
     * This function calls API for every reservations present in reservationsData.
     * @param {object} Reservation data
     */
				var callRemoveCardsAPIforAllReservations = function callRemoveCardsAPIforAllReservations(reservationData, card, cardId) {
					var promises = [];
					// Loop through the reservation ids and call the cancel API for each of them

					_.each(reservationData.reservationIds, function (reservationId) {
						var params = {
							'reservation': reservationId,
							'cardType': card,
							'cardId': cardId
						};

						promises.push(RVCompanyCardSrv.removeCard(params).then(onRemoveEachCardSuccessCallBack));
					});
					$q.all(promises).then(onRemoveCardSuccessCallBack, onRemoveCardFailureCallBack);
				};

				var callRemoveCardsAPIforReservation = function callRemoveCardsAPIforReservation(card, cardId) {
					var params = {
						'reservation': $scope.reservationData.reservationId,
						'cardType': card,
						'cardId': cardId
					};

					$scope.invokeApi(RVCompanyCardSrv.removeCard, params, onRemoveCardSuccessCallBack, onRemoveCardFailureCallBack);
				};

				$scope.removeCard = function (card, cardId) {
					var cardId = cardId || null,
					    totalCardsAttached = _.filter($scope.reservationDetails, function (card) {
						return !!card.id;
					}).length;

					removedCard = card;
					// Cannot Remove the last card... Tell user not to select another card
					if (totalCardsAttached > 1 && card !== "") {
						var reservationData = $scope.reservationData,
						    hasMultipleReservations = reservationData && reservationData.reservationIds && reservationData.reservationIds.length > 1;

						if (hasMultipleReservations) {
							$scope.$emit('showLoader');
							callRemoveCardsAPIforAllReservations(reservationData, card, cardId);
						} else {
							callRemoveCardsAPIforReservation(card, cardId);
						}
					} else {
						// Bring up alert here
						if ($scope.viewState.pendingRemoval.status || cardId) {
							$scope.viewState.pendingRemoval.status = false;
							$scope.viewState.pendingRemoval.cardType = "";
							// If user has not replaced a new card, keep this one. Else remove this card
							// The below flag tracks the card and has to be reset once a new card has been linked,
							// along with a call to remove the flagged card
							$scope.viewState.lastCardSlot = {
								cardType: card,
								cardId: cardId
							};
							$timeout(function () {
								ngDialog.open({
									template: '/assets/partials/cards/alerts/cardRemoval.html',
									className: 'ngdialog-theme-default stay-card-alerts',
									scope: $scope,
									closeByDocument: false,
									closeByEscape: false
								});
							}, 300);
						}
					}
				};
			})();

			$scope.noRoutingToReservation = function () {
				ngDialog.close();
				if (that.useCardRate) {
					$scope.navigateToRoomAndRates();
				} else {
					that.reloadStaycard();
				}
			};

			$scope.applyRoutingToReservation = function () {
				var routingApplySuccess = function routingApplySuccess(data) {
					$scope.$emit("hideLoader");
					ngDialog.close();
					if (that.useCardRate) {
						$scope.navigateToRoomAndRates();
					} else {
						that.reloadStaycard();
					}
					$scope.$broadcast('paymentTypeUpdated'); // to update bill screen data
				};
				var routingApplyFailed = function routingApplyFailed(errorMessage) {
					$scope.errorMessage = errorMessage;
					$scope.$emit("hideLoader");
				};

				var params = {};

				params.account_id = $scope.contractRoutingType === 'TRAVEL_AGENT' ? $scope.reservationData.travelAgent.id : $scope.reservationData.company.id;
				params.reservation_ids = [];
				params.reservation_ids.push($scope.reservationData.reservationId);

				$scope.invokeApi(RVReservationSummarySrv.applyDefaultRoutingToReservation, params, routingApplySuccess, routingApplyFailed);
			};

			$scope.okClickedForConflictingRoutes = function () {
				ngDialog.close();
				if (that.useCardRate) {
					$scope.navigateToRoomAndRates();
				} else {
					that.reloadStaycard();
				}
			};

			this.showConfirmRoutingPopup = function (type, id) {
				ngDialog.open({
					template: '/assets/partials/reservation/alerts/rvBillingInfoConfirmPopup.html',
					className: 'ngdialog-theme-default',
					scope: $scope
				});
			};

			this.showConflictingRoutingPopup = function (type, id) {

				ngDialog.open({
					template: '/assets/partials/reservation/alerts/rvBillingInfoConflictingPopup.html',
					className: 'ngdialog-theme-default',
					scope: $scope
				});
			};

			this.attachCompanyTACardRoutings = function (card, cardData) {
				// CICO-20161
				/**
     * In this case there does not need to be any prompt for Rate or Billing Information to copy,
     * since all primary reservation information should come from the group itself.
     */
				if (!!$scope.reservationData.group.id) {
					return false;
				}

				var fetchSuccessofDefaultRouting = function fetchSuccessofDefaultRouting(data) {
					$scope.$emit("hideLoader");
					$scope.routingInfo = data;
					if (data.has_conflicting_routes) {
						$scope.conflict_cards = [];
						if (card === 'travel_agent' && data.travel_agent.routings_count > 0) {
							$scope.conflict_cards.push($scope.reservationData.travelAgent.name);
						}
						if (card === 'company' && data.company.routings_count > 0) {
							$scope.conflict_cards.push($scope.reservationData.company.name);
						}
						that.showConflictingRoutingPopup();
						return false;
					}

					if (card === 'travel_agent' && data.travel_agent.routings_count > 0) {
						$scope.contractRoutingType = "TRAVEL_AGENT";
						that.showConfirmRoutingPopup($scope.contractRoutingType, $scope.reservationData.travelAgent.id);
						return false;
					}
					if (card === 'company' && data.company.routings_count > 0) {
						$scope.contractRoutingType = "COMPANY";
						that.showConfirmRoutingPopup($scope.contractRoutingType, $scope.reservationData.company.id);
						return false;
					}
					if ((card === 'company' && data.company.routings_count === 0 || card === 'travel_agent' && data.travel_agent.routings_count === 0 || !data.has_conflicting_routes) && that.useCardRate) {
						$scope.navigateToRoomAndRates();
						return false;
					}

					that.reloadStaycard();
				};

				var params = {};

				params.reservation_id = $scope.reservationData.reservationId;

				if (card === 'travel_agent') {
					params.travel_agent_id = $scope.reservationDetails.travelAgent.id;
				} else if (card === 'company') {
					params.company_id = $scope.reservationDetails.companyCard.id;
				}

				$scope.invokeApi(RVReservationSummarySrv.fetchDefaultRoutingInfo, params, fetchSuccessofDefaultRouting);
			};

			$scope.newCardData = {};
			$scope.replaceCard = function (card, cardData, future, useCardRate) {
				that.useCardRate = useCardRate;
				if (card === 'company') {
					$scope.reservationData.company.id = cardData.id;
					$scope.reservationData.company.name = cardData.account_name;
				} else if (card === 'travel_agent') {
					$scope.reservationData.travelAgent.id = cardData.id;
					$scope.reservationData.travelAgent.name = cardData.account_name;
				}

				var onReplaceSuccess = function onReplaceSuccess(data) {
					$scope.cardRemoved(card);
					$scope.cardReplaced(card, cardData);

					// CICO-21205
					// Fix for Replace card was called even if lastCardSlot.cardType was an empty string
					if (!!$scope.viewState.lastCardSlot && !!$scope.viewState.lastCardSlot.cardType && card !== $scope.viewState.lastCardSlot.cardType) {
						$scope.removeCard($scope.viewState.lastCardSlot.cardType, $scope.viewState.lastCardSlot.cardId, true);
					}
					if (card === 'travel_agent') {
						$scope.$broadcast('travelagentcardreplaced', data.data);
					}

					if (card === 'company') {
						$scope.$broadcast("COMPANY_ADDED");
					}
					$scope.viewState.lastCardSlot = "";
					$scope.$emit('hideLoader');
					$scope.newCardData = cardData;
					that.attachCompanyTACardRoutings(card, cardData);
					ngDialog.close();
					if ($state.current.name === staycardState) {
						if (card === 'company') {
							$scope.$broadcast('UPDATE_COMPANY_NAME_IN_STAYCARD', { name: cardData.account_name });
						} else if (card === 'travel_agent') {
							$scope.$broadcast('UPDATE_TA_NAME_IN_STAYCARD', { name: cardData.account_name });
						}
					}
				},
				    onReplaceFailure = function onReplaceFailure(error) {

					$scope.cardRemoved();
					// 480 is reserved for cases where trial to use the card fails fails
					if (error.httpStatus === 480) {
						$scope.cardReplaced(card, cardData);
						// CICO-21205
						// Fix for Replace card was called even if lastCardSlot.cardType was an empty string
						if (!!$scope.viewState.lastCardSlot && !!$scope.viewState.lastCardSlot.cardType) {
							$scope.removeCard($scope.viewState.lastCardSlot);
							$scope.viewState.lastCardSlot = "";
						}
						$scope.newCardData = cardData;
						that.attachCompanyTACardRoutings(card, cardData);
						RVReservationStateService.setReservationFlag('RATE_CHANGE_FAILED', true);
						ngDialog.close();
					} else {
						$scope.$broadcast("SHOWERRORMESSAGE", error);
					}
					$scope.$emit('hideLoader');
				},
				    onEachReplaceSuccess = function onEachReplaceSuccess() {
					// TODO: Handle each success call here
				};

				if (future && $scope.reservationData && $scope.reservationData.reservationIds && $scope.reservationData.reservationIds.length > 1) {
					var promises = []; // Use this array to push the promises returned for every call

					$scope.$emit('showLoader');
					// Loop through the reservation ids and call the cancel API for each of them
					_.each($scope.reservationData.reservationIds, function (reservationId) {
						promises.push(RVCompanyCardSrv.replaceCard({
							'reservation': reservationId,
							'cardType': card,
							'id': cardData.id,
							'future': typeof future === 'undefined' ? false : future,
							'useCardRate': useCardRate
						}).then(onEachReplaceSuccess));
					});
					$q.all(promises).then(onReplaceSuccess, onReplaceFailure);
				} else {
					// Replace card with the selected one
					$scope.invokeApi(RVCompanyCardSrv.replaceCard, {
						'reservation': $scope.reservationData.reservationId,
						'cardType': card,
						'id': cardData.id,
						'future': typeof future === 'undefined' ? false : future,
						'useCardRate': useCardRate
					}, onReplaceSuccess, onReplaceFailure);
				}
			};

			/**
    * 	Reload the stay card if any of the attached cards are changed! >>> 7078 / 7370
    * 	the state would be STAY_CARD in the reservation edit mode also.. hence checking for confirmation id in the state params
    * 	The confirmationId will not be in the reservation edit/create stateParams except for the confirmation screen...
    * 	However, in the confirmation screen the identifier would be "CONFIRM"
    */
			this.reloadStaycard = function () {
				/**
     * CICO-20674: when there is more than one contracted rate we
     * should take the user to room and rates screen after applying the routing info
     */
				if ($scope.newCardData.hasOwnProperty('isMultipleContracts') && true == $scope.newCardData.isMultipleContracts && $state.current.name !== roomAndRatesState && !$scope.reservationData.group.id) {
					fetchExistingAddonsAndGotoRoomRates();
				} else if ($scope.viewState.identifier === "STAY_CARD" && typeof $stateParams.confirmationId !== "undefined" && !$scope.viewState.lastCardSlot) {
					if (RVReservationStateService.getReservationFlag('RATE_CHANGE_FAILED')) {
						RVReservationStateService.setReservationFlag('RATE_CHANGE_FAILED', false);
						ngDialog.open({
							template: '/assets/partials/cards/alerts/contractedRateChangeFailure.html',
							scope: $scope,
							closeByDocument: false,
							closeByEscape: false
						});
					} else {
						$state.go('rover.reservation.staycard.reservationcard.reservationdetails', {
							"id": typeof $stateParams.id === "undefined" ? $scope.reservationData.reservationId : $stateParams.id,
							"confirmationId": $stateParams.confirmationId
						});
					}
				}
			};

			$scope.cardRemoved = function (card) {
				// reset Pending Flag
				$scope.viewState.pendingRemoval.status = false;
				$scope.viewState.pendingRemoval.cardType = "";
				// reset the id and the future reservation counts that were cached
				if (card === 'guest') {
					$scope.reservationDetails.guestCard.id = "";
					$scope.reservationDetails.guestCard.futureReservations = 0;
					var contactInfoData = {
						'contactInfo': {},
						'countries': $scope.countries,
						'userId': "",
						'avatar': "",
						'guestId': "",
						'vip': "" // TODO: check with API or the product team
					};

					$scope.guestCardData.contactInfo = contactInfoData.contactInfo;
					$scope.guestCardData.contactInfo.avatar = contactInfoData.avatar;
					$scope.guestCardData.contactInfo.vip = contactInfoData.vip;
					$scope.countriesList = contactInfoData.countries;
					$scope.guestCardData.userId = contactInfoData.userId;
					$scope.guestCardData.guestId = contactInfoData.guestId;
					$scope.guestCardData.contactInfo.birthday = null;
				}
				if (card === 'company') {
					$scope.reservationData.company.id = "";
					$scope.reservationDetails.companyCard.id = "";
					$scope.reservationDetails.companyCard.futureReservations = 0;
				} else if (card === 'travel_agent') {
					$scope.reservationData.travelAgent.id = "";
					$scope.reservationDetails.travelAgent.id = "";
					$scope.reservationDetails.travelAgent.futureReservations = 0;
					$scope.$broadcast('travelagentcardremoved');
				}
			};

			$scope.cardReplaced = function (card, cardData) {
				if (card === 'company') {
					$scope.reservationDetails.companyCard.id = cardData.id;
					$scope.reservationData.company.id = cardData.id;
					$scope.initCompanyCard();
					// clean search data
					$scope.searchData.companyCard.companyName = "";
					$scope.searchData.companyCard.companyCity = "";
					$scope.searchData.companyCard.companyCorpId = "";
					$scope.showContractedRates({
						companyCard: cardData.id,
						travelAgent: $scope.reservationDetails.travelAgent.id
					});
					$scope.$broadcast('companySearchStopped');
				} else if (card === 'travel_agent') {
					$scope.reservationDetails.travelAgent.id = cardData.id;
					$scope.reservationData.travelAgent.id = cardData.id;
					$scope.initTravelAgentCard();
					// clean search data
					$scope.searchData.travelAgentCard.travelAgentName = "";
					$scope.searchData.travelAgentCard.travelAgentCity = "";
					$scope.searchData.travelAgentCard.travelAgentIATA = "";
					$scope.showContractedRates({
						companyCard: $scope.reservationData.company.id,
						travelAgent: cardData.id
					});
					$scope.$broadcast('travelAgentSearchStopped');
				} else if (card === 'guest') {
					$scope.reservationDetails.guestCard.id = cardData.id;
					$scope.searchData.guestCard.guestFirstName = "";
					$scope.searchData.guestCard.guestLastName = "";
					$scope.searchData.guestCard.guestCity = "";
					$scope.searchData.guestCard.guestLoyaltyNumber = "";
					$scope.searchData.guestCard.email = "";
					$scope.initGuestCard(cardData);
					$scope.callAPI(RVGuestCardsSrv.fetchGuestDetailsInformation, {
						successCallBack: function successCallBack(data) {
							if ($scope.reservationData.guest && $scope.reservationData.guest.id) {
								$scope.reservationData.guest.id = cardData.id;
							}
							fetchGuestCardDataSuccessCallback(data);
						},
						failureCallBack: function failureCallBack(errorMessage) {
							$scope.errorMessage = errorMessage;
							$scope.$emit('hideLoader');
						},
						params: cardData.id
					});

					$scope.$broadcast('guestSearchStopped');
				}
			};

			$scope.showGuestPaymentList = function (guestInfo) {
				var userId = guestInfo.user_id,
				    guestId = guestInfo.guest_id;
				var paymentSuccess = function paymentSuccess(paymentData) {
					$scope.$emit('hideLoader');

					var paymentData = {
						"data": paymentData,
						"user_id": userId,
						"guest_id": guestId
					};

					$scope.$emit('GUESTPAYMENTDATA', paymentData);
					$scope.$emit('SHOWGUESTLIKES');
				};

				$scope.invokeApi(RVGuestCardSrv.fetchGuestPaymentData, userId, paymentSuccess, '', 'NONE');
			};

			$scope.showContractedRates = function (cardIds) {
				// 	CICO-7792 BEGIN
				/*
     *	When a Travel Agent or Company card has been attached to the reservation during the reservation process,
     *	the rate / room display should include the rate of the Company / Travel Agent contract if one exists.
     *	Have to make a call to the availability API with the card added as a request param
     */
				$scope.$broadcast('cardChanged', cardIds);
				// 	CICO-7792 END
			};

			var ratesFetched = function ratesFetched(data, saveReservation) {
				var save = function save() {
					if ($scope.reservationData.guest.id || $scope.reservationData.company.id || $scope.reservationData.travelAgent.id) {
						$scope.saveReservation();
					} else {
						$scope.$emit('PROMPTCARD');
					}
				};

				$scope.otherData.taxesMeta = data.tax_codes;
				$scope.otherData.hourlyTaxInfo = data.tax_information;
				RVReservationStateService.metaData.taxDetails = angular.copy(data.tax_codes);
				$scope.reservationData.totalTax = 0;

				if (saveReservation) {
					if (!$scope.reservationData.guest.id && !$scope.reservationData.company.id && !$scope.reservationData.travelAgent.id) {
						$scope.$emit('PROMPTCARD');
						$scope.$watch("reservationData.guest.id", save);
						$scope.$watch("reservationData.company.id", save);
						$scope.$watch("reservationData.travelAgent.id", save);
					} else {
						$scope.saveReservation();
					}
				}

				$timeout(function () {
					$scope.$emit('hideLoader');
				}, 500);
			};

			$scope.populateDatafromDiary = function (roomsArray, tData, saveReservation) {
				var roomTypes = [];

				this.rooms = [];

				angular.forEach(tData.rooms, function (value) {
					value['roomTypeId'] = parseInt(roomsArray[value.room_id].room_type_id, 10);
					value['roomTypeName'] = roomsArray[value.room_id].room_type_name;
					value['roomNumber'] = roomsArray[value.room_id].room_no;
					roomTypes.push(parseInt(value.roomTypeId, 10));
				});
				roomTypes = _.uniq(roomTypes);
				$scope.reservationData.tabs = RVReservationDataService.getTabDataModel(roomTypes.length, roomTypes);
				$scope.reservationData.rooms = [];
				_.each($scope.reservationData.tabs, function (tab) {
					var roomsOfType = _.filter(tData.rooms, function (room) {
						return parseInt(room.roomTypeId, 10) === parseInt(tab.roomTypeId, 10);
					});

					tab.roomCount = roomsOfType.length;
					$scope.reservationData.rooms = $scope.reservationData.rooms.concat(roomsOfType);
				});

				$scope.reservationData.arrivalDate = dateFilter(new tzIndependentDate(tData.arrival_date), 'yyyy-MM-dd');
				$scope.reservationData.departureDate = dateFilter(new tzIndependentDate(tData.departure_date), 'yyyy-MM-dd');
				var arrivalTimeSplit = tData.arrival_time.split(":");

				$scope.reservationData.checkinTime.hh = arrivalTimeSplit[0];
				$scope.reservationData.checkinTime.mm = arrivalTimeSplit[1].split(" ")[0];
				if ($scope.reservationData.checkinTime.mm.length === 1) {
					$scope.reservationData.checkinTime.mm = "0" + $scope.reservationData.checkinTime.mm;
				}
				$scope.reservationData.checkinTime.ampm = arrivalTimeSplit[1].split(" ")[1];
				if (!($scope.reservationData.checkinTime.ampm === "AM" || $scope.reservationData.checkinTime.ampm === "PM")) {
					if (parseInt($scope.reservationData.checkinTime.hh) >= 12) {
						$scope.reservationData.checkinTime.hh = Math.abs(parseInt($scope.reservationData.checkinTime.hh) - 12) + "";
						$scope.reservationData.checkinTime.ampm = "PM";
					} else {
						$scope.reservationData.checkinTime.ampm = "AM";
					}
				}
				if (Math.abs(parseInt($scope.reservationData.checkinTime.hh) - 12) === 0 || $scope.reservationData.checkinTime.hh === "00" || $scope.reservationData.checkinTime.hh === "0") {
					$scope.reservationData.checkinTime.hh = "12";
				}
				if ($scope.reservationData.checkinTime.hh.length === 1) {
					$scope.reservationData.checkinTime.hh = "0" + $scope.reservationData.checkinTime.hh;
				}

				var departureTimeSplit = tData.departure_time.split(":");

				$scope.reservationData.checkoutTime.hh = departureTimeSplit[0];
				$scope.reservationData.checkoutTime.mm = departureTimeSplit[1].split(" ")[0];

				if ($scope.reservationData.checkoutTime.mm.length === 1) {
					$scope.reservationData.checkoutTime.mm = "0" + $scope.reservationData.checkoutTime.mm;
				}
				$scope.reservationData.checkoutTime.ampm = departureTimeSplit[1].split(" ")[1];

				if (!($scope.reservationData.checkoutTime.ampm === "AM" || $scope.reservationData.checkoutTime.ampm === "PM")) {
					if (parseInt($scope.reservationData.checkoutTime.hh) >= 12) {
						$scope.reservationData.checkoutTime.hh = Math.abs(parseInt($scope.reservationData.checkoutTime.hh) - 12) + "";
						$scope.reservationData.checkoutTime.ampm = "PM";
					} else {
						$scope.reservationData.checkoutTime.ampm = "AM";
					}
				}
				if (Math.abs(parseInt($scope.reservationData.checkoutTime.hh) - 12) === "0" || $scope.reservationData.checkoutTime.hh === "00" || $scope.reservationData.checkoutTime.hh === "0") {
					$scope.reservationData.checkoutTime.hh = "12";
				}
				if ($scope.reservationData.checkoutTime.hh.length === 1) {
					$scope.reservationData.checkoutTime.hh = "0" + $scope.reservationData.checkoutTime.hh;
				}
				var hResData = tData.rooms[0];

				this.reservationId = hResData.reservation_id;
				this.confirmNum = hResData.confirmation_id;

				if (this.reservationId) {
					$scope.viewState.identifier = "CONFIRM";
				} else {
					$scope.viewState.identifier = "CREATION";
					$scope.viewState.reservationStatus.confirm = false;
				}

				$scope.reservationDetails.guestCard = {};
				$scope.reservationDetails.guestCard.id = hResData.guest_card_id;
				$scope.reservationDetails.travelAgent = {};
				$scope.reservationDetails.travelAgent.id = hResData.travel_agent_id;
				$scope.reservationDetails.companyCard = {};
				$scope.reservationDetails.companyCard.id = hResData.company_card_id;

				$scope.reservationData.guest = {};
				$scope.reservationData.guest.id = hResData.guest_card_id;
				$scope.reservationData.travelAgent = {};
				$scope.reservationData.travelAgent.id = hResData.travel_agent_id;
				$scope.reservationData.company = {};
				$scope.reservationData.company.id = hResData.company_card_id;

				if (!!$scope.reservationData.guest.id) {
					$scope.initGuestCard({
						id: $scope.reservationData.guest.id
					});
				}
				if (!!$scope.reservationData.company.id) {
					$scope.initCompanyCard();
				}
				if (!!$scope.reservationData.travelAgent.id) {
					$scope.initTravelAgentCard();
				}

				this.totalStayCost = 0;
				var rateIdSet = [];
				var self = this;

				angular.forEach($scope.reservationData.rooms, function (room) {
					var refData = _.findWhere(tData.rooms, {
						roomNumber: room.roomNumber
					});

					room.stayDates = {};
					rateIdSet.push(refData.rateId);
					room.numAdults = refData.numAdults;
					room.numChildren = refData.numChildren;
					room.numInfants = refData.numInfants;
					room.roomTypeId = refData.roomTypeId;
					room.amount = refData.amount;
					room.room_id = refData.room_id;
					room.room_no = refData.room_no;
					room.room_type = refData.room_type;

					// tData will have addons IFF the hourly reservation is being edited; while creation tData.addons will be undefined
					if (tData.addons) {
						room.addons = [];
						angular.forEach(tData.addons, function (item) {
							room.addons.push({
								quantity: item.addon_count,
								id: item.id,
								price: parseFloat(item.amount),
								amountType: item.amount_type,
								postType: item.post_type,
								title: item.name,
								totalAmount: item.addon_count * parseFloat(item.amount),
								is_inclusive: item.is_inclusive,
								taxes: item.taxes,
								is_rate_addon: item.is_rate_addon
							});
						});
					}

					room.rateId = refData.rateId;
					room.roomAmount = refData.amount;
					// CICO-16850
					//  In case of updating a reservation from Diary
					// the reservation's already attached demographics
					// information must be preserved.

					// CICO-16927 - added undefined check for demographics
					room.demographics = {
						market: typeof refData.demographics === "undefined" || !refData.demographics.market_segment_id ? '' : refData.demographics.market_segment_id,
						source: typeof refData.demographics === "undefined" || !refData.demographics.source_id ? '' : refData.demographics.source_id,
						reservationType: typeof refData.demographics === "undefined" || !refData.demographics.reservation_type_id ? '' : refData.demographics.reservation_type_id,
						origin: typeof refData.demographics === "undefined" || !refData.demographics.booking_origin_id ? '' : refData.demographics.booking_origin_id,
						segment: typeof refData.segment === "undefined" || !refData.demographics.segment_id ? '' : refData.demographics.segment_id
					};

					// put the same stuff in the reservationData obj as well
					//
					self.demographics = angular.copy(room.demographics);

					self.totalStayCost = parseFloat(self.totalStayCost) + parseFloat(refData.amount);
					var success = function success(data) {
						room.rateName = data.name;
						// CICO-16850
						// Default to market and source of Rate IFF there is nothing associated with the reservation yet
						// This checkt will Save reservations state while editing
						if (!$scope.reservationData.demographics.market) {
							$scope.reservationData.demographics.market = !data.market_segment_id ? '' : data.market_segment_id;
						}
						if (!$scope.reservationData.demographics.source) {
							$scope.reservationData.demographics.source = !data.source_id ? '' : data.source_id;
						}
						if (!$scope.reservationData.demographics.origin) {
							$scope.reservationData.demographics.origin = !data.booking_origin_id ? '' : data.booking_origin_id;
						}

						angular.forEach($scope.reservationData.rooms, function (room, index) {
							if (!room.demographics.market) {
								room.demographics.market = !data.market_segment_id ? '' : data.market_segment_id;
							}
							if (!room.demographics.source) {
								room.demographics.source = !data.source_id ? '' : data.source_id;
							}
							if (!room.demographics.origin) {
								room.demographics.origin = !data.booking_origin_id ? '' : data.booking_origin_id;
							}
						});

						if (data.deposit_policy && data.deposit_policy.id || data.deposit_policy_id) {
							$scope.reservationData.depositData = {};
							$scope.reservationData.depositData.isDepositRequired = true;
							$scope.reservationData.depositData.description = data.deposit_policy.description;
							$scope.reservationData.depositData.depositSuccess = !$scope.reservationData.depositData.isDepositRequired;
							$scope.reservationData.depositData.attempted = false;
							$scope.reservationData.depositData.depositAttemptFailure = false;
							$scope.$broadcast("UPDATEDEPOSIT");
						}
					};
					var roomAmount = parseFloat(room.roomAmount).toFixed(2);

					$scope.invokeApi(RVReservationSummarySrv.getRateDetails, {
						id: room.rateId
					}, success);
					for (var ms = new tzIndependentDate($scope.reservationData.arrivalDate) * 1, last = new tzIndependentDate($scope.reservationData.departureDate) * 1; ms <= last; ms += 24 * 3600 * 1000) {
						room.stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')] = {
							guests: {
								adults: room.numAdults,
								children: room.numChildren,
								infants: room.numInfants
							},
							rate: {
								id: room.rateId
							},
							rateDetails: {
								actual_amount: roomAmount,
								modified_amount: roomAmount,
								is_discount_allowed: 'true'
							}
						};
						if (!!room.contract_id) {
							room.stayDates[dateFilter(new tzIndependentDate(ms), 'yyyy-MM-dd')].contractId = room.contract_id;
							delete room.contract_id;
						}
					}
				});

				$scope.invokeApi(RVReservationSummarySrv.getTaxDetails, {
					rate_ids: rateIdSet
				}, ratesFetched);
			}.bind($scope.reservationData);

			// CICO-11991 : Handle ARRIVALS button click.
			$scope.loadPrevState = function () {
				$rootScope.loadPrevState();
				$rootScope.$broadcast("OUTSIDECLICKED");
			};

			$scope.staycardClicked = function () {
				// save contact info
				$scope.$broadcast('saveContactInfo');
			};
		}]);
	}, {}] }, {}, [1]);