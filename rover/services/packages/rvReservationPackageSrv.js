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
		angular.module('sntRover').service('RVReservationPackageSrv', ['$http', '$q', 'rvBaseWebSrvV2', function ($http, $q, RVBaseWebSrvV2) {

			var that = this;

			this.getReservationPackages = function (reservationId) {
				var deferred = $q.defer();

				var url = '/staff/staycards/reservation_addons?reservation_id=' + reservationId;

				RVBaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.applyAddon = function (params) {
				var deferred = $q.defer();

				var url = '/api/reservations/update_package';

				RVBaseWebSrvV2.postJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (errorMessage) {
					deferred.reject(errorMessage);
				});
				return deferred.promise;
			};

			this.deleteAddonsFromReservation = function (dataToApi) {
				var deferred = $q.defer();

				var url = 'api/reservations/' + dataToApi.reservationId + '/delete_addons';

				RVBaseWebSrvV2.postJSON(url, dataToApi.postData).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.updateAddonPosting = function (dataToApi) {
				var deferred = $q.defer();

				var url = '/staff/staycards/update_addon_posting';

				RVBaseWebSrvV2.postJSON(url, dataToApi).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			this.parseAddonItem = function (item, forAssociated) {
				var addonItem = {};

				addonItem.id = item.id;
				addonItem.isBestSeller = item.bestseller;
				addonItem.category = item.charge_group ? item.charge_group.name : '';
				addonItem.title = item.name;
				addonItem.description = item.description;
				addonItem.price = item.amount;
				addonItem.addon_value = item.addon_value;
				addonItem.rateCurrency = item.rate_currency;
				addonItem.taxes = item.taxes;
				addonItem.stay = "";
				if (item.amount_type !== "") {
					addonItem.stay = item.amount_type.description;
				}
				if (item.post_type !== "") {
					if (addonItem.stay !== "") {
						addonItem.stay += " / " + item.post_type.description;
					} else {
						addonItem.stay = item.post_type.description;
					}
				}
				addonItem.amountType = item.amount_type;
				addonItem.postType = item.post_type;
				addonItem.amountTypeDesc = item.amount_type.description;
				addonItem.postTypeDesc = item.post_type.description;
				if (forAssociated) {
					addonItem.quantity = 1;
					addonItem.is_inclusive = item.is_inclusive;
				}
				addonItem.chargefullweeksonly = item.charge_full_weeks_only;
				addonItem.is_rate_addon = item.is_rate_addon;
				addonItem.is_allowance = item.is_allowance;
				addonItem.is_consume_next_day = item.is_consume_next_day;
				addonItem.post_day_of_the_week = item.post_day_of_the_week;
				addonItem.post_day_of_the_month = item.post_day_of_the_month;
				addonItem.frequency_type = item.frequency_type;
				addonItem.frequency = item.frequency;
				addonItem.custom_nightly_selected_post_days = item.custom_nightly_selected_post_days;

				return addonItem;
			};

			this.parseRateAddonItem = function (addon, reservationData) {
				return {
					id: addon.id,
					quantity: 1, // Rate associated Addons have quantity ONE
					title: addon.name,
					totalAmount: addon.amount, // Rate associated Addons have quantity ONE
					price_per_piece: addon.amount,
					amount_type: addon.amount_type,
					post_type: addon.post_type,
					is_inclusive: !!addon.is_inclusive,
					is_rate_addon: true,
					rate_currency: addon.rate_currency,
					custom_nightly_selected_post_days: addon.custom_nightly_selected_post_days,
					start_date: reservationData.arrivalDate,
					end_date: reservationData.departureDate
				};
			};
		}]);
	}, {}] }, {}, [1]);