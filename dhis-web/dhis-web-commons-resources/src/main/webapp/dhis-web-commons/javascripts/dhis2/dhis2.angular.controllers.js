'use strict';

/* Controllers */
var d2Controllers = angular.module('d2Controllers', [])

//Controller for column show/hide
.controller('ColumnDisplayController', 
    function($scope, 
            $modalInstance, 
            hiddenGridColumns,
            gridColumns){
    
    $scope.gridColumns = gridColumns;
    $scope.hiddenGridColumns = hiddenGridColumns;
    
    $scope.close = function () {
      $modalInstance.close($scope.gridColumns);
    };
    
    $scope.showHideColumns = function(gridColumn){
       
        if(gridColumn.show){                
            $scope.hiddenGridColumns--;            
        }
        else{
            $scope.hiddenGridColumns++;            
        }      
    };    
})

//controller for dealing with google map
.controller('MapController',
        function($scope, 
                $modalInstance,
                CurrentSelection,
                DHIS2URL,                
                location) {
    
    $scope.home = function(){        
        window.location = DHIS2URL;
    };
    
    $scope.location = location;
    
    $scope.close = function () {
        $modalInstance.close();
    };
    
    $scope.captureCoordinate = function(){
        $scope.location = CurrentSelection.getLocation();
        $modalInstance.close($scope.location);
    };
})

//Controller for audit history
.controller('AuditHistoryController', function ($scope, $modalInstance, $modal, AuditHistoryDataService, DateUtils, eventId, dataType, nameIdMap) {

    $scope.itemList = [];

    $scope.model = {type: dataType};

    $scope.close = function () {
        $modalInstance.close();
    };
    
    $scope.auditColumns = ['name', 'auditType', 'value', 'modifiedBy', 'created'];    

    AuditHistoryDataService.getAuditHistoryData(eventId, dataType).then(function (data) {

        $scope.itemList = [];

        var reponseData = data.trackedEntityDataValueAudits ? data.trackedEntityDataValueAudits :
            data.trackedEntityAttributeValueAudits ? data.trackedEntityAttributeValueAudits : null;

        if (reponseData) {
            for (var index = 0; index < reponseData.length; index++) {
                var dataValue = reponseData[index];
                /*The true/false values are displayed as Yes/No*/
                if (dataValue.value === "true") {
                    dataValue.value = "Yes";
                } else if (dataValue.value === "false") {
                    dataValue.value = "No";
                }
                
                var obj = {};                
                obj.auditType = dataValue.auditType;                
                obj.value = dataValue.value;
                obj.modifiedBy = dataValue.modifiedBy;
                obj.created = DateUtils.formatToHrsMinsSecs(dataValue.created);
                
                if (dataType === "attribute") {
                    if (nameIdMap[dataValue.trackedEntityAttribute.id] && nameIdMap[dataValue.trackedEntityAttribute.id].displayName) {                        
                        obj.name = nameIdMap[dataValue.trackedEntityAttribute.id].displayName;
                    }
                } else if (dataType === "dataElement") {
                    if (nameIdMap[dataValue.dataElement.id] && nameIdMap[dataValue.dataElement.id].dataElement) {                        
                        obj.name = nameIdMap[dataValue.dataElement.id].dataElement.displayName;
                    }
                }                
                $scope.itemList.push(obj);
            }
        }
    });
});