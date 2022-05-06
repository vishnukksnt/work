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
    sntRover.controller('companyTravelAgentMandatoryFieldsController', ['$scope', '$timeout', 'ngDialog', function ($scope, $timeout, ngDialog) {

      BaseCtrl.call(this, $scope);

      $scope.setScroller('companyTravelAgentMandatory');

      $scope.closeDialog = function () {

        $scope.$emit("UPDATE_MANDATORY_POPUP_OPEN_FLAG");
        ngDialog.close();
      };

      $scope.saveCoTaMandatoryData = function () {

        $scope.$emit("saveContactInformation");
        $scope.$emit("saveArAccountFromMandatoryPopup", $scope.arAccountDetails);
        $scope.closeDialog();
      };

      $scope.shouldEnableSubmitButton = function () {
        return $scope.shouldShowARMandatoryPopup();
      };

      var init = function init() {
        $scope.errorMessage = angular.isUndefined($scope.mandatoryErrorMessage) ? '' : $scope.mandatoryErrorMessage;
        $timeout(function () {
          $scope.refreshScroller('companyTravelAgentMandatory');
        }, 200);

        if (angular.isUndefined($scope.contactInformation.e_invoice_address)) {
          $scope.contactInformation.e_invoice_address = null;
        }

        if (($scope.contactInformation.address_details.street1 === null || $scope.contactInformation.address_details.street1 === '') && ($scope.contactInformation.mandatoryFields.address_line1_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.address_line1_mandatory.is_mandatory)) {
          $scope.shouldShowAddress = true;
        }

        if (($scope.contactInformation.address_details.city === null || $scope.contactInformation.address_details.city === '') && ($scope.contactInformation.mandatoryFields.city_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.city_mandatory.is_mandatory)) {
          $scope.shouldShowCity = true;
        }

        if (($scope.contactInformation.address_details.postal_code === null || $scope.contactInformation.address_details.postal_code === '') && ($scope.contactInformation.mandatoryFields.postal_code_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.postal_code_mandatory.is_mandatory)) {
          $scope.shouldShowPostalCode = true;
        }

        if (($scope.contactInformation.address_details.country_id === null || $scope.contactInformation.address_details.country_id === '') && ($scope.contactInformation.mandatoryFields.country_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.country_mandatory.is_mandatory)) {
          $scope.shouldShowCountry = true;
        }

        if (($scope.contactInformation.address_details.phone === null || $scope.contactInformation.address_details.phone === '') && ($scope.contactInformation.mandatoryFields.contact_phone_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_phone_mandatory.is_mandatory)) {
          $scope.shouldShowPhone = true;
        }

        if (($scope.contactInformation.address_details.email_address === null || $scope.contactInformation.address_details.email_address === '') && ($scope.contactInformation.mandatoryFields.contact_email_address_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_email_address_mandatory.is_mandatory)) {
          $scope.shouldShowEmail = true;
        }

        if (($scope.contactInformation.e_invoice_address === null || $scope.contactInformation.e_invoice_address === '') && ($scope.contactInformation.mandatoryFields.e_invoice_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.e_invoice_mandatory.is_mandatory)) {
          $scope.shouldShowEInvoice = true;
        }

        if (($scope.contactInformation.account_details.organization_id === null || $scope.contactInformation.account_details.organization_id === '') && ($scope.contactInformation.mandatoryFields.organization_id_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.organization_id_mandatory.is_mandatory)) {
          $scope.shouldShowOrganization = true;
        }

        if (($scope.contactInformation.account_details.tax_number === null || $scope.contactInformation.account_details.tax_number === '') && ($scope.contactInformation.mandatoryFields.tax_id_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.tax_id_mandatory.is_mandatory)) {
          $scope.shouldShowTaxNumber = true;
        }

        if (($scope.contactInformation.account_details.reg_tax_office === null || $scope.contactInformation.account_details.reg_tax_office === '') && ($scope.contactInformation.mandatoryFields.regd_tax_office_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.regd_tax_office_mandatory.is_mandatory)) {
          $scope.shouldShowRegisteredTaxOffice = true;
        }

        if (($scope.contactInformation.primary_contact_details.contact_first_name === null || $scope.contactInformation.primary_contact_details.contact_first_name === '') && ($scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory)) {
          $scope.shouldShowPrimaryContactFirstName = true;
        }

        if (($scope.contactInformation.primary_contact_details.contact_last_name === null || $scope.contactInformation.primary_contact_details.contact_last_name === '') && ($scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.contact_name_mandatory.is_mandatory)) {
          $scope.shouldShowPrimaryContactLastName = true;
        }

        if (($scope.arAccountDetails.payment_due_days === null || $scope.arAccountDetails.payment_due_days === '') && ($scope.contactInformation.mandatoryFields.payment_due_days_mandatory.is_mandatory_on_ar_account_creation || $scope.contactInformation.mandatoryFields.payment_due_days_mandatory.is_mandatory)) {
          $scope.shouldShowPayDays = true;
        }

        if (!$scope.arAccountDetails.is_auto_assign_ar_numbers) {
          $scope.shouldShowArNumber = true;
        }
      };

      init();
    }]);
  }, {}] }, {}, [1]);