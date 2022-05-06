angular.module('sntRover').filter('round', function() {
  return function(input) {
    return Math.round(input);
  };
});