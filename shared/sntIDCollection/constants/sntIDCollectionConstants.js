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
								angular.module('sntIDCollection').constant('acuantCredentials', {
												username: "mubarak@stayntouch.com", // use your AssureID Connect username & password
												password: "kuuj7rsk1dkbr3kn", // use your AssureID Connect username & password
												assureIDConnectEndpoint: "https://services.assureid.net/", // set the AssureID Connect REST Endpoint URL address
												subscriptionID: "25c10b5f-45a2-43fa-9526-b2f6c39a494d",
												LicenseKey: "64C3503EC1C2"
								});
				}, {}] }, {}, [1]);