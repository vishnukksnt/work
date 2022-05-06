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
		angular.module('sntIDCollection').constant('screenModes', {

			validate_subscription: 'VALIDATE_SUBSCRIPTION',
			valid_id_credentials: 'VALID_ID_CREDENTIALS',
			invalid_id_credentials: 'INVALID_ID_CREDENTIALS',

			upload_front_image: 'UPLOAD_FRONT_IMAGE',
			analysing_front_image: 'ANALYSING_FRONT_IMAGE',
			upload_front_image_failed: 'UPLOAD_FRONT_IMAGE_FAILED',
			confirm_front_image: 'CONFIRM_FRONT_IMAGE',

			upload_back_image: 'UPLOAD_BACK_IMAGE',
			analysing_back_image: 'ANALYSING_BACK_IMAGE',
			upload_back_image_failed: 'UPLOAD_BACK_IMAGE_FAILED',

			confirm_id_images: 'CONFIRM_ID_IMAGES',
			analysing_id_data: 'ANALYSING_ID_DATA',
			analysing_id_data_failed: 'ANALYSING_ID_DATA_FAILED',

			facial_recognition_failed: 'FACIAL_RECOGNTION_FAILED',
			facial_recognition_mode: 'FACIAL_RECOGNITION_MODE',
			final_id_results: 'FINAL_ID_RESULTS'
		});
	}, {}] }, {}, [1]);