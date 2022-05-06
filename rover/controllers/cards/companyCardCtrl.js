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
    angular.module('sntRover').controller('RVCompanyCardCtrl', ['$scope', '$rootScope', 'RVCompanyCardSrv', '$timeout', 'ngDialog', '$filter', '$stateParams', 'rvPermissionSrv', 'rvFileCloudStorageSrv', function ($scope, $rootScope, RVCompanyCardSrv, $timeout, ngDialog, $filter, $stateParams, rvPermissionSrv, rvFileCloudStorageSrv) {
      BaseCtrl.call(this, $scope);

      $scope.searchMode = true;
      $scope.account_type = 'COMPANY';
      $scope.currentSelectedTab = 'cc-contact-info';
      $scope.isGlobalToggleReadOnly = !rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE');
      $scope.statisticsTabActiveView = 'summary';

      // initialize company search fields
      $scope.companySearchIntiated = false;
      $scope.companies = [];

      var presentContactInfo = {},
          createArAccountCheck = false;

      $scope.arAccountDetails = {};

      // handle tab switching in both cards
      $scope.switchTabTo = function ($event, tabToSwitch) {
        $event.stopPropagation();
        $event.stopImmediatePropagation();

        // CICO-28058 - checking whether AR Number is present or not.
        var isArNumberAvailable = !!$scope.contactInformation.account_details.accounts_receivable_number;

        if ($scope.currentSelectedTab === 'cc-contact-info' && tabToSwitch !== 'cc-contact-info') {
          if ($scope.viewState.isAddNewCard) {
            $scope.$broadcast("setCardContactErrorMessage", [$filter('translate')('COMPANY_SAVE_PROMPT')]);
          } else {
            saveContactInformation();
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
        } else if (tabToSwitch === 'wallet') {
          $scope.$broadcast("wallet");
        } else if (tabToSwitch === 'statistics') {
          $scope.$broadcast("LOAD_STATISTICS");
        }
        if (tabToSwitch === 'cc-activity-log') {
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

      $scope.shouldShowARMandatoryPopup = function () {
        var shouldEnable = ($scope.contactInformation.mandatoryFields.address_line1_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.address_line1_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.street1) : true) && ($scope.contactInformation.mandatoryFields.city_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.city_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.city) : true) && ($scope.contactInformation.mandatoryFields.postal_code_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.postal_code_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.postal_code) : true) && ($scope.contactInformation.mandatoryFields.country_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.country_mandatory.is_mandatory ? $scope.contactInformation.address_details.country_id !== '' && $scope.contactInformation.address_details.country_id !== null : true) && ($scope.contactInformation.mandatoryFields.contact_phone_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_phone_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.phone) : true) && ($scope.contactInformation.mandatoryFields.contact_email_address_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_email_address_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.address_details.email_address) && isValidEmail($scope.contactInformation.address_details.email_address) : true) && ($scope.contactInformation.mandatoryFields.e_invoice_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.e_invoice_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.e_invoice_address) : true) && ($scope.contactInformation.mandatoryFields.organization_id_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.organization_id_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.account_details.organization_id) : true) && ($scope.contactInformation.mandatoryFields.tax_id_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.tax_id_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.account_details.tax_number) : true) && ($scope.contactInformation.mandatoryFields.regd_tax_office_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.regd_tax_office_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.account_details.reg_tax_office) : true) && ($scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory ? !isEmpty($scope.contactInformation.primary_contact_details.contact_first_name) && !isEmpty($scope.contactInformation.primary_contact_details.contact_last_name) : true) && (!$scope.arAccountDetails.is_auto_assign_ar_numbers ? $scope.arAccountDetails.ar_number !== '' && $scope.arAccountDetails.ar_number !== null : true) && ($scope.contactInformation.mandatoryFields.payment_due_days_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.payment_due_days_mandatory.is_mandatory ? $scope.arAccountDetails.payment_due_days !== '' && $scope.arAccountDetails.payment_due_days !== null : true);

        return shouldEnable;
      };

      $scope.$on("saveArAccountFromMandatoryPopup", function (e, data) {
        $scope.arAccountDetails = data;
        $scope.isArTabAvailable = true;
        $scope.shouldSaveArDataFromPopup = true;
        $scope.contactInformation.account_details.accounts_receivable_number = data.ar_number;
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

      /* -------AR account starts here-----------*/

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

      $scope.deleteARAccountConfirmed = function (event) {
        var successCallbackOfdeleteArAccount = function successCallbackOfdeleteArAccount(data) {
          $scope.$emit('hideLoader');
          $scope.isArTabAvailable = false;
          $scope.$broadcast('ArAccountDeleted');
          $scope.contactInformation.account_details.accounts_receivable_number = "";

          $scope.$broadcast('setgenerateNewAutoAr', false);
          ngDialog.close();
        };
        var dataToSend = {
          "id": $scope.reservationDetails.companyCard.id
        };

        $scope.invokeApi(RVCompanyCardSrv.deleteArAccount, dataToSend, successCallbackOfdeleteArAccount);
      };

      $scope.clikedDiscardDeleteAr = function () {
        ngDialog.close();
      };
      var callCompanyCardServices = function callCompanyCardServices() {

        var param = {
          'id': $scope.reservationDetails.companyCard.id
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

      $scope.$on('companyCardAvailable', function (obj, isNew) {

        $scope.searchMode = false;
        $scope.contactInformation = $scope.companyContactInformation;
        // object holding copy of contact information
        // before save we will compare 'contactInformation' against 'presentContactInfo'
        // to check whether data changed
        $scope.currentSelectedTab = 'cc-contact-info';
        presentContactInfo = angular.copy($scope.contactInformation);
        if (isNew === true) {
          $scope.contactInformation.account_details.account_name = $scope.searchData.companyCard.companyName;
          $scope.contactInformation.address_details.city = $scope.searchData.companyCard.companyCity;
          $scope.contactInformation.account_details.account_number = $scope.searchData.companyCard.companyCorpId;
        }
        $scope.$broadcast("contactTabActive");
        $scope.$broadcast("UPDATE_CONTACT_INFO");
        $timeout(function () {
          $scope.$emit('hideLoader');
        }, 1000);
        if (!isNew) {
          callCompanyCardServices();
        }
      });

      $scope.$on("companyCardDetached", function () {
        $scope.searchMode = true;
        $scope.isArTabAvailable = false;
        $scope.$broadcast('setgenerateNewAutoAr', false);
      });

      $scope.$on("companySearchInitiated", function () {
        $scope.companySearchIntiated = true;
        $scope.companies = $scope.searchedCompanies;
        $scope.$broadcast("refreshCompaniesScroll");
      });

      $scope.$on("companySearchStopped", function () {
        $scope.companySearchIntiated = false;
        $scope.companies = [];
        $scope.$broadcast("refreshCompaniesScroll");
      });

      $scope.$on("newCardSelected", function (id, values) {
        $scope.searchMode = false;
        $scope.$emit('hideLoader');
      });
      /*
       * Toggle global button
       */
      $scope.toggleGlobalButton = function () {
        if (rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE')) {
          $scope.contactInformation.is_global_enabled = !$scope.contactInformation.is_global_enabled;
        }
      };
      /*
       * Check - update enabled or not
       */
      $scope.isUpdateEnabled = function () {
        var isDisabledFields = false;

        if ($scope.contactInformation.is_global_enabled) {
          if (!rvPermissionSrv.getPermissionValue('GLOBAL_CARD_UPDATE')) {
            isDisabledFields = true;
          }
        } else {
          if (!rvPermissionSrv.getPermissionValue('EDIT_COMPANY_CARD')) {
            isDisabledFields = true;
          }
        }
        return isDisabledFields;
      };

      /**
       * function to handle click operation on company card, mainly used for saving
       */
      $scope.companyCardClicked = function ($event) {
        $event.stopPropagation();
        if (document.getElementById("cc-contact-info") !== null && getParentWithSelector($event, document.getElementById("cc-contact-info")) && $scope.currentSelectedTab === 'cc-contact-info') {
          return;
        } else if (document.getElementById("cc-contracts") !== null && getParentWithSelector($event, document.getElementById("cc-contracts")) && $scope.currentSelectedTab === 'cc-contracts') {
          return;
        } else if (document.getElementById("cc-ar-accounts") !== null && getParentWithSelector($event, document.getElementById("cc-ar-accounts")) && $scope.currentSelectedTab === 'cc-ar-accounts') {
          return;
        } else if (!$scope.viewState.isAddNewCard && document.getElementById("company-card-header") !== null && getParentWithSelector($event, document.getElementById("company-card-header"))) {
          $scope.$emit("saveContactInformation");
          $rootScope.$broadcast("saveArAccount");
        }
        rvFileCloudStorageSrv.activeCardType = 'ACCOUNT_COMPANY';
      };

      /**
       * recieving function for save contact with data
       */
      $scope.$on("saveContactInformation", function (event) {
        event.preventDefault();
        event.stopPropagation();
        saveContactInformation();
      });

      $scope.$on("saveCompanyContactInformation", function (event) {
        event.preventDefault();
        saveContactInformation();
      });

      /**
       * a reciever function to do operation on outside click, which is generated by outside click directive
       */
      $scope.$on("OUTSIDECLICKED", function (event, targetElement) {
        event.preventDefault();

        saveContactInformation();
        $scope.checkOutsideClick(targetElement);
        $rootScope.$broadcast("saveArAccount");
        $rootScope.$broadcast("saveContract");
      });

      /**
       * success callback of save contact data
       */
      var successCallbackOfContactSaveData = function successCallbackOfContactSaveData(data) {
        $scope.reservationDetails.companyCard.id = data.id;
        $scope.contactInformation.id = data.id;
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
            $scope.viewState.pendingRemoval.cardType = "";
            if ($scope.reservationDetails.companyCard.futureReservations <= 0) {
              $scope.replaceCardCaller('company', {
                id: data.id
              }, false);
            } else {
              $scope.checkFuture('company', {
                id: data.id
              });
            }
            $scope.reservationDetails.companyCard.futureReservations = 0;
          }
          $scope.viewState.isAddNewCard = false;
          $scope.closeGuestCard();
          $scope.cardSaved();
          $scope.reservationDetails.companyCard.id = data.id;
          if ($scope.reservationData && $scope.reservationData.company) {
            $scope.reservationData.company.id = data.id;
            $scope.reservationData.company.name = $scope.contactInformation.account_details.account_name;
          }
        }
      };

      $scope.clickedSaveCard = function (cardType) {
        saveContactInformation();
      };

      /**
       * failure callback of save contact data
       */
      var failureCallbackOfContactSaveData = function failureCallbackOfContactSaveData(errorMessage) {
        $scope.errorMessage = errorMessage;
        $scope.currentSelectedTab = 'cc-contact-info';
      };

      /**
       * function used to save the contact data, it will save only if there is any
       * change found in the present contact info.
       */
      var saveContactInformation = function saveContactInformation(data) {
        var dataUpdated = false;

        data = data || $scope.contactInformation;

        // NOTE: Commission details aren't applicable for company card
        if (!angular.equals(_.omit(data, ['commission_details']), _.omit(presentContactInfo, ['commission_details']))) {
          dataUpdated = true;
          presentContactInfo = angular.copy($scope.contactInformation);
        }

        if (typeof data !== 'undefined' && (dataUpdated || $scope.viewState.isAddNewCard)) {
          var dataToSend = JSON.parse(JSON.stringify(data));

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
            successCallBack: successCallbackOfContactSaveData,
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

    angular.module('sntRover').controller('companyResults', ['$scope', '$timeout', function ($scope, $timeout) {
      BaseCtrl.call(this, $scope);
      var scrollerOptionsForGraph = {
        scrollX: true,
        click: true,
        preventDefault: false
      };

      $scope.setScroller('companyResultScroll', scrollerOptionsForGraph);

      $scope.$on("refreshCompaniesScroll", function () {
        $timeout(function () {
          $scope.refreshScroller('companyResultScroll');
        }, 500);
      });
    }]);
  }, {}] }, {}, [1]);