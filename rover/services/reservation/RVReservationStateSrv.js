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
		angular.module('sntRover').service('RVReservationStateService', [function () {
			var self = this;

			self.metaData = {
				rateAddons: [],
				taxDetails: []
			};

			self.reservationFlags = {
				outsideStaydatesForGroup: false,
				borrowForGroups: false,
				RATE_CHANGED: false,
				RATE_CHANGE_FAILED: false
			};

			self.bookMark = {
				lastPostedRate: null
			};

			/**
    * Method to get the addons associated with a Rate
    * @param  {Array or a String} rateId [description]
    * @return {[type]}        [description]
    */
			self.fetchAssociatedAddons = function (rateId) {
				// In case of multiple rates, rateId might come in as an array
				// In such a case, take the rate for the first night
				if (_.isArray(rateId)) {
					rateId = rateId[0];
				}
				var rateAddons = _.findWhere(self.metaData.rateAddons, {
					rate_id: rateId
				});

				if (rateAddons && rateAddons.associated_addons) {
					return rateAddons.associated_addons;
				} else {
					return null;
				}
			};

			self.updateRateAddonsMeta = function (addonInfo) {
				if (addonInfo.length === 0) {
					return false;
				}
				var rateAddons = _.findWhere(self.metaData.rateAddons, {
					rate_id: addonInfo[0].rateId
				});

				if (rateAddons) {
					rateAddons[0] = addonInfo[0];
				} else {
					self.metaData.rateAddons.push(addonInfo[0]);
				}
			};

			self.getCustomRateModel = function (id, name, type) {
				var isAllotment = type && type === 'ALLOTMENT',
				    rateIdentifier = '_CUSTOM_' + id,
				    // Default to the GROUP
				rateName = isAllotment ? "Custom Rate for Allotment " + name : "Custom Rate for Group " + name,
				    rateDescription = isAllotment ? "Custom Allotment Rate" : "Custom Group Rate";

				return {
					id: rateIdentifier,
					name: rateName,
					description: rateDescription,
					is_suppress_rate_on: false,
					is_discount_allowed_on: true,
					rate_type: {
						id: null,
						name: isAllotment ? "Allotment Rate" : "Group Rate"
					},
					deposit_policy: {
						id: null,
						name: "",
						description: ""
					},
					cancellation_policy: {
						id: null,
						name: "",
						description: ""
					},
					market_segment: {
						id: null,
						name: ""
					},
					source: {
						id: null,
						name: ""
					},
					is_member: false,
					linked_promotion_ids: []
				};
			};

			/**
    * Method to calculate the applicable amount the particular selected addon
    * @param  {string} amountType      -
    * @param  {double} baseRate        -
    * @param  {int} numAdults          -
    * @param  {int} numChildren        -
    * @return {double}                 -
    */
			self.getAddonAmount = function (amountType, baseRate, numAdults, numChildren) {
				if (amountType === "PERSON") {
					return baseRate * parseInt(parseInt(numAdults, 10) + parseInt(numChildren, 10), 10);
				}
				if (amountType === "CHILD") {
					return baseRate * parseInt(numChildren, 10);
				}
				if (amountType === "ADULT") {
					return baseRate * parseInt(numAdults, 10);
				}
				return baseRate;
			};

			/**
    * This method is used to calculate the rate amount of the room
    * @param  {Object} rateTable
    * @param  {Integer} numAdults
    * @param  {Integer} numChildren
    * @return {Float}
    */
			self.calculateRate = function (rateTable, numAdults, numChildren) {
				var baseRoomRate = numAdults >= 2 ? rateTable.double : rateTable.single;
				var extraAdults = numAdults >= 2 ? numAdults - 2 : 0;

				return baseRoomRate + extraAdults * rateTable.extra_adult + numChildren * rateTable.child;
			};

			self.calculateMultiplier = function (amountType, numAdults, numChildren) {
				var multiplier = 1; // for amount_type = flat

				if (amountType === "ADULT") {
					multiplier = numAdults;
				} else if (amountType === "CHILD") {
					multiplier = numChildren;
				} else if (amountType === "PERSON") {
					multiplier = parseInt(numChildren, 10) + parseInt(numAdults, 10);
				}
				return multiplier;
			};

			self.getApplicableAddonsCount = function (amountType, postType, postingRhythm, numAdults, numChildren, numNights, chargeFullWeeksOnly, postingMode) {
				var getTotalPostedAddons = function getTotalPostedAddons(postType, baseCount) {
					if (postingRhythm === 0) {
						return baseCount;
					} else if (postingRhythm === 1) {
						return baseCount * numNights;
					} else {
						if (typeof chargeFullWeeksOnly !== "undefined" && !!chargeFullWeeksOnly) {
							return baseCount * parseInt(numNights / postingRhythm, 10);
						} else {
							return baseCount * (parseInt(numNights / postingRhythm, 10) + 1);
						}
					}
				};

				var getNumberOfChildren = function getNumberOfChildren(numChildren, postingMode) {
					if (postingMode === 'create_group' || postingMode === 'create_allotment' || postingMode === 'group' || postingMode === 'allotments') {
						return 0;
					}
					return numChildren;
				};

				if (amountType === 'PERSON') {
					return getTotalPostedAddons(postType, numAdults + getNumberOfChildren(numChildren, postingMode));
				} else if (amountType === 'ADULT') {
					return getTotalPostedAddons(postType, numAdults);
				} else if (amountType === 'CHILD') {
					return getTotalPostedAddons(postType, numChildren);
				} else if (amountType === 'FLAT' || amountType === 'ROOM') {
					return getTotalPostedAddons(postType, 1);
				}
			};

			self.computeBaseAmount = function (taxableAmount, taxes, numAdults, numChildren) {
				var totalInclTaxPercent = 0.0,
				    totalInclTaxAmount = 0.0;

				_.each(taxes, function (tax) {
					var isInclusive = tax.is_inclusive,
					    taxData = _.findWhere(self.metaData.taxDetails, { // obtain the tax data from the metaData
						id: parseInt(tax.charge_code_id, 10)
					}),
					    amountType = taxData.amount_type,
					    multiplier = self.calculateMultiplier(amountType, numAdults, numChildren);

					if (isInclusive) {
						if (taxData.amount_symbol === '%') {
							totalInclTaxPercent += multiplier * parseFloat(taxData.amount);
						} else {
							totalInclTaxAmount += multiplier * parseFloat(taxData.amount);
						}
					}
				});
				return taxableAmount * 100 / (100 + totalInclTaxPercent) - totalInclTaxAmount;
			};

			self.setReservationFlag = function (key, status) {
				self.reservationFlags[key] = status;
			};

			self.getReservationFlag = function (key) {
				return self.reservationFlags[key];
			};

			self.shouldPostAddon = function (frequency, present, arrival, departure, chargeFullLengthOnly) {
				if (frequency === 0 && present === arrival) {
					return true;
				}
				var msPerDay = 24 * 3600 * 1000,
				    dayIndex = parseInt((new tzIndependentDate(present) - new tzIndependentDate(arrival)) / msPerDay, 10),
				    remainingDays = parseInt((new tzIndependentDate(departure) - new tzIndependentDate(present)) / msPerDay, 0);

				return dayIndex % frequency === 0 && (!chargeFullLengthOnly || chargeFullLengthOnly && remainingDays >= frequency);
			};

			self.isPostDaySelected = function (postDate, postDays) {
				if (!postDays) {
					return true;
				}
				var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
				    stayDate = new tzIndependentDate(postDate),
				    stayDay;

				stayDay = stayDate.getDay();
				return postDays[daysOfWeek[stayDay]];
			};

			self.applyDiscount = function (amount, discount, numNights) {
				if (numNights === 0) {
					numNights = 1;
				}
				if (parseFloat(amount) <= 0.0) {
					return 0;
				}
				if (discount.type === 'amount') {
					return amount - discount.value / numNights; // perNight's discount to be deducted
				} // discount.type === 'percent'
				return amount - amount * (discount.value / 100.0);
			};

			/**
    * [populateRoomArrayForAgainstDate description]
    * @param  {Array} roomTypes   [description]
    * @param  {Array} roomDetails [description]
    * @return {Array}
    */
			var populateRoomArrayForAgainstDate = function populateRoomArrayForAgainstDate(rooms, roomTypes, date, roomDetails) {
				var roomTypeId = null;

				_.each(roomTypes, function (roomType) {
					roomTypeId = roomType.id;
					if (rooms[roomTypeId] === undefined) {
						rooms[roomTypeId] = {
							id: roomTypeId,
							name: roomDetails[roomTypeId].name,
							level: roomDetails[roomTypeId].level,
							availability: true,
							rates: [],
							ratedetails: {},
							total: [],
							defaultRate: 0,
							averagePerNight: 0,
							description: roomDetails[roomTypeId].description,
							availabilityNumbers: {},
							stayTaxes: {}
						};
					}
					rooms[roomTypeId].availabilityNumbers[date] = {
						room: roomType.availability,
						group: roomType.group_availability
					};
				});
			};

			self.getAddonAmounts = function (rateAddons, arrival, departure, stayDates) {
				var addonRates = {};

				_.each(stayDates, function (dayInfo, date) {
					var numAdults = dayInfo.guests.adults,
					    numChildren = dayInfo.guests.children,
					    currentDate = date;

					addonRates[currentDate] = {};

					_.each(rateAddons, function (rateInfo) {
						var rateId = rateInfo.rate_id;

						_.each(rateInfo.associated_addons, function (addon) {
							var currentAddonAmount = parseFloat(self.getAddonAmount(addon.amount_type.value, parseFloat(addon.amount), numAdults, numChildren)),
							    shouldPostAddon = self.shouldPostAddon(addon.post_type.frequency, currentDate, arrival, departure, addon.charge_full_weeks_only);

							if (!addon.is_inclusive && shouldPostAddon) {
								if (addonRates[currentDate][rateId] === undefined) {
									addonRates[currentDate][rateId] = currentAddonAmount;
								} else {
									addonRates[currentDate][rateId] = parseFloat(addonRates[currentDate][rateId]) + currentAddonAmount;
								}
							}
						});
					});
				});
				return addonRates;
			};

			// Set the force overbook flag during borrow
			this.setForceOverbookFlagForGroup = function (value) {
				this.forceOverbookForGroups = value;
			};

			// Get the value of the force overbook flag for group borrow
			this.getForceOverbookForGroup = function () {
				return this.forceOverbookForGroups;
			};
		}]);
	}, {}] }, {}, [1]);