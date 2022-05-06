
var sntRover = angular.module('sntRover', [
		'ui.router',
		'ui.utils',
		'ng-iscroll',
		'ngDialog',
		'ngAnimate',
		'ngSanitize',
		'pascalprecht.translate',
		'ui.date',
		'dashboardModule',
		'companyCardModule',
		'stayCardModule',
		'EndOfDayModule',
		'SocialLobbyModule',
		'housekeepingModule',
		'reportsModule',
		'diaryModule',
		'groupModule',
		'allotmentModule',
		'accountsModule',
		'rateManagerModule',
		'FinancialsModule',
		'cacheVaultModule',
		'documentTouchMovePrevent',
		'divTouchMoveStopPropogate',
		'sharedHttpInterceptor',
		'orientationInputBlurModule',
		'ngDragDrop',
		'iscrollStopPropagation',
		'ngClassWithoutAnimation',
		'clickTouch',
		'oc.lazyLoad',
		'limitInputRange',
		'iscrollStopPropagation',
		'emitWhen',
		'ng-augment-native-scroll',
        'sntActivityIndicator',
        'overBookingModule',
		'guestCardModule',
		'houseEventsModule',
        'snt.transitionManager',
        'sntCurrencyFilter',
        'sntCanvasUtil',
		'snt.utils',
		'ui.sortable',
		'restrictMinVal',
		'sntPayConfig'
	]);

sntRover.config([
	'$httpProvider',
	'ngDialogProvider',
	'$provide',
	'$locationProvider',
	'$qProvider',
	function($httpProvider, ngDialogProvider, $provide, $locationProvider, $qProvider) {

        $locationProvider.html5Mode(true);
        $qProvider.errorOnUnhandledRejections(false);

        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        // $provide.decorator('$browser', ['$delegate', function ($delegate) {
        //     $delegate.onUrlChange = function () {};
        //     $delegate.url = function () { return ""};
        //     return $delegate;
        // }]);


		// adding shared http interceptor, which is handling our webservice errors & in future our authentication if needed
		$httpProvider.interceptors.push('sharedHttpInterceptor');
		$httpProvider.interceptors.push('sharedSessionTimeoutInterceptor');
		
		$qProvider.errorOnUnhandledRejections(false);

	    ngDialogProvider.setDefaults({
	        appendTo: '.root-view'
	    });

	    // making sure that angular currency filter will not
	    // transform -13 -> ($13), and keep it like -> -$13
	    // SF: http://stackoverflow.com/questions/17441254/why-angularjs-currency-filter-formats-negative-numbers-with-parenthesis/30122327#30122327
	    $provide.decorator('$locale', ['$delegate', function($delegate) {
			if ($delegate.id == 'en-us') {
				$delegate.NUMBER_FORMATS.PATTERNS[1].negPre = '-\u00A4';
				$delegate.NUMBER_FORMATS.PATTERNS[1].negSuf = '';
			}
			return $delegate;
		}]);
	}
]);


/**
 * 	NOTE: Please don't remove $$animateJs dependency. This is done on purpose
 *  This was done as a fix for a similar problem https://github.com/angular/angular.js/issues/14291
 */

