/* global resultsFramework */

//Controller for the header section
resultsFramework.controller('ProgramController', 
        function($scope, 
                $modal, 
                $filter,
                DialogService, 
                ModalService,
                ResultsFrameworkFactory,
                ProgramFactory,
                DataSetFactory,
                MetaDataFactory,
                MetaAttributesFactory,
                RfUtils) {
    
    $scope.model = {    showAddProgramDiv: false,
                        showEditProgramDiv: false,
                        selectSize: 20,
                        activeResultsFramework: null,
                        programs: [],
                        impactDataSets: [],
                        outcomeDataSets: [],
                        outputDataSets: [],
                        metaAttributes: [],
                        metaAttributeValues: {},
                        selectedProgram: {outcomes: [], outputs: [], subProgramms: []},
                        indicatorGroups: []
                    };

    $scope.programForm = {submitted: false};
    $scope.fileNames = [];
    
    MetaDataFactory.getAll('indicatorGroups').then(function(idgs){
        $scope.model.impactIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "IMPACT"});
        $scope.model.outcomeIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "OUTCOME"});
        $scope.model.outputIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "OUTPUT"});
        
        MetaAttributesFactory.getAttributesForObject( 'programmAttribute' ).then(function(attributes){
            angular.forEach(attributes, function(att){
                $scope.model.metaAttributes.push( att );
            });
            
            DataSetFactory.getAll().then(function(dss){
                $scope.model.impactDataSets = $filter('filter')(dss, {dataSetType: "IMPACT"});
                $scope.model.outcomeDataSets = $filter('filter')(dss, {dataSetType: "OUTCOME"});
                $scope.model.outputDataSets = $filter('filter')(dss, {dataSetType: "OUTPUT"});

                ProgramFactory.getAll().then(function(response){
                    $scope.model.programs = response.programms;

                    ResultsFrameworkFactory.getActive().then(function(response){
                        $scope.model.activeResultsFramework = response.resultsFrameworks[0] ? response.resultsFrameworks[0] : null;
                        var assignedOuputIds = [];
                        if( $scope.model.activeResultsFramework ){
                            angular.forEach($scope.model.activeResultsFramework.programms, function(pr){
                                angular.forEach(pr.subProgramms, function(sp){
                                    angular.forEach(sp.outputs, function(op){
                                        assignedOuputIds.push(op.id);
                                    });
                                });
                            });
                        }                        
                        var outputIndicatorGroups = [];
                        angular.forEach($scope.model.outputIndicatorGroups, function(o){
                            if( assignedOuputIds.indexOf(o.id) === -1 ){
                                outputIndicatorGroups.push(o);
                            }
                        });                        
                        $scope.model.outputIndicatorGroups = outputIndicatorGroups;
                    });
                });
            });
        });
    });
    
    $scope.showAddProgram = function(){
        $scope.model.showAddProgramDiv = !$scope.model.showAddProgramDiv;
    };
    
    $scope.showEditProgram = function(program){
        $scope.model.metaAttributeValues = {};
        $scope.model.selectedProgram = program;
        $scope.model.selectedProgram.outcomes = $scope.model.selectedProgram.outcomes ? $scope.model.selectedProgram.outcomes : [];
        $scope.model.selectedProgram.outputs = $scope.model.selectedProgram.outputs ? $scope.model.selectedProgram.outputs : [];
        $scope.model.selectedProgram.subProgramms = $scope.model.selectedProgram.subProgramms ? $scope.model.selectedProgram.subProgramms : [];
        
        angular.forEach($scope.model.selectedProgram.attributeValues, function(av){
            $scope.model.metaAttributeValues[av.attribute.id] = av.value;
        });
        
        $scope.model.showAddProgramDiv = false;
        $scope.model.showEditProgramDiv = true;
    };
    
    $scope.hideAddProgram = function(){
        $scope.model.showAddProgramDiv = false;
        $scope.model.showEditProgramDiv = false;
        $scope.model.selectedProgram = {};
    };
    
    $scope.showSubProgramDiv = function(operation, subProgram){
        var modalInstance = $modal.open({
            templateUrl: 'components/sub-program/sub-program.html',
            controller: 'SubProgramController',
            windowClass: 'modal-full-window',
            resolve: {
                selectedProgram: function () {
                    return $scope.model.selectedProgram;
                },
                operationMode: function(){
                    return operation;
                },
                selectedSubProgram: function(){
                    return subProgram;
                },
                outputIndicatorGroups: function(){
                    return $scope.model.outputIndicatorGroups;
                },
                outputDataSets: function(){
                    return $scope.model.outputDataSets;
                }/*,
                programs: function(){
                    return $scope.model.programs;
                },
                resultsFrameworks: function(){
                    return $scope.model.resultsFrameworks;
                }*/
            }
        });

        modalInstance.result.then(function (program) {
            if (angular.isObject(program)) {
                $scope.model.selectedProgram = program;
            }
        }, function () {
        });
    };
    
    $scope.interacted = function(field, form) {
        var status = false;
        if(!form){
            return status;
        }
        if(field){            
            status = form['submitted'] || field.$dirty;
        }
        return status;        
    };
    
    $scope.addProgram = function(){
        
        //check for form validity
        $scope.programForm.submitted = true;        
        if( $scope.programForm.$invalid ){            
            return false;
        }
        
        $scope.model.selectedProgram.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);
        
        //form is valid, continue with adding
        ProgramFactory.create($scope.model.selectedProgram).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'program_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            else {
                
                //add the new program to the grid
                var pr = angular.copy($scope.model.selectedProgram);
                pr.id = data.lastImported;                
                $scope.model.programs.splice(0,0,pr);
                    
                //reset form              
                $scope.cancel();
            }
        });
    };
    
    $scope.updateProgram = function(){

        //check for form validity
        $scope.programForm.submitted = true;        
        if( $scope.programForm.$invalid ){
            return false;
        }
        
        var pr = angular.copy($scope.model.selectedProgram);
        var newSps = [];
        angular.forEach(pr.subProgramms, function(sp){
            newSps.push({id: sp.id, programm:{id: pr.id}});
        });        
        pr.subProgramms = newSps;
        
        $scope.model.selectedProgram.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);
        pr.attributeValues = $scope.model.selectedProgram.attributeValues;
        //form is valid, continue with adding
        ProgramFactory.update(pr).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'program_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            
            for(var i=0; i<$scope.model.programs.length; i++){
                if( $scope.model.selectedProgram.id === $scope.model.programs[i].id){
                    $scope.model.programs[i] = $scope.model.selectedProgram;
                    break;
                }
            }
            
            //reset form              
            $scope.cancel();
        });
    };
    
    $scope.deleteProgram = function(){
        var modalOptions = {
            closeButtonText: 'cancel',
            actionButtonText: 'delete',
            headerText: 'delete',
            bodyText: 'are_you_sure_to_delete'
        };

        ModalService.showModal({}, modalOptions).then(function(){            
            ProgramFactory.delete($scope.model.selectedProgram).then(function(){                
                for(var i=0; i<$scope.model.programs.length; i++){
                    if( $scope.model.selectedProgram.id === $scope.model.programs[i].id){
                        $scope.model.programs.splice(i,1);    
                        break;
                    }
                }
                
                $scope.cancel();
                
            }, function(){
                var dialogOptions = {
                    headerText: 'error',
                    bodyText: 'delete_error'
                };
                DialogService.showDialog({}, dialogOptions);
            });
        });
    };
    
    $scope.cancel = function(){
        $scope.programForm.submitted = false;
        $scope.hideAddProgram();
    };
});