sntRover.controller('rvAllotmentConfigurationSummaryTabCtrl', [
	'$scope',
	'jsMappings',
	'$rootScope',
	'rvAllotmentSrv',
	'$filter',
	'$stateParams',
	'rvAllotmentConfigurationSrv',
	'dateFilter',
	'RVReservationSummarySrv',
	'ngDialog',
	'RVReservationAddonsSrv',
	'RVReservationCardSrv',
	'rvUtilSrv',
	'$state',
	'rvPermissionSrv',
	'$q',
	function($scope, jsMappings, $rootScope, rvAllotmentSrv, $filter, $stateParams, rvAllotmentConfigurationSrv, dateFilter, RVReservationSummarySrv, ngDialog, RVReservationAddonsSrv, RVReservationCardSrv, util, $state, rvPermissionSrv, $q) {


		var summaryMemento, demographicsMemento;

		/**
		 * Whether our summary data has changed
		 * used to remove the unneccessary API calls
		 * @return {Boolean} [description]
		 */
		var whetherSummaryDataChanged = function() {
			var currentSummaryData = $scope.allotmentConfigData.summary;

			for (var key in summaryMemento) {
				// if any of the values are not equal/same, there is change, return true
				if (!_.isEqual(currentSummaryData[key], summaryMemento[key])) {
					return true;
				}
			}
			return false;
		};

		/**
		 * to run angular digest loop,
		 * will check if it is not running
		 * return - None
		 */
		var runDigestCycle = function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};
		/**
		 * we have to save when the user clicked outside of summary tab
		 * @param  {Object} event - Angular Event
		 * @param  {Object} data  - the clicked element
		 * @return undefined
		 */

		$scope.$on("OUTSIDECLICKED", function(event, targetElement) {
			var isInaddMode 			= $scope.isInAddMode(),
				incorrectTarget 		= (targetElement &&
											(targetElement.id === 'summary' ||
											 targetElement.id === "cancel-action"
											)
										  ),
				demographicsOpen 		= $scope.allotmentSummaryData.isDemographicsPopupOpen,
				updateInProgress 		= $scope.isUpdateInProgress;

			if (isInaddMode || incorrectTarget ||
				!!$scope.focusedCompanyCard || !!$scope.focusedTravelAgent ||
				!whetherSummaryDataChanged() || demographicsOpen ||
				updateInProgress ) {
				// No need to call update summary
				return;
			}

			// yes, summary data update is in progress
			$scope.isUpdateInProgress = true;

			// call the updateAllotmentSummary method from the parent controller
			$scope.updateAllotmentSummary();
		});

		/**
		 * if there is any update triggered from some where else, we will get this
		 * event with latest data
		 * @param  {Object} event - Angular Event
		 * @param  {Object} data  - new Summary data
		 * @return undefined
		 */
		$scope.$on('UPDATED_ALLOTMENT_INFO', function(event, data) {
			// data has changed
			summaryMemento = angular.copy($scope.allotmentConfigData.summary);
			$scope.isUpdateInProgress = false;
		});

		var navigateToAddonsListner = $rootScope.$on('NAVIGATE_TO_ADDONS', function(event, data) {
			if (data.addonPostingMode === 'allotments') {
				$scope.manageAddons();
			}
		});

		var proceedAddonBookingListner = $scope.$on('PROCEED_BOOKING', function(event, data) {
            if (data.addonPostingMode === 'allotments') {
            	$scope.selectedPurchesedAddon = data.selectedPurchesedAddon;
                updateAddonPosting();
            }
        });

        var removeSelectedAddonsListner = $rootScope.$on('REMOVE_ADDON', function(event, data) {
            if (data.addonPostingMode === 'allotments') {
                $scope.removeAddon($scope.packageData.existing_packages[data.index]);
            }
        });

        $scope.$on( '$destroy', proceedAddonBookingListner);
        $scope.$on( '$destroy', removeSelectedAddonsListner);
        $scope.$on( '$destroy', navigateToAddonsListner);

        var updateAddonPosting = function() {

        	var params = {
				"id": $scope.allotmentConfigData.summary.allotment_id,
				'addon_id': $scope.selectedPurchesedAddon.id,
				'post_instances': $scope.selectedPurchesedAddon.post_instances,
				'start_date': $scope.selectedPurchesedAddon.start_date,
				'end_date': $scope.selectedPurchesedAddon.end_date,
				'selected_post_days': $scope.selectedPurchesedAddon.selected_post_days
			};
        	var options = {
				successCallBack: function() {
					$scope.$emit('hideLoader');
				},
				params: params
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.updateAddonPosting, options);
        };

		/**
		 * when from date choosed, this function will fire
		 * @param  {Object} date
		 * @param  {Object} datePickerObj
		 * @return undefined
		 */
		var fromDateChoosed = function(date, datePickerObj) {
			$scope.allotmentConfigData.summary.block_from = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

			// referring data source
			var refData = $scope.allotmentConfigData.summary;

			// we will clear end date if chosen start date is greater than end date
			if (refData.block_from > refData.block_to) {
				$scope.allotmentConfigData.summary.block_to = '';
			}
			// setting the min date for end Date
			$scope.toDateOptions.minDate = refData.block_from;

			$scope.computeSegment();

			if (!!$scope.allotmentConfigData.summary.block_from && !!$scope.allotmentConfigData.summary.block_to) {
				fetchApplicableRates();
			}

			// we are in outside of angular world
			runDigestCycle();
		};

		var onFetchSegmentDataSuccess = function(demographicsData) {
				$scope.allotmentSummaryData.demographics = demographicsData.demographics;
				updateSegment();
		};

		var onFetchSegmentDataFailure = function(errorMessage) {

		};

		var updateSegment = function() {
			var configSummaryData 	= $scope.allotmentConfigData.summary,
				demographics 	= $scope.allotmentSummaryData.demographics,
				blockFromDate	= configSummaryData.block_from,
				blockToDate		= configSummaryData.block_to,
				aptSegment		= ""; // Variable to store the suitable segment ID;

				// CICO-42249 - Flag to allow adding demographics for a newly created group
                $scope.forceDemographics = $scope.shouldShowDemographics();


			// CICO-15107 --
			if (!!blockToDate && !!blockFromDate) {
				var dayDiff = Math.floor((new tzIndependentDate(blockToDate) - new tzIndependentDate(blockFromDate)) / 86400000);

				_.each(demographics.segments, function(segment) {
					if (dayDiff < segment.los) {
						if (!aptSegment) {
							aptSegment = segment.value;
						}
					}
				});
				$scope.allotmentSummaryData.computedSegment = !!aptSegment;
				configSummaryData.demographics.segment_id = aptSegment;
			} else {
				return false;
			}
		};
		/**
		 * [computeSegment description]
		 * @return {[type]} [description]
		 */

		$scope.computeSegment = function() {
			if ($scope.allotmentSummaryData.demographics === null) {
				var options = {
					successCallBack: onFetchSegmentDataSuccess,
					failureCallBack: onFetchSegmentDataFailure
				};

				$scope.callAPI(RVReservationSummarySrv.fetchInitialData, options);
			} else {
				updateSegment();
			}
		};

		/**
		 * when to date choosed, this function will fire
		 * @param  {Object} date
		 * @param  {Object} datePickerObj
		 * @return undefined
		 */
		var toDateChoosed = function(date, datePickerObj) {
			var summaryData = $scope.allotmentConfigData.summary;

			summaryData.block_to = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

			$scope.computeSegment();
			// we are in outside of angular world

			if (!!summaryData.block_from && !!summaryData.block_to) {
				fetchApplicableRates();
			}
			runDigestCycle();
		};

		/**
		 * when release date choosed, this function will fire
		 * @param  {Object} date
		 * @param  {Object} datePickerObj
		 * @return undefined
		 */
		var releaseDateChoosed = function(date, datePickerObj) {
			$scope.allotmentConfigData.summary.release_date = new tzIndependentDate(util.get_date_from_date_picker(datePickerObj));

			// we are in outside of angular world
			runDigestCycle();
		};

		/**
		 * to set date picker option for summary view
		 * @return {undefined} [description]
		 */
		var setDatePickerOptions = function() {
			// date picker options - Common
			var commonDateOptions = {
				dateFormat: $rootScope.jqDateFormat,
				numberOfMonths: 1,
				disabled: $scope.allotmentConfigData.summary.is_cancelled,
				minDate: tzIndependentDate($rootScope.businessDate),
				beforeShow: function(input, inst) {
					$('<div id="ui-datepicker-overlay" class="transparent" />').insertAfter('#ui-datepicker-div');
				},
				onClose: function(dateText, inst) {
					$('#ui-datepicker-overlay').remove();
				}
			};

			// from Date options
			$scope.fromDateOptions = _.extend({
				onSelect: fromDateChoosed
			}, commonDateOptions);

			// to date options
			$scope.toDateOptions = _.extend({
				onSelect: toDateChoosed
			}, commonDateOptions);

			// release date options
			$scope.releaseDateOptions = _.extend({
				onSelect: releaseDateChoosed
			}, commonDateOptions);
		};

		var showMarkets = function (demographicsData) {
                return demographicsData.is_use_markets && demographicsData.markets.length > 0;
            },
            showSources = function (demographicsData) {
                return demographicsData.is_use_sources && demographicsData.sources.length > 0;
            },
            showOrigins = function (demographicsData) {
                return demographicsData.is_use_origins && demographicsData.origins.length > 0;
            },
            showSegments = function (demographicsData) {
                return demographicsData.is_use_segments && demographicsData.segments.length > 0;
            };

		/**
         * Validates demographics data for mandatory fields for disabling the 
         * Save & Continue btn in demographics popup
         */
        var validateDemographicsData = function(demographicsData) {
            var isValid = true; 
            
            if (showMarkets(demographicsData) && $scope.hotelSettings.force_market_code) {
                isValid = !!$scope.allotmentConfigData.summary.demographics.market_segment_id;
            }
            if (showSources(demographicsData) && $scope.hotelSettings.force_source_code && isValid) {
                isValid = !!$scope.allotmentConfigData.summary.demographics.source_id;
            }
            if (showOrigins(demographicsData) && $scope.hotelSettings.force_origin_of_booking && isValid) {
                isValid = !!$scope.allotmentConfigData.summary.demographics.booking_origin_id;
            }
            if (showSegments(demographicsData) && $scope.hotelSettings.force_segments && isValid) {
                isValid = !!$scope.allotmentConfigData.summary.demographics.segment_id;
            }
            return isValid;
        };

		/**
		 * Checks whether all mandatory demographics fields are entered or not		 
		 */
		$scope.isDemographicsFormValid = function(assertValidation) {
			var isDemographicsValid = true;

            if (assertValidation) {
                isDemographicsValid =  validateDemographicsData($scope.allotmentSummaryData.demographics);
            }

            return isDemographicsValid;
		};

		/**
		 * Opens the dialog box
		 * @return {undefined}
		 */
		var showDemographicsPopup = function() {
			$scope.allotmentSummaryData.isDemographicsPopupOpen = true;
			demographicsMemento = angular.copy($scope.allotmentConfigData.summary.demographics);
			ngDialog.open({
				template: '/assets/partials/allotments/summary/allotmentDemographicsPopup.html',
				className: '',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false,
				preCloseCallback: function() {
					$scope.allotmentSummaryData.isDemographicsPopupOpen = false;
				}
			});
		};		

		/**
		 * Demographics Popup Handler
		 * @return undefined
		 */
		$scope.openDemographicsPopup = function(showRequiredFields, isBtnClick) {
			if ( $scope.isInAddMode() && ( !$scope.forceDemographics || isBtnClick )) {
				// If the group has not been saved yet, prompt user for the same
				$scope.errorMessage = ["Please save the allotment first"];
				return;
			}
			$scope.errorMessage = "";

			var onFetchDemographicsSuccess = function(demographicsData) {
					$scope.allotmentSummaryData.demographics = demographicsData.demographics;
					$scope.setDemographicFields(showRequiredFields);
					showDemographicsPopup();
				},
				onFetchDemographicsFailure = function(errorMessage) {

				};

			var options = {
				successCallBack: onFetchDemographicsSuccess,
				failureCallBack: onFetchDemographicsFailure
			};

			if ($scope.allotmentSummaryData.demographics === null) {
				$scope.callAPI(RVReservationSummarySrv.fetchInitialData, options);
			} else {
				$scope.setDemographicFields(showRequiredFields);
				showDemographicsPopup();
			}

		};

		$scope.cancelCopyDefaultBilling = function() {
			openBillingInformationPopup();
		};

		var successCallBackOfCopyDefaultBilling = function() {
			$scope.$emit('hideLoader');
			$scope.allotmentConfigData.summary.default_billing_info_present = true;
			openBillingInformationPopup();
		};

		var failureCallBackOfCopyDefaultBilling = function(error) {
			$scope.errorMessage = error;
		};

		$scope.copyDefaultBillingFromCards = function(card) {
			var params = {
				"allotment_id": $scope.allotmentConfigData.summary.allotment_id,
				"is_company_card": (card == 'COMPANY') ? true : false,
				"is_travel_agent": (card == 'TRAVEL_AGENT') ? true : false
			};
			var options = {
				successCallBack: successCallBackOfCopyDefaultBilling,
				failureCallBack: failureCallBackOfCopyDefaultBilling,
				params: params
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.copyDefaultBillingInfo, options);
		};

		var showConfirmRoutingPopup = function(type, id) {
			ngDialog.open({
				template: '/assets/partials/allotments/summary/rvBillingInfoConfirmPopup.html',
				className: 'ngdialog-theme-default',
				scope: $scope
			});
		};

		var showConflictRoutingPopup = function() {
			ngDialog.open({
				template: '/assets/partials/allotments/summary/rvBillingInfoConflict.html',
				className: 'ngdialog-theme-default',
				scope: $scope
			});
		};

		var openBillingInformationPopup = function() {
			var summaryData = $scope.allotmentConfigData.summary;

			$scope.billingEntity = "ALLOTMENT_DEFAULT_BILLING";
			$scope.billingInfoModalOpened = true;
			$scope.attachedEntities = {};
			$scope.billingInformationPresent = summaryData.default_billing_info_present;
			$scope.attachedEntities.posting_account = _.extend({}, {
				id: summaryData.allotment_id,
				name: summaryData.posting_account_name,
				logo: "ALLOTMENT_DEFAULT"
			});
            $scope.$emit('showLoader'); 
            jsMappings.fetchAssets(['addBillingInfo', 'directives'])
            .then(function() {
                $scope.$emit('hideLoader');
                if ($rootScope.UPDATED_BI_ENABLED_ON['ALLOTMENT']) {
                	console.log("##Billing-info updated version");
	                ngDialog.open({
	                    template: '/assets/partials/billingInformation/allotment/rvBillingInfoAllotmentMain.html',
	                    controller: 'rvBillingInfoAllotmentMainCtrl',
	                    className: '',
	                    scope: $scope
	                });
	            }
	            else {
	            	console.log("##Billing-info old version");
	            	ngDialog.open({
	                	template: '/assets/partials/bill/rvBillingInformationPopup.html',
	                    controller: 'rvBillingInformationPopupCtrl',
	                    className: '',
	                    scope: $scope
	                });
	            }
            });
		};

		$scope.openBillingInformation = function() {
			if ($scope.isInAddMode()) {
				// If the allotment has not been saved yet, prompt user for the same
				$scope.errorMessage = ["Please save the allotment first"];
				return;
			}

			var summaryData = $scope.allotmentConfigData.summary;
			// check if billing info does not exist and default biling info can be copied from either company or TA.

			if (summaryData.default_billing_info_present) {
				openBillingInformationPopup();
				return;
			}

			var billingInfoExistsForCompany = summaryData.company && summaryData.company.default_billing_info_present,
				billingInfoExistsForTA 		= summaryData.travel_agent && summaryData.travel_agent.default_billing_info_present;

			if ( billingInfoExistsForCompany && billingInfoExistsForTA) {
				$scope.conflctCards = [summaryData.company.name, summaryData.travel_agent.name];
				showConflictRoutingPopup();
			}
			else if ( billingInfoExistsForCompany) {
				$scope.contractRoutingType = 'COMPANY';
				showConfirmRoutingPopup();
			}
			else if (billingInfoExistsForTA) {
				$scope.contractRoutingType = 'TRAVEL_AGENT';
				showConfirmRoutingPopup();
			}
			else {
				openBillingInformationPopup();
			}

		};

		$scope.$on("BILLINGINFOADDED", function() {
			$scope.allotmentConfigData.summary.default_billing_info_present = true;
		});

		$scope.saveDemographicsData = function() {
			if ($scope.isInAddMode()) {
				// If the allotment has not been saved yet, prompt user for the same
				$scope.errorMessage = ["Please save the allotment to save Demographics"];
				return;
			}
			$scope.updateAllotmentSummary();
			$scope.closeDialog();
		};

		var showChangeDateNotPossiblePopup = function() {
			ngDialog.open({
				template: '/assets/partials/allotments/summary/warnChangeRateNotPossible.html',
				className: '',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false
			});
		};

		/**
		 * Success callback function for rate change
		 * @param {object} response of API
		 * @return {undefined}
		 */
		var onRateChangeSuccess = function(data) {
			$scope.$emit('hideLoader');
			$scope.allotmentConfigData.summary.commission_details = data.commission_details;
			
			if (!data.is_changed && !data.is_room_rate_available) {
				showChangeDateNotPossiblePopup();
				$scope.allotmentConfigData.summary.rate = summaryMemento.rate;
				$scope.allotmentConfigData.summary.contract_id = summaryMemento.contract_id;
				$scope.allotmentConfigData.summary.uniqId = summaryMemento.uniqId;
			} else {
			  summaryMemento.rate = $scope.allotmentConfigData.summary.rate;
			  summaryMemento.contract_id = $scope.allotmentConfigData.summary.contract_id;
			  summaryMemento.uniqId = $scope.allotmentConfigData.summary.uniqId;
			}
		};

		/**
		 * Failure callback function for rate change
		 * @param {string} response of API
		 * @return {undefined}
		 */
		var onRateChangeFailure = function(errorMessage) {
			$scope.$emit('hideLoader');
			$scope.errorMessage = errorMessage;
			$scope.allotmentConfigData.summary.rate = summaryMemento.rate;
			$scope.allotmentConfigData.summary.contract_id = summaryMemento.contract_id;
			$scope.allotmentConfigData.summary.uniqId = summaryMemento.uniqId;
		};

		// Update the rate for the group
        $scope.updateRate = function (shouldUpdateExistingReservations) {
            ngDialog.close();

            var summaryData = $scope.allotmentConfigData.summary,
				uniqId = summaryData.uniqId,
				rateId = uniqId && uniqId.split(':')[0],
				contractId = uniqId && uniqId.split(':')[1];
			

			var params = {
				allotment_id: summaryData.allotment_id,
				rate_id: rateId,
				contract_id: contractId
			};

			if (shouldUpdateExistingReservations) {
                params.update_existing_reservations_rate = true;
            }

			var options = {
				successCallBack: onRateChangeSuccess,
				failureCallBack: onRateChangeFailure,
				params: params
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.updateRate, options);
        };
        
        // Alert the user during rate change, when there are in-house reservations
        var showInhouseReservationExistsAlert = function () {
            ngDialog.open({
                template: '/assets/partials/allotments/details/rvAllotmentInhouseReservationsExistsPopup.html',
                scope: $scope,
                className: '',
                closeByDocument: false,
                closeByEscape: false
            });
        };

        // Update rate to new and existing reservations
        $scope.updateRateToNewAndExistingReservations = function () {
            ngDialog.close();
            if ($scope.allotmentConfigData.summary.total_checked_in_reservations > 0) {
                showInhouseReservationExistsAlert();
            } else {
                $scope.updateRate(true);
            }
            
        };

        // Upate rate to new reservations only
        $scope.updateRateToNewReservations = function () {
            ngDialog.close();
            $scope.updateRate(false);
        };

        // Show the popup when the rate is changed
        var showRateChangePopup = function () {
            $scope.isFromSummary = true;

            ngDialog.open({
                template: '/assets/partials/allotments/details/rvAllotmentRoomBlockPickedupReservationsPopup.html',
                scope: $scope,
                className: '',
                closeByDocument: false,
                closeByEscape: false
            });
        };

		/**
		 * [onRateChange description]
		 * @return {undefined}
		 */
		$scope.onRateChange = function() {
			var summaryData = $scope.allotmentConfigData.summary,
				uniqId = summaryData.uniqId,
				rateId = uniqId && uniqId.split(':')[0],
				contractId = uniqId && uniqId.split(':')[1];

			$scope.allotmentConfigData.summary.contract_id = contractId;
			$scope.allotmentConfigData.summary.rate = rateId;

			// If group is not yet created, discard the rate change
			if (!summaryData.allotment_id || !uniqId) {
				return false;
            }
            
            // Show the popup only when room and rates are configured
            if (summaryData.rooms_total > 0) {
                showRateChangePopup();
            } else {
                $scope.updateRate(false); 
            }
			
		};


		$scope.cancelDemographicChanges = function() {
			$scope.allotmentConfigData.summary.demographics = demographicsMemento;
		};

		/**
		 * Warn release the rooms
		 * @return undefined
		 */
		$scope.warnReleaseRooms = function() {
			// Release Rooms NA for cancelled allotment and allotments that arent saved yet
			if (!$scope.allotmentConfigData.summary.is_cancelled && !$scope.isInAddMode()) {
				ngDialog.open({
					template: '/assets/partials/allotments/summary/warnReleaseRoomsPopup.html',
					className: '',
					scope: $scope,
					closeByDocument: false,
					closeByEscape: false
				});
			}
		};

		/**
		 * Handle successful release
		 */
		var onReleaseRoomsSuccess = function(data) {
			$scope.closeDialog();
			$scope.$emit("FETCH_SUMMARY");
		};

		var onReleaseRoomsFailure = function(data) {
			$scope.errorMessage = data;
		};

		/**
		 * Handle release rooms
		 * @return undefined
		 */
		$scope.releaseRooms = function() {
			var params  = {
					allotmentId: $scope.allotmentConfigData.summary.allotment_id
				},
				options = {
					successCallBack: onReleaseRoomsSuccess,
					failureCallBack: onReleaseRoomsFailure,
					params: params
				};

			$scope.callAPI(rvAllotmentConfigurationSrv.releaseRooms, options);
		};

		$scope.abortCancelAllotment = function() {
			// Reset the hold status to the last saved status
			$scope.allotmentConfigData.summary.hold_status = $scope.allotmentSummaryData.existingHoldStatus;
			$scope.closeDialog();
		};

		var onCancelAllotmentSuccess = function() {
			// reload the allotmentSummary
			$scope.closeDialog();
			$state.go('rover.allotments.config', {
				id: $scope.allotmentConfigData.summary.allotment_id
			}, {
				reload: true
			});
		};

		var onCancelAllotmentFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
			$scope.abortCancelAllotment();
		};

		$scope.cancelAllotment = function(cancellationReason) {
			var params  = {
				allotment_id: $scope.allotmentConfigData.summary.allotment_id,
				reason: cancellationReason
			};
			var options = {
				successCallBack: onCancelAllotmentSuccess,
				failureCallBack: onCancelAllotmentFailure,
				params: params
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.cancelAllotment, options);
		};

        // Update group hold status
        var updateHoldStatus = function () {
            $scope.callAPI(rvAllotmentConfigurationSrv.updateHoldStatus, {
                params: {
                    hold_status_id: $scope.allotmentConfigData.summary.hold_status,
                    id: $scope.allotmentConfigData.summary.allotment_id
                },
                onSuccess: function () {
                    $scope.allotmentSummaryMemento.hold_status = $scope.allotmentConfigData.summary.hold_status;
				},
				onFailure: function(errorMsg) {
					$scope.$emit('showErrorMessage', errorMsg);
					$scope.allotmentConfigData.summary.hold_status = $scope.allotmentSummaryMemento.hold_status;
				}
            });
        };

		$scope.onHoldStatusChange = function() {
			if (!$scope.isInAddMode()) {
				var selectedStatus = _.findWhere($scope.allotmentConfigData.holdStatusList, {
					id: parseInt($scope.allotmentConfigData.summary.hold_status)
				});

				if (selectedStatus && selectedStatus.name === 'Cancel' && !!selectedStatus.is_system) {
					ngDialog.open({
						template: '/assets/partials/allotments/summary/warnCancelAllotmentPopup.html',
						className: '',
						scope: $scope,
						closeByDocument: false,
						closeByEscape: false
					});
				} else {
					updateHoldStatus();
					$scope.allotmentSummaryData.existingHoldStatus = parseInt($scope.allotmentConfigData.summary.hold_status);

				}
			}
		};

		/**
		 * Method to check if the cancel option be available in the hold status select options
		 * @return {Boolean}
		 */
		$scope.isCancellable = function() {

			return (rvPermissionSrv.getPermissionValue('CANCEL_GROUP') && !!$scope.allotmentConfigData.summary.is_cancelled || ($scope.allotmentConfigData.summary.total_checked_in_reservations === 0 && parseFloat($scope.allotmentConfigData.summary.balance) === 0.0));
		};

		var onFetchAddonSuccess = function(data) {
			$scope.allotmentConfigData.selectedAddons = data;
			if ($scope.allotmentConfigData.selectedAddons.length > 0) {
				$scope.openAddonsPopup();
			} else {
				$scope.manageAddons();
			}
		};

		var onFetchAddonFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		/**
		 * Method to show addons popup
		 * @return undefined
		 */
		$scope.viewAddons = function() {
			var options = {
				successCallBack: onFetchAddonSuccess,
				failureCallBack: onFetchAddonFailure,
				params: {
					"id": $scope.allotmentConfigData.summary.allotment_id
				}
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.getAllotmentEnhancements, options);
		};

		$scope.getRevenue = function() {
			if ($scope.isInAddMode()) {
				return "";
			}
			return $rootScope.currencySymbol + $filter('number')($scope.allotmentConfigData.summary.revenue_actual, 2) + '/ ' + $rootScope.currencySymbol + $filter('number')($scope.allotmentConfigData.summary.revenue_potential, 2);
		};

		/**
		 * Method used open the addons popup
		 * @return undefined
		 */
		$scope.openAddonsPopup = function() {

            $scope.addonPopUpData = {
				cancelLabel: "Cancel",
                saveLabel: "Save",
                number_of_adults: 1,
                number_of_children: 1,
                duration_of_stay: 1,
                addonPostingMode: 'allotments'
            };

            $scope.packageData = {
                duration_of_stay: $scope.duration_of_stay
            };

            $scope.packageData.existing_packages = $scope.allotmentConfigData.selectedAddons;

            _.each($scope.packageData.existing_packages, function(item) {
                item.totalAmount = item.amount * item.addon_count;
            });

			ngDialog.open({
				template: '/assets/partials/packages/showPackages.html',
				className: '',
				controller: 'RVReservationPackageController',
				scope: $scope,
				closeByDocument: false,
				closeByEscape: false
			});
		};

		var onFetchAddonsListSuccess = function(addonsData) {
			$scope.allotmentConfigData.addons = addonsData;
			$scope.openAllotmentAddonsScreen();
		};

		var onFetchAddonsListFailure = function(errorMessage) {

		};

		/**
		 * manage addons selection/ updates.
		 * Fetch addons list first and show manage screen.
		 * @return undefined
		 */
		$scope.manageAddons = function() {
			if ($scope.isInAddMode()) {
				// If the allotment has not been saved yet, prompt user for the same
				$scope.errorMessage = ["Please save the allotment to manage Add-ons"];
				return;
			}
			$scope.errorMessage = "";

			var params  = {
					from_date: $scope.allotmentConfigData.summary.block_from,
					to_date: $scope.allotmentConfigData.summary.block_to,
					is_active: true,
					is_not_rate_only: true
				},
				options = {
					successCallBack: onFetchAddonsListSuccess,
					failureCallBack: onFetchAddonsListFailure,
					params: params
				};

			$scope.callAPI(RVReservationAddonsSrv.fetchAddonData, options);
		};

		var onRemoveAddonSuccess = function(data) {
			$scope.allotmentConfigData.selectedAddons = data;
			$scope.packageData.existing_packages = $scope.allotmentConfigData.selectedAddons;
			$scope.computeAddonsCount();
		};

		var onRemoveAddonFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		/**
		 * Call to remove a specific addon from enhancements.
		 * @param {object} Addon object
		 */
		$scope.removeAddon = function(addon) {
			var params  = {
					"addon_id": addon.id,
					"id": $scope.allotmentConfigData.summary.allotment_id
				},
				options = {
					successCallBack: onRemoveAddonSuccess,
					failureCallBack: onRemoveAddonFailure,
					params: params
				};

			$scope.callAPI(rvAllotmentConfigurationSrv.removeAllotmentEnhancement, options);
		};

		var onSaveAllotmentNoteSuccess = function(data) {
			$scope.allotmentConfigData.summary.notes = data.notes;
			$scope.allotmentSummaryData.newNote = "";
			$scope.refreshScroller("allotmentSummaryScroller");
		};

		var onSaveAllotmentNoteFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		/**
		 * Method to save a note
		 * @return undefined
		 */
		$scope.saveAllotmentNote = function() {
			if ($scope.isInAddMode()) {
				// If the allotment has not been saved yet, prompt user for the same
				$scope.errorMessage = ["Please save the allotment to Post Note"];
				return;
			}
			$scope.errorMessage = "";

			var params  = {
					"notes": $scope.allotmentSummaryData.newNote,
					"allotment_id": $scope.allotmentConfigData.summary.allotment_id
				},
				options = {
					successCallBack: onSaveAllotmentNoteSuccess,
					failureCallBack: onSaveAllotmentNoteFailure,
					params: params
				};

			if ($scope.allotmentSummaryData.newNote) {
				$scope.callAPI(rvAllotmentConfigurationSrv.saveAllotmentNote, options);
			}
		};

		var onRemoveAllotmentNoteSuccess = function(data, params) {
			var summaryData = $scope.allotmentConfigData.summary;

			summaryData.notes = _.without(summaryData.notes,
									_.findWhere(summaryData.notes, {
										note_id: params.noteId
									})
								);
			$scope.refreshScroller("allotmentSummaryScroller");
		};

		var onRemoveAllotmentNoteFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		/**
		 * deletes a specific note.
		 * @param {int} id of the note.
		 */
		$scope.removeAllotmentNote = function(noteId) {
			var options = {
				successCallBack: onRemoveAllotmentNoteSuccess,
				failureCallBack: onRemoveAllotmentNoteFailure,
				params: {
					"note_id": noteId
				},
				successCallBackParameters: {
					"noteId": noteId
				}
			};

			$scope.callAPI(rvAllotmentConfigurationSrv.removeAllotmentNote, options);
		};

		var getPassData = function() {
			var passData = {
				"is_swiped": false,
				"details": {
					"firstName": "",
					"lastName": ""
				}
			};

			return passData;
		};

		$scope.$on('HANDLE_MODAL_OPENED', function(event) {
			$scope.billingInfoModalOpened = false;
		});

		/*
		 *	MLI SWIPE actions
		 */
		var processSwipedData = function(swipedCardData) {

			var passData = getPassData();
			var swipeOperationObj = new SwipeOperation();
			var swipedCardDataToRender = swipeOperationObj.createSWipedDataToRender(swipedCardData);

			passData.details.swipedDataToRenderInScreen = swipedCardDataToRender;
			$scope.$broadcast('SHOW_SWIPED_DATA_ON_BILLING_SCREEN', swipedCardDataToRender);
		};

		/*
		 * Handle swipe action in billing info
		 */

		$scope.$on('SWIPE_ACTION', function(event, swipedCardData) {
                $scope.swippedCard = true;

			if ($scope.billingInfoModalOpened) {
				var swipeOperationObj = new SwipeOperation(),
				    getTokenFrom = swipeOperationObj.createDataToTokenize(swipedCardData),
				    tokenizeSuccessCallback = function(tokenValue) {
						$scope.$emit('hideLoader');
						swipedCardData.token = tokenValue;
						processSwipedData(swipedCardData);
					};

				$scope.invokeApi(RVReservationCardSrv.tokenize, getTokenFrom, tokenizeSuccessCallback);
			}
		});

		var onFetchRatesSuccess = function(data) {

			var sumData = $scope.allotmentSummaryData;

	        sumData.rateSelectDataObject = [];

	        // add custom rate obect
	        sumData.rateSelectDataObject.push({
	            id: '-1',
				name: 'Custom Rate',
				uniqId: '-1'
			});
			/**
			 * we have the company/travel-agent/group rates in separate arrays
			 */
			var groupRatesBy = function(rateArray, groupName) {
				angular.forEach(rateArray, function(rate) {
					rate.groupName = groupName;
					if (rate.is_contracted) {
						rate.uniqId = rate.id + ':' + rate.contract_id;
						rate.name = rate.name + ' (' + rate.contract_name + ')';
						if (rate.id === $scope.allotmentConfigData.summary.rate && rate.contract_id === $scope.allotmentConfigData.summary.contract_id) {
							$scope.allotmentConfigData.summary.uniqId = rate.uniqId;
						}
					}
					else {
						rate.uniqId = rate.id + ':';
						if (rate.id === $scope.allotmentConfigData.summary.rate) {
							$scope.allotmentConfigData.summary.uniqId = rate.uniqId;
						}
					}
					sumData.rateSelectDataObject.push(rate);
				});
			};

			if (data.group_rates.length !== 0) {
				groupRatesBy(data.group_rates, 'Group Rates');
			}
			if (data.company_rates.length !== 0) {
				groupRatesBy(data.company_rates, 'Company Contract');
			}
			if (data.travel_agent_rates.length !== 0) {
				groupRatesBy(data.travel_agent_rates, 'Travel Agent Contract');
			}
			if ($scope.allotmentConfigData.summary.rate === '-1') {
				$scope.allotmentConfigData.summary.uniqId = '-1';
			}
			summaryMemento.uniqId = $scope.allotmentConfigData.summary.uniqId;
			
		};
		var onFetchRatesFailure = function(errorMessage) {
			$scope.errorMessage = errorMessage;
		};

		var fetchApplicableRates = function() {
			var summaryData = $scope.allotmentConfigData.summary;

			if (!!summaryData.block_from && !!summaryData.block_to) {
				var params = {
					from_date: $filter('date')(tzIndependentDate(summaryData.block_from), 'yyyy-MM-dd'),
					to_date: $filter('date')(tzIndependentDate(summaryData.block_to), 'yyyy-MM-dd'),
					company_id: (summaryData.company && summaryData.company.id) || null,
					travel_agent_id: (summaryData.travel_agent && summaryData.travel_agent.id) || null
				};
				var options = {
					successCallBack: onFetchRatesSuccess,
					failureCallBack: onFetchRatesFailure,
					params: params
				};

				$scope.callAPI(rvAllotmentConfigurationSrv.getRates, options);
				return true;
			} else {
				return false;
			}
		};

		/**
         * We need to refresh the rates once TA card info is changed
         */
        $scope.addListener('TA_CARD_CHANGED', function(event) {
            fetchApplicableRates();
		});
		
		/**
         * We need to refresh the rates once company card info is changed
         */
        $scope.addListener('COMPANY_CARD_CHANGED', function(event) {
            fetchApplicableRates();
        });

		/**
		 * when a tab switch is there, parant controller will propogate an event
		 * we will use this to fetch summary data
		 */
		$scope.$on("ALLOTMENT_TAB_SWITCHED", function(event, activeTab) {
			if (activeTab !== 'SUMMARY') {
				return;
			}
			if (!$scope.isInAddMode()) {
				$scope.$emit("FETCH_SUMMARY");

				// we are resetting the API call in progress check variable
				$scope.isUpdateInProgress = false;

				// we have to refresh this data on tab siwtch
				$scope.computeSegment();
			}
		});

		/**
		 * [initializeVariables description]
		 * @param  {[type]} argument [description]
		 * @return {[type]}          [description]
		 */
		var initializeVariables = function(argument) {

			$scope.allotmentSummaryData = {
				releaseOnDate: $rootScope.businessDate,
				demographics: null,
				promptMandatoryDemographics: false,
				isDemographicsPopupOpen: false,
				newNote: "",

				// This is required to reset Cancel when selected in dropdown but not proceeded with in the popup
				existingHoldStatus: parseInt($scope.allotmentConfigData.summary.hold_status),
				computedSegment: false,
				rates: [],
				contractedRates: [],
                rateSelectDataObject: []
			};

			$scope.billingInfoModalOpened = false;

			// we use this to ensure that we will call the API only if there is any change in the data
			summaryMemento = _.extend({}, $scope.allotmentConfigData.summary);
			demographicsMemento = {};

			// since we are recieving two ouside click event on tapping outside, we wanted to check and act
			$scope.isUpdateInProgress = false;
		};

		/**
		 * to set the active left side menu
		 * @return {undefined}
		 */
		var setActiveLeftSideMenu = function () {
			var activeMenu = ($scope.isInAddMode()) ? "menuCreateAllotment" : "menuManageAllotment";

			$scope.$emit("updateRoverLeftMenu", activeMenu);
		};

		/**
         * Checks whether demographics popup should be presented while saving the allotment
         */

        $scope.shouldShowDemographics = function () {
            var isDemographicsRequired = false;

            if ($scope.allotmentSummaryData.demographics && $scope.hotelSettings) {
                var shouldShowMarkets = showMarkets($scope.allotmentSummaryData.demographics) && 
                                        $scope.hotelSettings.force_market_code,                                  
                    shouldShowSources = showSources($scope.allotmentSummaryData.demographics) &&
                                        $scope.hotelSettings.force_source_code,                                  
                    shouldShowOrigins = showOrigins($scope.allotmentSummaryData.demographics) && 
                                        $scope.hotelSettings.force_origin_of_booking, 
                    shouldShowSegments = showSegments($scope.allotmentSummaryData.demographics) && 
                                         $scope.hotelSettings.force_segments;  

                isDemographicsRequired =  shouldShowMarkets || shouldShowSources || shouldShowOrigins || shouldShowSegments;
            }
            return isDemographicsRequired;
        };

        /**
         * Set the visibility of demographics fields based on the reservation settings and whether
         * source/segments/origin/market is enabled
         */
        $scope.setDemographicFields = function (showRequiredFields) {
            $scope.shouldShowReservationType = $scope.allotmentSummaryData.demographics.reservationTypes.length > 0;
            $scope.shouldShowMarket = showMarkets($scope.allotmentSummaryData.demographics);
            $scope.shouldShowSource = showSources($scope.allotmentSummaryData.demographics);
            $scope.shouldShowOriginOfBooking = showOrigins($scope.allotmentSummaryData.demographics);
            $scope.shouldShowSegments = showSegments($scope.allotmentSummaryData.demographics);

            if (showRequiredFields) {
                $scope.shouldShowReservationType = false;
                $scope.shouldShowMarket = $scope.shouldShowMarket && $scope.hotelSettings.force_market_code;
                $scope.shouldShowSource = $scope.shouldShowSource && $scope.hotelSettings.force_source_code;
                $scope.shouldShowOriginOfBooking = $scope.shouldShowOriginOfBooking && $scope.hotelSettings.force_origin_of_booking;
                $scope.shouldShowSegments = $scope.shouldShowSegments && $scope.hotelSettings.force_segments;
            }

        };

        /**
         * Invoked from the groupconfig ctrl while saving a new allotment
         */
        $scope.$on('CREATE_ALLOTMENT', function () {
           if ($scope.shouldShowDemographics()) {
                $scope.forceDemographics = true;
                $scope.allotmentSummaryData.promptMandatoryDemographics = true;                

				if (
                    (($scope.shouldShowMarket && $scope.allotmentConfigData.summary.demographics.market_segment_id === "") || (!$scope.shouldShowMarket)) &&
                    (($scope.shouldShowSource && $scope.allotmentConfigData.summary.demographics.source_id === "") || (!$scope.shouldShowSource)) &&
                    (($scope.shouldShowOriginOfBooking && $scope.allotmentConfigData.summary.demographics.booking_origin_id === "") || (!$scope.shouldShowOriginOfBooking)) &&
                    (($scope.shouldShowSegments && $scope.allotmentConfigData.summary.demographics.segment_id === "") || (!$scope.shouldShowSegments))) {
                        $scope.openDemographicsPopup(true, false);
                } else {
                    $scope.saveNewAllotment();
                }

            } else {
               $scope.$emit('SAVE_ALLOTMENT'); 
            }
        });

        // Invoke when the rate change popup closes
        $scope.closeRateChangePromptPopup = function () {
            var uniqId = summaryMemento.uniqId,
                rateId = uniqId && uniqId.split(':')[0],
                contractId = uniqId && uniqId.split(':')[1];

            $scope.allotmentConfigData.summary.uniqId = uniqId;
            $scope.allotmentConfigData.summary.contract_id = contractId;
            $scope.allotmentConfigData.summary.rate = rateId; 

            ngDialog.close();

        };

		/**
		 * Function used to initialize summary view
		 * @return undefined
		 */
		var initializeMe = (function() {
			BaseCtrl.call(this, $scope);
			
			// summary scroller
			$scope.setScroller("allotmentSummaryScroller");

			// updating the left side menu
			setActiveLeftSideMenu();

			// we have a list of scope varibales which we wanted to initialize
			initializeVariables();

			// Fetch rates to show in dropdown
			if (!!$scope.allotmentConfigData.summary.block_from && !!$scope.allotmentConfigData.summary.block_to) {
				fetchApplicableRates();
			}

			// Redo rates list while modifying attached cards to the group
			$scope.$on('CARDS_CHANGED', function() {
				// Fetch rates to show in dropdown
				if (!!$scope.allotmentConfigData.summary.block_from && !!$scope.allotmentConfigData.summary.block_to) {
					fetchApplicableRates();
				}
			});

			setDatePickerOptions();

			$scope.computeSegment();
		}());
	}
]);
