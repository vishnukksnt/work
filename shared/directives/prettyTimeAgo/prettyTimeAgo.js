angular.module('prettyTimeAgoModule', [])
	.factory('timeAgo', function() {
		return {
			convert: function(seconds) {
				var sec, min, hrs;

				sec = parseInt(seconds);

				if ( isNaN(sec) ) {
					return '';
				} else {
					min = Math.floor( sec / 60 );
					hrs = Math.floor( min / 60 );

					if ( hrs > 12 ) {
						return '>12h';
					} else if ( hrs > 0 ) {
						return hrs + 'h';
					} else if ( min > 0 ) {
						return min + 'm';
					} else {
						return '1m';
					}
				}
			}
		};
	})
	.directive('prettyTimeAgo', ['timeAgo', function(timeAgo) {
		return {
			restrict: 'A',
			replace: false,
			scope: {
				prettyTimeAgo: '='
			},
			link: function(scope, element) {
				if ( scope.prettyTimeAgo !== null || scope.prettyTimeAgo !== undefined ) {
					element.html( timeAgo.convert(scope.prettyTimeAgo) );
				}
			}
		};
	}]);
