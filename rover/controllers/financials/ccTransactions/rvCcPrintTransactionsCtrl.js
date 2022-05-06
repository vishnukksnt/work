'use strict';

sntRover.controller('RVCcPrintTransactionsController', ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
  BaseCtrl.call(this, $scope);

  /** Code for PRINT BOX drawer common Resize Handler starts here .. **/
  var resizableMinHeight = 0;
  var resizableMaxHeight = 90;

  $scope.eventTimestamp = '';
  $scope.data.printBoxHeight = resizableMinHeight;

  // Checks height on drag-to-resize and opens or closes drawer.
  var heightChecker = function heightChecker(height) {
    if (height > 5) {
      $scope.data.isDrawerOpened = true;
      $scope.data.printBoxHeight = height;
      $scope.$apply();
    } else if (height < 5) {
      $scope.closeDrawer();
    }
  };
  // Drawer resize options.

  $scope.resizableOptions = {
    minHeight: resizableMinHeight,
    maxHeight: resizableMaxHeight,
    handles: 's',
    resize: function resize(event, ui) {
      var height = $(this).height();

      heightChecker(height);
    },
    stop: function stop(event, ui) {
      var height = $(this).height();

      preventClicking = true;
      $scope.eventTimestamp = event.timeStamp;
      heightChecker(height);
    }
  };

  // To handle click on drawer handle - open/close.
  $scope.clickedDrawer = function ($event) {
    $event.stopPropagation();
    $event.stopImmediatePropagation();
    if (getParentWithSelector($event, document.getElementsByClassName("ui-resizable-handle")[0])) {
      if (parseInt($scope.eventTimestamp)) {
        if ($event.timeStamp - $scope.eventTimestamp < 2) {
          return;
        }
      }
      if ($scope.data.printBoxHeight === resizableMinHeight || $scope.data.printBoxHeight === resizableMaxHeight) {
        if ($scope.data.isDrawerOpened) {
          $scope.closeDrawer();
        } else {
          $scope.openDrawer();
        }
      } else {
        // mid way click : close guest card
        $scope.closeDrawer();
      }
    }
  };

  // To open the Drawer
  $scope.openDrawer = function () {
    $scope.data.printBoxHeight = resizableMaxHeight;
    $scope.data.isDrawerOpened = true;
  };

  // To close the Drawer
  $scope.closeDrawer = function () {
    $scope.data.printBoxHeight = resizableMinHeight;
    $scope.data.isDrawerOpened = false;
  };

  $scope.$on("CLOSEPRINTBOX", function () {
    $scope.closeDrawer();
  });

  var printMode = "L";
  // Add the print orientation before printing
  var addPrintOrientation = function addPrintOrientation() {
    var orientation = 'portrait';

    switch ($scope.data.activeTab) {
      case 0:
        orientation = 'landscape';
        printMode = "L";
        break;
      case 1:
        orientation = 'landscape';
        printMode = "L";
        break;
      default:
        orientation = 'portrait';
        printMode = "P";
        break;
    }

    $('head').append("<style id='print-orientation'>@page { size: " + orientation + "; }</style>");
  };

  // Add the print orientation after printing
  var ccTransactionsPrintCompleted = function ccTransactionsPrintCompleted() {
    $('#print-orientation').remove();
  };

  // To print the screen
  $scope.printButtonClick = function () {

    // add the orientation
    addPrintOrientation();

    /*
     *  ======[ READY TO PRINT ]======
     */
    // this will show the popup with full bill
    $timeout(function () {
      /*
       *  ======[ PRINTING!! JS EXECUTION IS PAUSED ]======
       */
      if (sntapp.cordovaLoaded) {
        cordova.exec(ccTransactionsPrintCompleted, function (error) {
          ccTransactionsPrintCompleted();
        }, 'RVCardPlugin', 'printWebView', ['', '', '', printMode]);
      } else {
        window.print();
        ccTransactionsPrintCompleted();
      }
    }, 100);
  };
}]);