angular.module('snt.transitionManager',
    ['ui.router'])
    .run(['$rootScope', '$transitions', 'transitions', '$log', '$window',
        function ($rootScope, $transitions, transitionsSrv, $log, $window) {

            $transitions.onFinish({}, function (transition) {
                var deepIndex;

                if (transition.from().name === transition.to().name) {
                    $log.info('State refresh observed');
                } else if (!transitionsSrv.isInitial() &&
                    transitionsSrv.isBackNavigation(transition)) {
                    transitionsSrv.pop();
                } else if ((deepIndex = transitionsSrv.isDeep(transition)) >= 0) {
                    transitionsSrv.clearLoop(deepIndex + 1);
                } else {
                    transitionsSrv.push(transition);
                }

                if ($window['dataLayer']) {
                    $window['dataLayer'].push({
                        event: 'sntPageView',
                        attributes: {
                            route: transition.to().name.replace(/\./g, '/'),
                            stateParams: transition.params()
                        }
                    });
                }

                transitionsSrv.debug();
            });

            $transitions.onStart({}, function (transition) {
                if (!transitionsSrv.isInitial() &&
                    transitionsSrv.isBackNavigation(transition)) {
                    transition.options().custom['isBack'] = true;
                }

                if (transition.options().custom && transition.options().custom['fromMenuBar']) {
                    transitionsSrv.reset();
                }
            });

        }
    ])
    .service('transitions', ['$log',
        function ($log) {
            var service = this,
                transitions = [];

            /**
             * This method helps to skip loop checks for the initial transition
             * @returns {boolean} true if there aren't any transitions in the stack
             */
            service.isInitial = function () {
                return !transitions.length;
            };

            /**
             * Adds the passed transition to the stack
             * @param {Transition} transition - the most recent transition to be added to the stack
             * @returns {number} depth of the navigation
             */
            service.push = function (transition) {
                transitions.push(_.extend({}, transition));
                return transitions.length;
            };

            /**
             * Removes the last transaction from the stack
             * @returns {number} depth of the navigation
             */
            service.pop = function () {
                transitions.pop();
                return transitions.length;
            };

            /**
             * Get's the transition requested or last transition by default
             * @param {number} idx - index of required transition
             * @returns {Transition} Requested transition or the Last
             */
            service.get = function (idx) {
                idx = idx || transitions.length - 1;

                return transitions[idx];
            };

            /**
             * Resets the transitions array when the user jumps to a module from the menu
             * @returns {undefined} void
             */
            service.reset = function () {
                transitions = transitions.splice(0, 1);
            };

            /**
             * Splices the transition array - used to clear loops
             * @param {number} transitionIndex - start index of the transition sequence that would cause a loop (got from isDeep method)
             * @returns {number} depth of the navigation
             */
            service.clearLoop = function (transitionIndex) {
                transitions.splice(transitionIndex);
                return transitions[transitionIndex];
            };

            /**
             * Checks if the new transition would create a loop and if yes, returns the index
             * @param {Transition} transition  - upcoming transition
             * @returns {number} index of the deep state / -1
             */
            service.isDeep = function (transition) {
                return transitions.map(
                    function (transition) {
                        return transition.to().name;
                    }
                ).indexOf(transition.to().name);
            };

            /**
             * Checks if a transition is a reverse of the last transition in the stack
             * @param {Transition} next - the upcoming transition
             * @returns {boolean} true if it's a reverse of the last transition in the stack
             */
            service.isBackNavigation = function (next) {
                var prev = service.get();

                return next.from().name === prev.to().name &&
                    prev.from().name === next.to().name;
            };

            /**
             * This method is used to log the navigation crumbs
             * @returns {undefined}
             */
            service.debug = function () {
                var style = 'background: green; color: white; display: block;';

                $log.info('%c' + transitions.map(function (transition) {
                    return transition.to().name;
                }).join('--/--'), style);
            };
        }
    ]);
