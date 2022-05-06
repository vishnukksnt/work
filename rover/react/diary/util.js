'use strict';

var DiaryLib = window.DiaryLib || Object.create(null);

DiaryLib.Models = DiaryLib.Models || Object.create(null);
DiaryLib.Util = DiaryLib.Util || Object.create(null);

function Model(params) {
	var defDec = function defDec(val) {
		return {
			enumerable: true,
			writable: true,
			value: val
		};
	},
	    hop = Object.prototype.hasOwnProperty;

	if (!(this instanceof Model)) {
		return new Model(params);
	}

	Object.defineProperties(this, {
		isUpdating: defDec(false),
		isResolved: defDec(false),
		isDirty: defDec(false)
	});

	for (var k in params) {
		if (hop.call(params, k)) {
			this[k] = params[k];
		}
	}
}

Model.prototype = {
	constructor: Model,
	reset: function reset() {
		this.isUpdating = false;
		this.isResolved = false;
		this.isDirty = false;
	}
};

function Time(obj) {
	if (!(this instanceof Time)) {
		return new Time(obj);
	}

	obj = function (val) {
		var cnv = {};

		if (val.toFixed) {
			cnv.milliseconds = val % 1000;
			cnv.seconds = Math.floor(val / 1000);
			cnv.minutes = Math.floor(val / 60000);
			cnv.hours = Math.floor(val / 3600000);

			return cnv;
		}

		return val;
	}(obj);

	(function (time_params) {
		var defaultDesc = function defaultDesc(val) {
			return {
				enumerable: true,
				writable: true,
				value: val
			};
		};

		Object.defineProperties(this, {
			milliseconds: defaultDesc(time_params.milliseconds || 0),
			seconds: defaultDesc(time_params.seconds || 0),
			minutes: defaultDesc(time_params.minutes || 0),
			hours: defaultDesc(time_params.hours || 0)
		});
	}).call(this, obj);
}
Time.prototype.convertToReferenceInterval = function (interval) {
	var time_shift;

	time_shift = (this.minutes / interval).toFixed() * interval;

	if (this.minutes > 45.0) {
		this.hours += 1;
		this.minutes = 0;
	} else {
		this.minutes = time_shift;
	}

	this.seconds = 0;
	this.milliseconds = 0;

	return this;
};
Time.prototype.getOffsetFromReference = function (reference_time) {
	var sec_delta;

	if (reference_time instanceof Time) {
		sec_delta = this.getTotalMilliseconds() - reference_time.getTotalMilliseconds();
	} else {
		throw new Error('invalid parameter');
	}

	return sec_delta;
};
Time.prototype.getTotalMilliseconds = function () {
	return (this.hours * 360 + this.minutes * 6 + this.seconds) * 10000 + this.milliseconds;
};
Time.prototype.convertMillisecondsToTime = function (ms) {
	return new Time(ms);
};
Time.prototype.isAM = function () {
	return this.hours < 12;
};
Time.prototype.AMPM = function () {
	return this.isAM() ? 'AM' : 'PM';
};
Time.prototype.padZeroes = function (time) {
	time = +time;
	return time < 10 ? '0' + time : time;
};
Time.prototype.toString = function (asAMPM) {
	var hours = this.padZeroes(this.hours),
	    min = this.padZeroes(this.minutes),
	    ampm = '';

	if (asAMPM) {
		hours = hours % 12;

		if (hours === 0) {
			hours = 12;
		}

		ampm = this.AMPM();
	}

	return hours + ':' + min + ampm;
};
Time.prototype.toReservationFormat = function (asObject) {
	var ret;

	ret = {
		hh: this.padZeroes(this.hours % 12),
		mm: this.padZeroes(this.minutes),
		amPM: this.AMPM()
	};

	if (asObject) {
		return ret;
	} else {
		return ret.hh + ':' + ret.mm + ' ' + ret.amPM;
	}
};

Time.prototype.toHourAndMinute = function (seperator, format) {
	var ret;

	if (typeof format === 'undefined') {
		format = 12;
	}
	if (typeof seperator === 'undefined') {
		seperator = ":";
	}
	ret = {
		hh: this.padZeroes(this.hours % format),
		mm: this.padZeroes(this.minutes)
	};
	return ret.hh + seperator + ret.mm;
};

Time.prototype.constructor = Time;

String.prototype.toTimeComponent = function (time) {
	var pos = time.indexOf(':'),
	    hours,
	    minutes;

	if (pos > -1) {
		hours = time.substr(0, pos);

		if (pos < time.length) {
			minutes = time.substr(pos + 1);
		}
	}

	if (hours && minutes) {
		return Time({ hours: hours, minutes: minutes });
	}

	return;
};

Date.prototype.toComponents = function () {
	var __DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	    __MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	    __MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	return {
		date: {
			day: this.getDate(),
			weekday: __DAYS[this.getDay()],
			month: this.getMonth(),
			monthName: __MONTHS[this.getMonth()],
			monthNameShort: __MONTHS_SHORT[this.getMonth()],
			year: this.getFullYear(),
			toDateString: function toDateString() {
				return this.year + '-' + (this.month + 1) + '-' + (this.day.length < 2 ? '0' : '') + this.day;
			},
			fromDate: function fromDate() {
				var tmp = this.toLocaleDateString().replace(/\//g, '-').split('-').reverse();

				return tmp.shift() + '-' + temp.reverse().join('-');
			},
			toShortDateString: function toShortDateString() {
				return this.monthNameShort + ' ' + (this.day < 10 ? '0' : '') + this.day;
			}
		},
		time: new Time({
			milliseconds: this.getMilliseconds(),
			seconds: this.getSeconds(),
			minutes: this.getMinutes(),
			hours: this.getHours()
		})
	};
};