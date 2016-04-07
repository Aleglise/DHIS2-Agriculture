/* global resultsFramework, selection */

//Controller for column show/hide
resultsFramework.controller('LeftBarMenuController',
        function($scope, $location) {    
    $scope.showResultsFramework = function(){
        downloadMetaData();
        $location.path('/results-framework').search();
    };
    
    $scope.showProgram = function(){
        $location.path('/program').search();
    };    
    
    $scope.showProject = function(){
        $location.path('/project').search();
    };
});