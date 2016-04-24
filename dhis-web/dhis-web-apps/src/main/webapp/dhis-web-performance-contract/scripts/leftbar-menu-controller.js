/* global performanceContract, selection */

//Controller for column show/hide
performanceContract.controller('LeftBarMenuController',
        function($scope, $location) {
    $scope.showPerformanceContract = function(){
        selection.load();
        $location.path('/').search();
    };    
});