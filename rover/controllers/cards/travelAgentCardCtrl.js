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
    angular.module('sntRover').controller('RVTravelAgentCardCtrl', ['$scope', '$rootScope', '$timeout', 'RVCompanyCardSrv', 'rvCompanyCardContractsSrv', 'ngDialog', '$filter', '$stateParams', 'rvPermissionSrv', 'rvFileCloudStorageSrv', function ($scope, $rootScope, $timeout, RVCompanyCardSrv, rvCompanyCardContractsSrv, ngDialog, $filter, $stateParams, rvPermissionSrv, rvFileCloudStorageSrv) {
      BaseCtrl.call(this, $scope);

      $scope.searchMode = true;
      $scope.account_type = 'TRAVELAGENT';
      $scope.currentSelectedTab = 'cc-contact-info';
      $scope.isGlobalToggleReadOnly = !rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE');
      $scope.statisticsTabActiveView = 'summary';

      // To store changes in other hotels' commissions data
      var updatedOtherHotelsInfo = [];

      $scope.hasPermissionToViewCommissionTab = function () {
        return rvPermissionSrv.getPermissionValue('VIEW_COMMISSIONS_TAB');
      };
      $scope.isCommissionTabAvailable = $scope.hasPermissionToViewCommissionTab();

      $scope.switchTabTo = function ($event, tabToSwitch) {
        $event.stopPropagation();
        $event.stopImmediatePropagation();

        // CICO-28058 - checking whether AR Number is present or not.
        var isArNumberAvailable = !!$scope.contactInformation.account_details.accounts_receivable_number;

        if ($scope.currentSelectedTab === 'cc-contact-info' && tabToSwitch !== 'cc-contact-info') {
          if ($scope.viewState.isAddNewCard) {
            $scope.$broadcast("setCardContactErrorMessage", [$filter('translate')('TA_SAVE_PROMPT')]);
          } else {
            saveContactInformation($scope.contactInformation);
            $scope.$broadcast("contractTabActive");
          }
        }
        if ($scope.currentSelectedTab === 'cc-contracts' && tabToSwitch !== 'cc-contracts') {
          $scope.$broadcast("contactTabActive");
          $scope.$broadcast("saveContract");
        } else if ($scope.currentSelectedTab === 'cc-ar-accounts' && tabToSwitch !== 'cc-ar-accounts') {
          $scope.$broadcast("saveArAccount");
        }

        if (tabToSwitch === 'cc-ar-accounts') {
          $scope.$broadcast("arAccountTabActive");
        } else if (tabToSwitch === 'cc-contracts') {
          $scope.$broadcast("contractTabActive");
        } else if (tabToSwitch === 'cc-contact-info') {
          $scope.$broadcast("contactTabActive");
        } else if (tabToSwitch === 'cc-ar-transactions' && isArNumberAvailable) {
          $scope.$broadcast("arTransactionTabActive");
          $scope.isWithFilters = false;
        } else if (tabToSwitch === 'cc-notes') {
          $scope.$broadcast("fetchNotes");
          $scope.isWithFilters = false;
        } else if (tabToSwitch === 'statistics') {
          $scope.$broadcast("LOAD_STATISTICS");
        } else if (tabToSwitch === 'wallet') {
          $scope.$broadcast("wallet");
        } else if (tabToSwitch === 'cc-commissions') {
          $scope.$broadcast("commissionsTabActive");
        } else if (tabToSwitch === 'cc-activity-log') {
          $scope.$broadcast("activityLogTabActive");
        }
        if (tabToSwitch === 'cc-ar-transactions' && !isArNumberAvailable) {
          console.warn("Save AR Account and Navigate to AR Transactions");
        } else if (!$scope.viewState.isAddNewCard) {
          $scope.currentSelectedTab = tabToSwitch;
        }
      };

      $scope.$on('ARTransactionSearchFilter', function (e, data) {
        $scope.isWithFilters = data;
      });

      var presentContactInfo = {},
          createArAccountCheck = false;
      /* -------AR account starts here-----------*/

      $scope.shouldShowARMandatoryPopup = function () {
        var shouldEnable = ($scope.contactInformation.mandatoryFields.address_line1_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.address_line1_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.street1) : true) && ($scope.contactInformation.mandatoryFields.city_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.city_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.city) : true) && ($scope.contactInformation.mandatoryFields.postal_code_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.postal_code_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.postal_code) : true) && ($scope.contactInformation.mandatoryFields.country_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.country_mandatory.is_mandatory ? $scope.contactInformation.address_details.country_id !== '' && $scope.contactInformation.address_details.country_id !== null : true) && ($scope.contactInformation.mandatoryFields.contact_phone_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_phone_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.phone) : true) && ($scope.contactInformation.mandatoryFields.contact_email_address_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_email_address_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.email_address) && isValidEmail($scope.contactInformation.address_details.email_address) : true) && ($scope.contactInformation.mandatoryFields.e_invoice_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.e_invoice_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.e_invoice_address) : true) && ($scope.contactInformation.mandatoryFields.organization_id_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.organization_id_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.account_details.organization_id) : true) && ($scope.contactInformation.mandatoryFields.tax_id_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.tax_id_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.account_details.tax_number) : true) && ($scope.contactInformation.mandatoryFields.regd_tax_office_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.regd_tax_office_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.account_details.reg_tax_office) : true) && ($scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.primary_contact_details.contact_first_name) && !isEmpty($scope.contactInformation.primary_contact_details.contact_last_name) : true) && (!$scope.arAccountDetails.is_auto_assign_ar_numbers ? $scope.arAccountDetails.ar_number !== '' && $scope.arAccountDetails.ar_number !== null : true) && ($scope.contactInformation.mandatoryFields.payment_due_days_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.payment_due_days_mandatory.is_mandatory ? $scope.arAccountDetails.payment_due_days !== '' && $scope.arAccountDetails.payment_due_days !== null : true);

        return shouldEnable;
      };

      $scope.$on("saveArAccountFromMandatoryPopup", function (e, data) {
        $scope.arAccountDetails = data;
        $scope.isArTabAvailable = true;
        $scope.shouldSaveArDataFromPopup = true;
      });

      $scope.openCompanyTravelAgentCardMandatoryFieldsPopup = function () {
        $scope.shouldSaveArDataFromPopup = false;
        ngDialog.open({
          template: '/assets/partials/companyCard/rvCompanyTravelAgentCardMandatoryFieldsPopup.html',
          className: 'ngdialog-theme-default1 calendar-single1',
          controller: 'companyTravelAgentMandatoryFieldsController',
          closeByDocument: false,
          scope: $scope
        });
      };

      $scope.clickedCreateArAccountButton = function () {
        if (!$scope.shouldShowARMandatoryPopup()) {
          $scope.isMandatoryPopupOpen = true;
          $scope.openCompanyTravelAgentCardMandatoryFieldsPopup();
        } else {
          createArAccountCheck = true;
          $scope.showARTab();
        }
      };

      $scope.$on("UPDATE_MANDATORY_POPUP_OPEN_FLAG", function () {
        $scope.isMandatoryPopupOpen = false;
      });

      $scope.showARTab = function ($event) {
        saveContactInformation($scope.contactInformation);
      };
      $scope.$on('ARNumberChanged', function (e, data) {
        $scope.contactInformation.account_details.accounts_receivable_number = data.newArNumber;
      });

      $scope.deleteArAccount = function () {
        ngDialog.open({
          template: '/assets/partials/companyCard/rvCompanyCardDeleteARaccountPopup.html',
          className: 'ngdialog-theme-default1 calendar-single1',
          closeByDocument: false,
          scope: $scope
        });
      };

      $scope.deleteARAccountConfirmed = function () {
        var successCallbackOfdeleteArAccount = function successCallbackOfdeleteArAccount(data) {
          $scope.$emit('hideLoader');
          $scope.isArTabAvailable = false;
          $scope.$broadcast('setgenerateNewAutoAr', false);
          $scope.$broadcast('ArAccountDeleted');
          $scope.contactInformation.account_details.accounts_receivable_number = "";
          ngDialog.close();
        };
        var dataToSend = {
          "id": $scope.reservationDetails.travelAgent.id
        };

        $scope.invokeApi(RVCompanyCardSrv.deleteArAccount, dataToSend, successCallbackOfdeleteArAccount);
      };

      $scope.clikedDiscardDeleteAr = function () {
        ngDialog.close();
      };

      var callCompanyCardServices = function callCompanyCardServices() {
        var param = {
          'id': $scope.reservationDetails.travelAgent.id
        };
        var successCallbackFetchArNotes = function successCallbackFetchArNotes(data) {
          $scope.$emit("hideLoader");
          $scope.arAccountNotes = data;
          $scope.$broadcast('ARDetailsRecieved');
        };
        var fetchARNotes = function fetchARNotes() {
          $scope.invokeApi(RVCompanyCardSrv.fetchArAccountNotes, param, successCallbackFetchArNotes);
        };

        var successCallbackFetchArDetails = function successCallbackFetchArDetails(data) {
          $scope.$emit("hideLoader");
          $scope.arAccountDetails = data;
          if ($scope.arAccountDetails.is_use_main_contact !== false) {
            $scope.arAccountDetails.is_use_main_contact = true;
          }
          if ($scope.arAccountDetails.is_use_main_address !== false) {
            $scope.arAccountDetails.is_use_main_address = true;
          }
          fetchARNotes();
        };

        $scope.invokeApi(RVCompanyCardSrv.fetchArAccountDetails, param, successCallbackFetchArDetails);
      };

      /* -------AR account ends here-----------*/
      $scope.$on('travelAgentFetchComplete', function (obj, isNew) {
        $scope.searchMode = false;
        $scope.contactInformation = $scope.travelAgentInformation;
        $scope.contactInformation.id = $scope.reservationDetails.travelAgent.id;
        // object holding copy of contact information
        // before save we will compare 'contactInformation' against 'presentContactInfo'
        // to check whether data changed
        $scope.currentSelectedTab = 'cc-contact-info';
        presentContactInfo = angular.copy($scope.contactInformation);

        if (isNew === true) {
          $scope.contactInformation.account_details.account_name = $scope.searchData.travelAgentCard.travelAgentName;
          $scope.contactInformation.address_details.city = $scope.searchData.travelAgentCard.travelAgentCity;
          $scope.contactInformation.account_details.account_number = $scope.searchData.travelAgentCard.travelAgentIATA;
        }

        $scope.$broadcast("contactTabActive");
        $scope.$broadcast("UPDATE_CONTACT_INFO");
        $timeout(function () {
          $scope.$emit('hideLoader');
        }, 1000);
        if (!isNew) {
          callCompanyCardServices();
        }
        if ($scope.contactInformation.commission_details) {
          $scope.displayShowPropertiesButton = !$scope.contactInformation.commission_details.is_global_commission;
        }
      });

      $scope.$on("travelAgentSearchInitiated", function () {
        $scope.companySearchIntiated = true;
        $scope.travelAgents = $scope.searchedtravelAgents;
        $scope.$broadcast("refreshTravelAgentScroll");
      });

      $scope.$on("travelAgentSearchStopped", function () {
        $scope.companySearchIntiated = false;
        $scope.travelAgents = [];
        $scope.$broadcast("refreshTravelAgentScroll");
      });

      $scope.$on("travelAgentDetached", function () {
        $scope.searchMode = true;
        $scope.isArTabAvailable = false;
        $scope.$broadcast('setgenerateNewAutoAr', false);
      });

      /**
       * function to handle click operation on travel agent card, mainly used for saving
       */
      $scope.travelAgentCardClicked = function ($event) {
        $event.stopPropagation();
        if (document.getElementById("cc-contact-info") !== null && getParentWithSelector($event, document.getElementById("cc-contact-info")) && $scope.currentSelectedTab === 'cc-contact-info') {
          return;
        } else if (document.getElementById("cc-contracts") !== null && getParentWithSelector($event, document.getElementById("cc-contracts")) && $scope.currentSelectedTab === 'cc-contracts') {
          return;
        } else if (document.getElementById("cc-ar-accounts") !== null && getParentWithSelector($event, document.getElementById("cc-ar-accounts")) && $scope.currentSelectedTab === 'cc-ar-accounts') {
          return;
        } else if (!$scope.viewState.isAddNewCard && document.getElementById("travel-agent-card-header") !== null && getParentWithSelector($event, document.getElementById("travel-agent-card-header"))) {
          $scope.$emit("saveContactInformation");
          $rootScope.$broadcast("saveArAccount");
        }

        rvFileCloudStorageSrv.activeCardType = 'ACCOUNT_TRAVELAGENT';
      };

      /**
       * recieving function for save contact with data
       */
      $scope.$on("saveContactInformation", function (event, dataToUpdate) {
        event.preventDefault();
        event.stopPropagation();
        // If property commission details are saved from the popup, copy back the deep copy objects back to the model and save
        // TODO: what is be to done, when this API is failed ??? - like assign back old value
        if (dataToUpdate && dataToUpdate.other_hotels_info) {
          $scope.contactInformation.commission_details.other_hotels_info = dataToUpdate.other_hotels_info;
          saveContactInformation($scope.contactInformation, dataToUpdate.hotel_info_changed_from_popup);
        } else {
          saveContactInformation($scope.contactInformation);
        }
      });

      $scope.$on("saveTravelAgentContactInformation", function (event) {
        event.preventDefault();
        saveContactInformation($scope.contactInformation);
      });
      /*
       * Toggle global button
       */
      $scope.toggleGlobalButton = function () {
        if (rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE')) {
          $scope.contactInformation.is_global_enabled = !$scope.contactInformation.is_global_enabled;
          $scope.contactInformation.account_type = $scope.account_type;
        }
      };
      $scope.shouldShowCommissionsTab = function () {
        return $scope.account_type === 'TRAVELAGENT';
      };

      $scope.isUpdateEnabledForTravelAgent = function () {
        if ($scope.contactInformation.is_global_enabled === undefined) {
          return;
        }
        var isDisabledFields = false;

        if ($scope.contactInformation.is_global_enabled) {
          if (!rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE')) {
            isDisabledFields = true;
          }
        } else {
          if (!rvPermissionSrv.getPermissionValue('EDIT_TRAVEL_AGENT_CARD')) {
            isDisabledFields = true;
          }
        }
        return isDisabledFields;
      };
      /*
       * If contract rate exists then should not allow editing name of CC/TA - CICO-56441
       */
      $scope.isUpdateEnabledForName = function () {
        var contractedRates = rvCompanyCardContractsSrv.getContractedRates(),
            isUpdateEnabledForNameInCard = true;

        if (contractedRates.current_contracts && contractedRates.current_contracts.length > 0 || contractedRates.future_contracts && contractedRates.future_contracts.length > 0 || contractedRates.history_contracts && contractedRates.history_contracts.length > 0) {
          isUpdateEnabledForNameInCard = false;
        }
        return isUpdateEnabledForNameInCard;
      };

      /**
       * a reciever function to do operation on outside click, which is generated by outside click directive
       */
      $scope.$on("OUTSIDECLICKED", function (event, targetElement) {
        event.preventDefault();
        saveContactInformation($scope.contactInformation);
        $scope.checkOutsideClick(targetElement);
        $rootScope.$broadcast("saveArAccount");
        $rootScope.$broadcast("saveContract");
      });

      /**
       * success callback of save contact data
       */
      var successCallbackOfContactSaveData = function successCallbackOfContactSaveData(data, hotelInfoChangedFromPopup) {

        // Close the hotel info popup on saving
        if (hotelInfoChangedFromPopup) {
          ngDialog.close();
        }

        /** Set the other hotels' commission details same as that of current hotel's,
         *  when contact information saved with global commission true.
         **/
        if ($scope.contactInformation.commission_details && $scope.contactInformation.commission_details.is_global_commission) {
          angular.forEach($scope.contactInformation.commission_details.other_hotels_info, function (item) {
            item.commission_type = $scope.contactInformation.commission_details.commission_type;
            item.type = $scope.contactInformation.commission_details.type;
            item.value = $scope.contactInformation.commission_details.value;
            item.is_prepaid = $scope.contactInformation.commission_details.is_prepaid;
          });
        }

        $scope.contactInformation.id = data.id;
        $scope.reservationDetails.travelAgent.id = data.id;
        $rootScope.$broadcast("IDGENERATED", { 'id': data.id });
        if ($scope.shouldSaveArDataFromPopup) {
          $scope.shouldSaveArDataFromPopup = false;
          $scope.$broadcast("UPDATE_AR_ACCOUNT_DETAILS", $scope.arAccountDetails);
          $scope.$broadcast("saveArAccount");
        }
        callCompanyCardServices();
        // New Card Handler
        if ($scope.viewState.isAddNewCard && typeof data.id !== "undefined") {
          if ($scope.viewState.identifier === "STAY_CARD" || $scope.viewState.identifier === "CREATION" && $scope.viewState.reservationStatus.confirm) {
            $scope.viewState.pendingRemoval.status = false;
            // if a new card has been added, reset the future count to zero
            if ($scope.reservationDetails.travelAgent.futureReservations <= 0) {
              $scope.replaceCardCaller('travel_agent', {
                id: data.id
              }, false);
            } else {
              $scope.checkFuture('travel_agent', {
                id: data.id
              });
            }
            $scope.reservationDetails.travelAgent.futureReservations = 0;
            $scope.viewState.pendingRemoval.cardType = "";
          }
          $scope.viewState.isAddNewCard = false;
          $scope.closeGuestCard();
          $scope.cardSaved();
          $scope.reservationDetails.travelAgent.id = data.id;
          if ($scope.reservationData && $scope.reservationData.travelAgent) {
            $scope.reservationData.travelAgent.id = data.id;
            $scope.reservationData.travelAgent.name = $scope.contactInformation.account_details.account_name;
          }
        }

        // taking a deep copy of copy of contact info. for handling save operation
        // we are not associating with scope in order to avoid watch
        presentContactInfo = angular.copy($scope.contactInformation);
      };

      /**
       * failure callback of save contact data
       */
      var failureCallbackOfContactSaveData = function failureCallbackOfContactSaveData(errorMessage) {
        $rootScope.$broadcast("setCardContactErrorMessage", errorMessage);
        $scope.currentSelectedTab = 'cc-contact-info';
      };

      $scope.clickedSaveCard = function (cardType) {
        // show commission warning popup if departure date has passed
        if (cardType === 'travel_agent' && $scope.reservationData.status === "CHECKEDOUT" && new Date($scope.userInfo.business_date) > new Date($scope.reservationData.departureDate)) {
          // show warning popup
          ngDialog.open({
            template: '/assets/partials/cards/popups/rvNewTACommissionsWarningPopup.html',
            className: '',
            closeByDocument: false,
            closeByEscape: false,
            scope: $scope
          });
        } else {
          saveContactInformation($scope.contactInformation);
        }
      };

      $scope.saveNewTACard = function ($event) {
        $event.stopPropagation();
        ngDialog.close();
        saveContactInformation($scope.contactInformation);
      };

      var ifDataPresent = function ifDataPresent(data, presentContactInfo) {
        return data && data.commission_details && presentContactInfo && presentContactInfo.commission_details;
      };

      /**
       * function used to save the contact data, it will save only if there is any
       * change found in the present contact info.
       */
      var saveContactInformation = function saveContactInformation(data, hotelInfoChangedFromPopup) {
        var dataUpdated = false;

        updatedOtherHotelsInfo = [];

        if (ifDataPresent(data, presentContactInfo) && !angular.equals(data, presentContactInfo)) {
          dataUpdated = true;
          angular.forEach(data.commission_details.other_hotels_info, function (next) {
            angular.forEach(presentContactInfo.commission_details.other_hotels_info, function (present) {
              if (next.id === present.id && !_.isMatch(next, present)) {
                updatedOtherHotelsInfo.push(next);
              }
            });
          });
        }
        if (typeof data !== 'undefined' && (dataUpdated || $scope.viewState.isAddNewCard)) {
          var dataToSend = JSON.parse(JSON.stringify(data));

          if (dataToSend.commission_details) {
            dataToSend.commission_details.other_hotels_info = angular.copy(updatedOtherHotelsInfo);
          }

          if (typeof dataToSend.countries !== 'undefined') {
            delete dataToSend['countries'];
          }
          // CICO-49040 : Hadling passing blank string.
          if (dataToSend.account_details.account_number === "") {
            dataToSend.account_details.account_number = null;
          }
          // CICO-50810 : Hadling passing blank string.
          if (typeof dataToSend.primary_contact_details === 'undefined') {
            dataToSend.primary_contact_details = {};
            dataToSend.primary_contact_details.contact_email = null;
          } else if (dataToSend.primary_contact_details.contact_email === "") {
            dataToSend.primary_contact_details.contact_email = null;
          }
          if (typeof dataToSend.address_details === 'undefined') {
            dataToSend.address_details = {};
          }
          dataToSend.account_type = $scope.account_type;
          var options = {
            params: dataToSend,
            successCallBack: function successCallBack(response) {
              successCallbackOfContactSaveData(response, hotelInfoChangedFromPopup);
            },
            failureCallBack: failureCallbackOfContactSaveData
          };

          $scope.callAPI(RVCompanyCardSrv.saveContactInformation, options);
        } else {
          if ($scope.shouldSaveArDataFromPopup) {
            $scope.shouldSaveArDataFromPopup = false;
            $scope.$broadcast("UPDATE_AR_ACCOUNT_DETAILS", $scope.arAccountDetails);
            $scope.$broadcast("saveArAccount");
          }
          if (createArAccountCheck) {
            $scope.$broadcast('setgenerateNewAutoAr', true);
            $scope.$broadcast("saveArAccount");
            $scope.isArTabAvailable = true;
          }
          createArAccountCheck = false;
          // Close the hotel info popup on saving
          if (hotelInfoChangedFromPopup) {
            ngDialog.close();
          }
        }
      };

      /**
       * function to check whether the user has permission
       * to create/edit AR Account.
       * @return {Boolean}
       */
      $scope.hasPermissionToCreateArAccount = function () {
        return rvPermissionSrv.getPermissionValue('CREATE_AR_ACCOUNT');
      };

      $scope.addListener("UPDATE_STATISTICS_TAB_ACTIVE_VIEW", function (event, data) {
        $scope.statisticsTabActiveView = data.activeView;
      });
    }]);

    angular.module('sntRover').controller('travelAgentResults', ['$scope', '$timeout', function ($scope, $timeout) {
      BaseCtrl.call(this, $scope);
      var scrollerOptionsForGraph = {
        scrollX: true,
        click: true,
        preventDefault: false
      };

      $scope.setScroller('travelAgentResultScroll', scrollerOptionsForGraph);

      $scope.$on("refreshTravelAgentScroll", function () {
        $timeout(function () {
          $scope.refreshScroller('travelAgentResultScroll');
        }, 500);
      });
    }]);
  }, {}] }, {}, [1]);