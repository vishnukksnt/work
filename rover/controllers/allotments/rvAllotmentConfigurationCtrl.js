sntRover.controller('rvAllotmentConfigurationCtrl', [
    '$scope',
    '$rootScope',
    'rvAllotmentSrv',
    '$filter',
    '$stateParams',
    'rvAllotmentConfigurationSrv',
    'summaryData',
    'holdStatusList',
    '$state',
    'rvPermissionSrv',
    '$timeout',
    'rvAccountTransactionsSrv',
    'hotelSettings',
    'ngDialog',
    function($scope, $rootScope, rvAllotmentSrv, $filter, $stateParams, rvAllotmentConfigurationSrv, summaryData, holdStatusList, $state, rvPermissionSrv, $timeout, rvAccountTransactionsSrv, hotelSettings, ngDialog) {

        BaseCtrl.call(this, $scope);
        $scope.isDisabledDatePicker = ($stateParams.id !== "NEW_ALLOTMENT") ? true :  false;
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
         * whether current screen is in Add Mode
         * @return {Boolean}
         */
        $scope.isInAddMode = function() {
            return ($stateParams.id === "NEW_ALLOTMENT");
        };

        /**
         * Check if selecting Addons
         * @return {Boolean}
         */
        $scope.isInAddonSelectionMode = function() {
            return $scope.allotmentConfigData.selectAddons;
        };

        /**
         * function to set title and things
         * @return - None
         */
        var setTitle = function() {
            var title = $filter('translate')('ALLOTMENT_DETAILS');

            // we are changing the title if we are in Add Mode
            if ($scope.isInAddMode()) {
                title = $filter('translate')('NEW_ALLOTMENT');
            }

            // yes, we are setting the headting and title
            $scope.setHeadingTitle(title);
        };

        /**
         * shouldShowRoomingListTab whether to show rooming list tab
         * @return {Boolean} [description]
         */
        $scope.shouldShowRoomingListTab = function() {
            // we will not show it in add mode
            return (!$scope.isInAddMode());
        };

        /**
         * Function to check the mandatory values while saving the reservation
         * Handling in client side owing to alleged issues on import if handled in the server side
         * @return boolean [true if all the mandatory values are present]
         */
        var ifMandatoryValuesEntered = function() {
            var summary = $scope.allotmentConfigData.summary;

            return !!summary.allotment_name && !!summary.hold_status && !!summary.block_from && !!summary.block_to;
        };


        /**
         * we will update the summary data, when we got this one
         * @return undefined
         */
        var fetchSuccessOfSummaryData = function(data) {
            var summaryData = $scope.allotmentConfigData.summary; // ref for summary

            summaryData = _.extend(summaryData, data.allotmentSummary);

            if (summaryData.rate === '-1') {
                summaryData.uniqId = '-1';
            }

            if (!$scope.isInAddMode()) {
                summaryData.block_from = new tzIndependentDate(summaryData.block_from);
                summaryData.block_to = new tzIndependentDate(summaryData.block_to);
            }
            
            // let others know we have refreshed summary data
            $scope.$broadcast("UPDATED_ALLOTMENT_INFO");
            
        };

       /**
        * method to fetch summary data
        * @return undefined
        */
       var fetchSummaryData = function() {
           var params = {
               "allotmentId": $scope.allotmentConfigData.summary.allotment_id
           };
           var options = {
               successCallBack: fetchSuccessOfSummaryData,
               params: params
           };

           $scope.callAPI(rvAllotmentConfigurationSrv.getAllotmentSummary, options);
       };

        /**
         * Refresh the allotment summary data when we get this event
         */
        $scope.$on("FETCH_SUMMARY", function(event) {
            event.stopPropagation();
            fetchSummaryData();
        });

        /**
         * function to form data model for add/edit mode
         * @return - None
         */
        $scope.initializeDataModelForSummaryScreen = function() {
            $scope.allotmentConfigData = {
                activeTab: $stateParams.activeTab, // Possible values are SUMMARY, ROOM_BLOCK, ROOMING, ACCOUNT, TRANSACTIONS, ACTIVITY
                summary: summaryData.allotmentSummary,
                roomblock: {},
                holdStatusList: holdStatusList.data.hold_status,
                selectAddons: false, // To be set to true while showing addons full view
                addons: {},
                selectedAddons: []
            };
            $timeout(function() {
                $scope.allotmentSummaryMemento = angular.copy($scope.allotmentConfigData.summary);
            }, 500);


            $scope.accountConfigData = {
                summary: summaryData.accountSummary
            };

            if (!$scope.isInAddMode()) {
                $scope.allotmentConfigData.summary.block_from = new tzIndependentDate($scope.allotmentConfigData.summary.block_from);
                $scope.allotmentConfigData.summary.block_to = new tzIndependentDate($scope.allotmentConfigData.summary.block_to);
                $scope.allotmentConfigData.summary.release_date = ($scope.allotmentConfigData.summary.release_date) ? new tzIndependentDate($scope.allotmentConfigData.summary.release_date) : "";
            }


            // If allotment name is passsed to create a new one
            if ( !!$stateParams.newAllotmentName ) {
                $scope.allotmentConfigData.summary.allotment_name = $stateParams.newAllotmentName;
            }
        };

        /**
         * function to check whether the user has permission
         * to make view the transactions tab
         * @return {Boolean}
         */
        $scope.hasPermissionToViewTransactionsTab = function() {
            return rvPermissionSrv.getPermissionValue('ACCESS_GROUP_ACCOUNT_TRANSACTIONS');
        };

        /**
         * TAB - to swicth tab
         * @return - None
         */
        $scope.switchTabTo = function(tab) {

            // if there was any error message there, we are clearing
            $scope.errorMessage = '';

            // allow to swith to "transactions" tab only if the user has its permission
            if (tab === "TRANSACTIONS" && !$scope.hasPermissionToViewTransactionsTab()) {
                $scope.errorMessage = ["Sorry, you don't have the permission to access the transactions"];
                return;
            }

            var isInSummaryTab = $scope.allotmentConfigData.activeTab === "SUMMARY";

            // we will restrict tab swithing if we are in add mode
            var tryingFromSummaryToOther = isInSummaryTab && tab !== 'SUMMARY';

            if ($scope.isInAddMode() && tryingFromSummaryToOther) {
                $scope.errorMessage = ['Sorry, Please save the entered information and try to switch the tab'];
                return;
            }

            $scope.allotmentConfigData.activeTab = tab;

            // propogating an event that next clients are
            $timeout(function() {
                $scope.$broadcast('ALLOTMENT_TAB_SWITCHED', $scope.allotmentConfigData.activeTab);
            }, 100);

        };

        var onTransactionFetchSuccess = function(data) {

            $scope.$emit('hideloader');
            $scope.transactionsDetails = data;
            $scope.allotmentConfigData.activeTab = 'TRANSACTIONS';

            /*
             * Adding billValue and oldBillValue with data. Adding with each bills fees details
             * To handle move to bill action
             * Added same value to two different key because angular is two way binding
             * Check in HTML moveToBillAction
             */
            angular.forEach($scope.transactionsDetails.bills, function(value, key) {
                angular.forEach(value.total_fees.fees_details, function(feesValue, feesKey) {

                    feesValue.billValue = value.bill_number; // Bill value append with bill details
                    feesValue.oldBillValue = value.bill_number; // oldBillValue used to identify the old billnumber
                });
            });

        };

        var preLoadTransactionsData = function() {
            var params = {
                "account_id": $scope.accountConfigData.summary.posting_account_id
            };

            $scope.callAPI(rvAccountTransactionsSrv.fetchTransactionDetails, {
                successCallBack: onTransactionFetchSuccess,
                params: params
            });

        };

        $scope.reloadPage = function(tab) {
            tab = tab || "SUMMARY";
            $state.go('rover.allotments.config', {
                id: $scope.allotmentConfigData.summary.allotment_id,
                activeTab: tab
            }, {
                reload: true
            });
        };

        /**
         * Handle closing of addons screen
         * @return undefined
         */
        $scope.closeAllotmentAddonsScreen = function() {
            $scope.allotmentConfigData.selectAddons = false;
            $scope.reloadPage();
        };

        /**
         * Handle opening the addons Management screen
         * @return undefined
         */
        $scope.openAllotmentAddonsScreen = function() {
            $scope.allotmentConfigData.selectAddons = true;
        };

        /**
         * to get the current tab url
         * @return {String}
         */
        $scope.getCurrentTabUrl = function() {
            var tabAndUrls = {
                'SUMMARY': '/assets/partials/allotments/summary/rvAllotmentConfigurationSummaryTab.html',
                'ROOM_BLOCK': '/assets/partials/allotments/details/rvAllotmentConfigurationRoomBlockTab.html',
                'RESERVATIONS': '/assets/partials/allotments/reservations/rvAllotmentReservationsListTab.html',
                'ACTIVITY': '/assets/partials/allotments/activity/rvAllotmentActivityTab.html'
            };

            return tabAndUrls[$scope.allotmentConfigData.activeTab];
        };
        var onAllotmentSaveSuccess = function(data) {
            $scope.allotmentConfigData.summary.allotment_id = data.allotment_id;
            $scope.allotmentConfigData.summary.commission_details = data.commission_details;
            $state.go('rover.allotments.config', {
                id: data.allotment_id
            });
            $stateParams.id = data.allotment_id;
        };

        var onAllotmentSaveFailure = function(errorMessage) {
            $scope.errorMessage = errorMessage;
        };

        /**
         * Save the new Allotment
         * @return undefined
         */
        $scope.saveNewAllotment = function() {
            $scope.closeDialog ();
            $scope.errorMessage = "";
            if (rvPermissionSrv.getPermissionValue('CREATE_ALLOTMENT_SUMMARY') && !$scope.allotmentConfigData.summary.allotment_id) {
                if (ifMandatoryValuesEntered()) {
                    if (!$scope.allotmentConfigData.summary.rate) {
                        $scope.allotmentConfigData.summary.rate = -1;
                        $scope.allotmentConfigData.summary.uniqId = '-1';
                        $scope.allotmentConfigData.summary.contract_id = null;
                    }
                    var options = {
                        successCallBack: onAllotmentSaveSuccess,
                        failureCallBack: onAllotmentSaveFailure,
                        params: {
                            summary: $scope.allotmentConfigData.summary
                        }
                    };

                    $scope.callAPI(rvAllotmentConfigurationSrv.saveAllotmentSummary, options);
                } else {
                    $scope.errorMessage = ["Allotment's name, from date, to date and hold status are mandatory"];
                }
            } else {
                $scope.$emit("showErrorMessage", ["Sorry, you don\'t have enough permission to save the details"]);
            }

        };

        var refreshSummaryDataAfterUpdate = false,
            updateAllotmentSummaryInProgress = false,
            onAllotmentUpdateSuccess = function(data) {
                $scope.allotmentConfigData.summary.commission_details = data.commission_details;
                updateAllotmentSummaryInProgress = false;
                // client controllers should get an infromation whether updation was success
                $scope.$broadcast("UPDATED_ALLOTMENT_INFO", angular.copy($scope.allotmentConfigData.summary));
                $scope.allotmentSummaryMemento = angular.copy($scope.allotmentConfigData.summary);

                // If required refresh summary data to ensure data integrity
                if (refreshSummaryDataAfterUpdate) {
                    fetchSummaryData();
                    refreshSummaryDataAfterUpdate = false;
                }
                return true;
            },
            onAllotmentUpdateFailure = function(errorMessage) {
                // client controllers should get an infromation whether updation was a failure
                $scope.$broadcast("FAILED_TO_UPDATE_ALLOTMENT_INFO", errorMessage);
                $scope.errorMessage = errorMessage;
                refreshSummaryDataAfterUpdate = false;
                updateAllotmentSummaryInProgress = false;
                return false;
            };

        /**
         * Update the allotment data
         * @return boolean
         */
        $scope.updateAllotmentSummary = function(reload) {
            reload = reload || false;
            if (rvPermissionSrv.getPermissionValue('EDIT_ALLOTMENT_SUMMARY')) {
                if (angular.equals($scope.allotmentSummaryMemento, $scope.allotmentConfigData.summary) || updateAllotmentSummaryInProgress) {
                    return false;
                }
                if (reload) {
                    refreshSummaryDataAfterUpdate = true;
                }
                var summaryData = _.extend({}, $scope.allotmentConfigData.summary);

                summaryData.block_from = $filter('date')(summaryData.block_from, $rootScope.dateFormatForAPI);
                summaryData.block_to = $filter('date')(summaryData.block_to, $rootScope.dateFormatForAPI);
                summaryData.release_date = $filter('date')(summaryData.release_date, $rootScope.dateFormatForAPI);

                if (!summaryData.rate) {
                    summaryData.rate = -1;
                    summaryData.contract_id = null;
                    summaryData.uniqId = '-1';
                }
                updateAllotmentSummaryInProgress = true;
                $scope.callAPI(rvAllotmentConfigurationSrv.updateAllotmentSummary, {
                    successCallBack: onAllotmentUpdateSuccess,
                    failureCallBack: onAllotmentUpdateFailure,
                    params: {
                        summary: summaryData
                    }
                });
            } else {
                $scope.$emit("showErrorMessage", ["Sorry, the changes will not get saved as you don\'t have enough permission to update the details"]);
            }
        };

        /**
         * Code to duplicate allotment
         * Future functionality
         * @return undefined
         */
        $scope.duplicateAllotment = function() {
            // TODO: Duplicate Allotment - Future functionality
        };

        /**
         * if comapny card id is null, we will not show
         * @return {Boolean} [description]
         */
        $scope.shouldShowCompanyCardNavigationButton = function() {
            return ( !$scope.isInAddMode() && (null !== $scope.allotmentConfigData.summary.company && !!$scope.allotmentConfigData.summary.company.id) );
        };

        /**
         * if travel agent id is null, we will not show
         * @return {Boolean} [description]
         */
        $scope.shouldShowTravelAgentNavigationButton = function() {
            return ( !$scope.isInAddMode() && (null !== $scope.allotmentConfigData.summary.travel_agent && !!$scope.allotmentConfigData.summary.travel_agent.id) );
        };

        $scope.goToTACard = function() {
            $state.go('rover.companycarddetails', {
                id: summaryData.allotmentSummary.travel_agent.id,
                type: 'TRAVELAGENT'
            });
        };

        $scope.goToCompanyCard = function() {
            $state.go('rover.companycarddetails', {
                id: summaryData.allotmentSummary.company.id,
                type: 'COMPANY'
            });
        };

        /**
         * Discard the new Allotment
         * @return undefined
         */
        $scope.discardNewAllotment = function() {
            $scope.allotmentConfigData.summary = angular.copy(rvAllotmentConfigurationSrv.baseConfigurationSummary);
        };

        $scope.onCompanyCardChange = function() {
            var summaryData = $scope.allotmentConfigData.summary;

            if (summaryData.company && summaryData.company.name === "") {
                summaryData.company = null;
            }
        };

        $scope.onTravelAgentCardChange = function() {
            var summaryData = $scope.allotmentConfigData.summary;

            if (summaryData.travel_agent && summaryData.travel_agent.name === "") {
                summaryData.travel_agent = null;
            }
        };

        /**
         * Autocompletions for company/travel agent
         * @return {None}
         */
        var initializeAutoCompletions = function() {
            // this will be common for both company card & travel agent
            var cardsAutoCompleteCommon = {

                focus: function(event, ui) {
                    return false;
                }
            };

            // merging auto complete setting for company card with common auto cmplt options
            $scope.companyAutoCompleteOptions = angular.extend({
                source: function(request, response) {
                    rvAllotmentConfigurationSrv.searchCompanyCards(request.term)
                        .then(function(data) {
                            var list = [];
                            var entry = {};

                            $.map(data, function(each) {
                                entry = {
                                    label: each.account_name,
                                    value: each.id,
                                    address: each.account_address,
                                    type: each.account_type,
                                    contract_access_code: each.current_contracts.length > 0 ? each.current_contracts[0].access_code : null
                                };
                                list.push(entry);
                            });

                            response(list);
                        });
                },
                select: function(event, ui) {
                    this.value = ui.item.label;
                    $scope.allotmentConfigData.summary.company.name = ui.item.label;
                    $scope.allotmentConfigData.summary.company.id = ui.item.value;
                    if (!$scope.isInAddMode()) {
                        $scope.updateAllotmentSummary(true);
                    }
                    $scope.$broadcast("COMPANY_CARD_CHANGED");
                    runDigestCycle();
                    return false;
                },
                change: function() {
                    if (!$scope.isInAddMode() && (!$scope.allotmentConfigData.summary.company || !$scope.allotmentConfigData.summary.company.name)) {
                        $scope.allotmentConfigData.summary.company = $scope.allotmentSummaryMemento.company;
                        $scope.detachCardFromAllotment('company');
                    }
                    else {
                        $scope.$broadcast("COMPANY_CARD_CHANGED");
                    }
                }
            }, cardsAutoCompleteCommon);

            // merging auto complete setting for travel agent with common auto cmplt options
            $scope.travelAgentAutoCompleteOptions = angular.extend({
                source: function(request, response) {
                    rvAllotmentConfigurationSrv.searchTravelAgentCards(request.term)
                        .then(function(data) {
                            var list = [];
                            var entry = {};

                            $.map(data, function(each) {
                                entry = {
                                    label: each.account_name,
                                    value: each.id,
                                    address: each.account_address,
                                    type: each.account_type,
                                    contract_access_code: each.current_contracts.length > 0 ? each.current_contracts[0].access_code : null
                                };
                                list.push(entry);
                            });

                            response(list);
                        });
                },
                select: function(event, ui) {
                    this.value = ui.item.label;
                    $scope.allotmentConfigData.summary.travel_agent.name = ui.item.label;
                    $scope.allotmentConfigData.summary.travel_agent.id = ui.item.value;
                    if (!$scope.isInAddMode()) {
                        $scope.updateAllotmentSummary(true);
                    }
                    $scope.$broadcast("TA_CARD_CHANGED");
                    runDigestCycle();
                    return false;
                },
                change: function() {
                    if (!$scope.isInAddMode() && (!$scope.allotmentConfigData.summary.travel_agent || !$scope.allotmentConfigData.summary.travel_agent.name)) {
                        $scope.allotmentConfigData.summary.travel_agent = $scope.allotmentSummaryMemento.travel_agent;
                        $scope.detachCardFromAllotment('travel_agent');
                    }
                    else {
                        $scope.$broadcast("TA_CARD_CHANGED");
                    }
                }
            }, cardsAutoCompleteCommon);
        };

        /**
         * Trigger card detach warning popup
         */
        $scope.detachCardFromAllotment = function(card) {
            // warn about billing info
            var dataForPopup = {
                cardType: card
            };

            ngDialog.open({
                template: '/assets/partials/groups/summary/popups/detachCardWarningPopup.html',
                scope: $scope,
                closeByDocument: false,
                closeByEscape: false,
                data: JSON.stringify(dataForPopup)
            });
        };

        // Detaches the cards(TA/CC) from group
        $scope.detachCard = function(cardType) {
            if (cardType === 'company')  {
                $scope.allotmentConfigData.summary.company = {
                    id: '',
                    name: ''
                };  
                $scope.$broadcast("COMPANY_CARD_CHANGED");

            } else {
                $scope.allotmentConfigData.summary.travel_agent = {
                    id: '',
                    name: ''
                }; 
                $scope.$broadcast("TA_CARD_CHANGED");
            }
            $scope.updateAllotmentSummary(true);
        };

        // Cancel the detachment of CC/TA from group
        $scope.cancelDetachment = function(cardType) {
            if (cardType === 'company') {
                $scope.allotmentConfigData.summary.company = angular.copy($scope.allotmentSummaryMemento.company);
            } else {
                $scope.allotmentConfigData.summary.travel_agent = angular.copy($scope.allotmentSummaryMemento.travel_agent);
            }
        };

        /**
         * method to set allotmentConfigData.summary.addons_count
         */
        $scope.computeAddonsCount = function() {
            var count = 0;

            angular.forEach($scope.allotmentConfigData.selectedAddons, function(addon) {
                count += parseInt(addon.addon_count);
            });
            if (count > 0) {
                $scope.allotmentConfigData.summary.addons_count = count;
            } else {
                $scope.allotmentConfigData.summary.addons_count = null;
            }

        };

        $scope.updateAndBack = function() {
            if (!$scope.isInAddMode() && $scope.allotmentConfigData.activeTab === "SUMMARY") {
                $scope.updateAllotmentSummary();
            } else if ($scope.allotmentConfigData.activeTab === "ACCOUNT") {
                $scope.$broadcast('UPDATE_ACCOUNT_SUMMARY');
            }
            $state.go('rover.allotments.search', { origin: 'BACK_TO_ALLOTMENT_SEARCH_LIST' });
        };

        /**
         * function to set Back Navigation params
         */
        var setBackNavigation = function() {
            $rootScope.setPrevState = {
                title: $filter('translate')('ALLOTMENTS'),
                callback: 'updateAndBack',
                scope: $scope
            };
            // setting title and things
            setTitle();
        };

        /**
         * When we recieve the error message from its child controllers, we have to show them
         * @param  {Object} event
         * @param  {String} errorMessage)
         * @return undefined
         */
        $scope.$on('showErrorMessage', function(event, errorMessage) {
            $scope.errorMessage = errorMessage;
            runDigestCycle();
        });


        $scope.parseCurrency = function(value) {
            if (!!value) {
                return $rootScope.currencySymbol + $filter('number')(value, 2);
            } else {
                return "";
            }
        };

        // Method invoked while clicking the Save Allotment btn in header
        $scope.createNewAllotment = function () {
            $scope.$broadcast('CREATE_ALLOTMENT');
        };

        // Event published from summary ctrl while saving the demographics
        $scope.$on('SAVE_ALLOTMENT', function () {
            $scope.saveNewAllotment();
        });

        /**
         * function to initialize things for allotment config.
         * @return - None
         */
        var initAllotmentConfig = function() {

            // CICO-42249 - Hotel settings
            $scope.hotelSettings = hotelSettings;

            // forming the data model if it is in add mode or populating the data if it is in edit mode
            $scope.initializeDataModelForSummaryScreen();

            // auto completion things
            initializeAutoCompletions();

            // back navigation
            setBackNavigation();
        };

        initAllotmentConfig();
    }
]);
