/* global resultsFramework, selection */

//Controller for column show/hide
resultsFramework.controller('LeftBarMenuController',
        function($scope, $location) {
    $scope.showPerformanceContract = function(){
        selection.load();
        $location.path('/').search();
    };    
});