sntRover.run([
    '$rootScope',
    '$state',
    '$stateParams',
    'RVHkRoomStatusSrv',
    '$$animateJs',
    '$log',
    '$window',
    '$trace',
    '$transitions',
	'$timeout',
	'$document',
	'rvAngularIframeHelperSrv',
    function ($rootScope, $state, $stateParams, RVHkRoomStatusSrv, $$animateJs, $log, $window, $trace, $transitions, $timeout, $document, rvAngularIframeHelperSrv) {
        var hidden, visibilityChange;

        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.setPrevState = {};
        $rootScope.setNextState = {};

        if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
            hidden = 'hidden';
            visibilityChange = 'visibilitychange';
        } else if (typeof document.msHidden !== 'undefined') {
            hidden = 'msHidden';
            visibilityChange = 'msvisibilitychange';
        } else if (typeof document.webkitHidden !== 'undefined') {
            hidden = 'webkitHidden';
            visibilityChange = 'webkitvisibilitychange';
        }

		/**
		*	if this is true animation will be revesed, no more checks
		* 	keep track of the previous state and params
		*
		*	@private
		*/
		var $_mustRevAnim = false,
			$_prevStateName = '',
			$_prevStateParam = {},
			$_prevStateTitle = '';

		var StateStore = function(stateName, checkAgainst) {
			var self = this;

			this.stateName    = stateName;
			this.checkAgainst = checkAgainst;

			this.fromState = false;
			this.fromParam = {};
			this.fromTitle = '';

			this.update = function(toState, fromState, fromParam) {
				if ( toState !== this.stateName ) {
					return;
				}

				for (var i = 0; i < self.checkAgainst.length; i++) {
					if ( self.checkAgainst[i] === fromState ) {
						self.fromState = fromState;
						self.fromParam = fromParam;
						self.fromTitle = $rootScope.getPrevStateTitle();
						break;
					}
				}
			};

			this.getOriginState = function() {
				var ret, name, param, title;

				if (self.fromState) {
					name  = self.fromState;
					param = angular.copy(self.fromParam);
					title = self.fromTitle;

					ret = {
						'name': name,
						'param': param,
						'title': title
					};

					this.fromState = false;
					this.fromParam = {};
					this.fromTitle = '';
				} else {
					return false;
				}

				return ret;
			};

			this.useOriginal = function(title) {
				return title === self.fromTitle ? false : self.fromTitle ? true : false;
			};
		};

		$rootScope.diaryState = new StateStore('rover.diary', ['rover.dashboard.manager', 'rover.reservation.search']);


		var $_backTitleDict = {
			'SHOWING DASHBOARD': 'DASHBOARD',
			'RESERVATIONS': 'CREATE RESERVATION'
		};

		var $_savePrevStateTitle = function(title) {
			var upperCase = title.toUpperCase();

			$_prevStateTitle = $_backTitleDict[upperCase] ? $_backTitleDict[upperCase] : title;
		};

		$rootScope.getPrevStateTitle = function() {
			return $_prevStateTitle;
		};

		$rootScope.getPrevStateName = function() {
			return $_prevStateName;
		};

		$rootScope.getPrevStateParam = function() {
			return $_prevStateParam;
		};


		/**
		*	revAnimList is an array of objects that holds
		*	state name sets that when transitioning
		*	the transition animation should be reversed
		*
		*	@private
		*/
		var $_revAnimList = [{
			fromState: 'rover.housekeeping.roomDetails',
			toState: 'rover.housekeeping.roomStatus'
		}, {
			fromState: 'rover.reservation.staycard.billcard',
			toState: 'rover.reservation.staycard.reservationcard.reservationdetails'
		}, {
			fromState: 'rover.staycard.nights',
			toState: 'rover.reservation.staycard.reservationcard.reservationdetails'
		}, {
			fromState: 'rover.companycarddetails',
			toState: 'rover.companycardsearch'
		}, {
			fromState: 'rover.reservation.staycard.roomassignment',
			toState: 'rover.reservation.staycard.reservationcard.reservationdetails'
		}];


		/**
		*	A method on the $rootScope to determine if the
		*	slide animation during stateChange should run in reverse or forward
		*	Note: this is overridden when state change is via pressing back button action
		*
		*	@private
		*	@param {string} fromState - name of the fromState
		*	@param {string} toState - name of the toState
		*
		*	@return {boolean} - to indicate reverse or not
		*/
		var $_shouldRevDir = function(fromState, toState) {
			for (var i = 0, j = $_revAnimList.length; i < j; i++) {
				if ( $_revAnimList[i].fromState === fromState && $_revAnimList[i].toState === toState ) {
					return true;
					break;
				}
			}

			return false;
		};


		/**
		*	A very simple methods to go back to the previous state
		*
		*	By default it will use the (saved) just previous state - '$_prevStateName', '$_prevStateParam'
		*	and always do the slide animation in reverse, unless overridden by callee.
		*
		*	Default behaviour can be overridden in two ways, by setting values to '$rootScope.setPrevState' in ctrl`:
		*	1. Pass in a callback with its scope - This callback will be responsible for the state change (total control)
		*	2. Pass in the state name and param - This will load the passed in state with its param
		*
		* 	@param {Object} $rootScope.setPrevState - Uses this object as param which is set by the current state contoller
		*/
		$rootScope.loadPrevState = function() {

			// since these folks will be created anyway
			// so what the hell, put them here
			var options = $rootScope.setPrevState,
				name    = !!options.name ? options.name : $_prevStateName,
				param   = !!options.name && !!options.param ? options.param :
							(!!$_prevStateParam ? angular.copy($_prevStateParam) : {}),
				reverse = typeof options.reverse === 'boolean' ? true : false;

			// angular.copy is used above because an error was consoled
			// that param.useCache can not be updated,
			// Causing back navigation from D-diary to error out.

			// if currently disabled, return
			if ( options.disable ) {
				return;
			}

			// ok boys we are gonna sit this one out
			// 'scope.callback' is will be running the show
			if ( !!options.scope ) {

				// NOTE: if the controller explicitly says there is no actual state change
				// $_mustRevAnim must be set false, else check further
				$_mustRevAnim = options.noStateChange ? false : (reverse ? options.reverse : true);

				options.scope[options.callback]();
				return;
			}

			// check necessary as we can have a case where both can be null
			if ( !!name ) {
				$_mustRevAnim = reverse ? options.reverse : true;

                // With the previous version of ui-router, this useCache state param was
                // set to true in case of a back navigation in the $rootScope.loadPrevState method of rvApp.js file
                // With the upgraded ui-router the stateparams cannot be changed in the middle of a transition
                param = param || {};
                param.useCache = true;

				$state.go( name, param );
			}
		};

		$rootScope.returnBack = false;
		$rootScope.isReturning = function() {
			return $rootScope.returnBack;
		};


		$transitions.onFinish({}, function (transition) {
            // this must be reset with every state change
            // invidual controllers can then set it
			// with its own desired values
			// While paginating through the report records, we don't have an option to 
			// set prev state again in the controller , so excluding that case
			if ( !(transition.from('name').name === 'rover.reports.show' && transition.to('name').name === 'rover.reports.show')) {
				$rootScope.setPrevState = {};
			}

        });

		/**
		*	For certain state transitions
		*	the transition animation must be reversed
		*
		*	This is achived by adding class 'return-back'
		*	to the imediate parent of 'ui-view'
		*	check this template to see how this class is applied:
		*	app/assets/rover/partials/staycard/rvStaycard.html
		*/
        $transitions.onSuccess({}, function(transition) {
            var fromState = transition.from(),
                toState = transition.to(),
                fromParams = transition.params('from');


	        if (fromState.name === 'rover.reservation.staycard.roomassignment' && toState.name === 'rover.diary') {
	            // cico-13697, fix until proper workflow routes are developed
	            return;
	        }

	        // Deciding when to clear HK filters
	        var resetHkFilter = function() {
	        	RVHkRoomStatusSrv.currentFilters = RVHkRoomStatusSrv.initFilters();
	        	RVHkRoomStatusSrv.isInitialLoad = true;
	        	RVHkRoomStatusSrv.defaultViewState = null;
	        	RVHkRoomStatusSrv.resetRoomTypes();
	        	localStorage.removeItem( 'roomListScrollTopPos' );

	        	// please keep this log
	        	console.log( 'HK.Filters.Cleared' );
	        };

	        if ( 'rover.housekeeping.roomStatus' == fromState.name ) {
	        	if ( 'rover.housekeeping.roomDetails' != toState.name ) {
	        		resetHkFilter();
	        	}
	        } else if ( 'rover.housekeeping.roomDetails' == fromState.name ) {
	        	if ( 'rover.housekeeping.roomStatus' != toState.name ) {
	        		resetHkFilter();
	        	}
	        }


			// FOR DEV WORK
			// PLEASE DO NO REMOVE THIS LINE, U CAN COMMENT IT OUT
			// PLEASE DO NO REMOVE THIS LINE, U CAN COMMENT IT OUT
			// console.debug( '[%s %O] >>> [%s %O]', fromState.name, fromParams, toState.name, toParams );
			/**
			 * I don't know who you are. I don't know what you want.
			 * If you are looking for ransom I can tell you I don't have money, but what I do have are a very particular set of skills.
			 * Skills I have acquired over a very long career. Skills that make me a nightmare for people like you.
			 * If you let my code stay or comment, that'll be the end of it.
			 * I will not look for you, I will not pursue you, but if you don't...
			 * I will look for you, I will find you and I will kill you.
			 */

			// choose slide animation direction
			if ( $_mustRevAnim || $_shouldRevDir(fromState.name, toState.name) ) {
				$rootScope.returnBack = true;
			} else {
				$rootScope.returnBack = false;
			}

			// reset this flag
			$_mustRevAnim = false;


			// saving the prevState name and params
			$_prevStateName  = fromState.name;
			$_prevStateParam = fromParams;

			if (toState.name === 'rover.diary') {
				$rootScope.$broadcast('setDiaryBackButton');
			}
			if (toState.name === 'rover.nightlyDiary') {
				$rootScope.$broadcast('POLL_N_DIARY_AUTO_ASSIGN_STATUS');
			}
			if (toState.name === 'rover.diary' && $rootScope.hotelDiaryConfig.mode !== 'FULL') {
				$rootScope.$broadcast('POLL_D_DIARY_AUTO_ASSIGN_STATUS');
			}
		});

		/**
		*	before the state can change, we need to inform the assiciated service that we are returning back
		*	based on this info the service will return the previously cached data, rather than requesting the server

		*	on such request the service will look for certain values in $vault,
		*	if they are avaliable the cached data will be updated before returning the data
		*/
		$transitions.onStart({}, function(transition) {
            var fromState = transition.from(),
                toState = transition.to(),
                fromParams = transition.params('from'),
                toParams = transition.params('to');

            if (rvAngularIframeHelperSrv.loadStateInNewApp(toState, toParams)) {
            	$rootScope.$emit('NAVIGATE_TO_ANGULAR_APP', {
                    route: rvAngularIframeHelperSrv.getConvertedState(toState, toParams).ng2route,
                    params: toParams
                });
                return;
            }

			// reset this flag
			$rootScope.returnBack = false;

			// capture the prev state document title
			if (fromState.name === 'rover.reservation.staycard.roomassignment' && toState.name === 'rover.diary') {
	            // cico-13697, fix until proper workflow routes are developed
	            return;
	        }
	        $_savePrevStateTitle(document.title);

			if ( $rootScope.setNextState.data ) {
				_.extend(toParams, $rootScope.setNextState.data);
				$rootScope.setNextState = {};
			}
			if (fromState.name === 'rover.nightlyDiary') {
				$rootScope.$broadcast('STOP_N_DIARY_AUTO_ASSIGN_STATUS_POLLING');
			}
			if (fromState.name === 'rover.diary' && $rootScope.hotelDiaryConfig.mode !== 'FULL') {
				$rootScope.$broadcast('STOP_D_DIARY_AUTO_ASSIGN_STATUS_POLLING');
			}

			$rootScope.diaryState.update(toState.name, fromState.name, fromParams);
			// CICO-84327 - Hide the room indicator popup while transition to other states
			$('.room-indicator-popup').addClass('hidden');
			$rootScope.lastShownRoomIdForIndicatorPopup = null;
		});

		document.addEventListener("OBSERVE_FOR_SWIPE", function() {
            $rootScope.$broadcast("RESUME_OBSERVE_FOR_SWIPE_RESETS");
        });

        document.addEventListener(visibilityChange, function () {
            if (!document[hidden] && sntapp.desktopCardReader.isActive) {

                $log.info('invoke... sntapp.desktopCardReader.startReader');
                sntapp.desktopCardReader.startReader();
            }
        });

        $window.onfocus = function () {
            if (sntapp.desktopCardReader.isActive) {

                $log.info('focus... sntapp.desktopCardReader.startReader');
                sntapp.desktopCardReader.startReader();
            }
        };

        FastClick.attach(document.body);

        // TODO: 49259 Disbale the transition traces!
        // $trace.enable('TRANSITION');

		/**
		 * Show the room indicator popup with the component rooms
		 */
		var showRoomIndicatorPopupListener = $rootScope.$on('SHOW_ROOM_INDICATOR_POPUP', function (event, data) {
			$('.room-indicator-popup').removeClass('hidden');
			$('.room-indicator-popup').removeClass('left-side');
			$rootScope.selectedRoom = data.payload;
			var indicatorType = data.payload.indicatorType,
				idPrefix = '';

			if (indicatorType === 'CONNECTING-ROOMS') {
				idPrefix = indicatorType.toLowerCase();
			} else if (indicatorType === 'SUITE') {
				idPrefix = indicatorType.toLowerCase();
			}

			$timeout(function () {
				var $this = $('#' + idPrefix + '-' + data.payload.clickedRoomId),
					popup = $('.room-indicator-popup'),
					left = $this.offset().left + $this.width() + 20,
					top = $this.height() + $this.offset().top - popup.height() + 10,
					type = '';

				if ($rootScope.selectedRoom.connectingRooms.length) {
					type = 'connected';
				}

				$rootScope.roomIndicatorType = type;

				if (data.payload.isFromRoomAssignment && window.innerWidth < 1024) {
					$('.room-indicator-popup').addClass('left-side');
					left = $this.offset().left - popup.width() - 10;
				}

				if ( top < 0 ) {
					top = $this.offset().top;
					$('.room-indicator-popup').addClass('top');
				} else {
					$('.room-indicator-popup').removeClass('top');
				}
				
				popup
					.css({
						left: left + "px",
						top: top + "px"
					})
					.removeClass("connected")
					.removeClass("suite")
					.addClass(type);

			}, 10);

		});

		/**
		 * Handles click inside room indicator popup
		 */
		$rootScope.onRoomIndicatorPopupClick = function () {
			$('.room-indicator-popup').addClass('hidden');
			$rootScope.selectedRoom = null;
			$rootScope.lastShownRoomIdForIndicatorPopup = null;
		};

		var hideRoomIndicatorPopupListener = $rootScope.$on('HIDE_ROOM_INDICATOR_POPUP', function () {
			$rootScope.onRoomIndicatorPopupClick();
		});

		$rootScope.$on('$destroy', hideRoomIndicatorPopupListener);
		$rootScope.$on('$destroy', showRoomIndicatorPopupListener);

		$document.on('click', function (event) {
			var specifiedElement = document.getElementById('room-indicator-popup');

			var isClickInside = specifiedElement && specifiedElement.contains(event.target);

			if (!isClickInside) {
				$('.room-indicator-popup').addClass('hidden');
				$rootScope.lastShownRoomIdForIndicatorPopup = null;
			}

		});
		
		
	}
]);
