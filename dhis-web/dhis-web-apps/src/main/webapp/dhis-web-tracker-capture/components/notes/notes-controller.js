/* global trackerCapture, angular */

trackerCapture.controller('NotesController',
        function($scope,
                DateUtils,
                EnrollmentService,
                MessagingService,
                CurrentSelection,
                DialogService,
                SessionStorageService,
                orderByFilter) {
    $scope.dashboardReady = false;
    var userProfile = SessionStorageService.get('USER_PROFILE');
    var storedBy = userProfile && userProfile.username ? userProfile.username : '';

    var today = DateUtils.getToday();
    
    //$scope.smsForm = {};
    $scope.note = {};
    $scope.message = {};
    $scope.showMessagingDiv = false;
    $scope.showNotesDiv = true;
    
    $scope.$on('dashboardWidgets', function() {
        $scope.selectedEnrollment = null;
        var selections = CurrentSelection.get();
        $scope.selectedTei = selections.tei;
        $scope.dashboardReady = true;
        var selections = CurrentSelection.get();
        if(selections.selectedEnrollment && selections.selectedEnrollment.enrollment){
            EnrollmentService.get(selections.selectedEnrollment.enrollment).then(function(data){    
                $scope.selectedEnrollment = data;   
                if(!angular.isUndefined( $scope.selectedEnrollment.notes)){
                    $scope.selectedEnrollment.notes = orderByFilter($scope.selectedEnrollment.notes, '-storedDate');            
                    angular.forEach($scope.selectedEnrollment.notes, function(note){
                        note.displayDate = DateUtils.formatFromApiToUser(note.storedDate);
                        note.storedDate = DateUtils.formatToHrsMins(note.storedDate);
                    });
                }
            });
        }
        
        if($scope.selectedTei){
            //check if the selected TEI has any of the contact attributes
            //that can be used for communication
            var continueLoop = true;
            for(var i=0; i<$scope.selectedTei.attributes.length && continueLoop; i++){
                if( $scope.selectedTei.attributes[i].valueType === 'PHONE_NUMBER' /*|| $scope.selectedTei.attributes[i].valueType === 'EMAIL'*/ ){
                    $scope.messagingPossible = true;
                    $scope.message.phoneNumber = $scope.selectedTei.attributes[i].value;
                    continueLoop = false;
                }
            }
        }
    });
       
    $scope.addNote = function(){
        if(!$scope.note.value){
            var dialogOptions = {
                headerText: 'error',
                bodyText: 'please_add_some_text'
            };                

            DialogService.showDialog({}, dialogOptions);
            return;
        }

        var newNote = {value: $scope.note.value};

        if(angular.isUndefined( $scope.selectedEnrollment.notes) ){
            $scope.selectedEnrollment.notes = [{value: newNote.value, storedDate: DateUtils.formatFromUserToApi(today), displayDate: today, storedBy: storedBy}];

        }
        else{
            $scope.selectedEnrollment.notes.splice(0,0,{value: newNote.value, storedDate: DateUtils.formatFromUserToApi(today),displayDate: today, storedBy: storedBy});
        }

        var e = angular.copy($scope.selectedEnrollment);
        e.enrollmentDate = DateUtils.formatFromUserToApi(e.enrollmentDate);
        if(e.incidentDate){
            e.incidentDate = DateUtils.formatFromUserToApi(e.incidentDate);
        }
        e.notes = [newNote];
        EnrollmentService.updateForNote(e).then(function(){
            $scope.clear();
        });
    };
    
    $scope.sendSms = function(){
        //check for form validity
        $scope.smsForm.submitted = true;        
        if( $scope.smsForm.$invalid ){
            return false;
        } 
        
        //form is valid...        
        var smsMessage = {message: $scope.message.value, recipients: [$scope.message.phoneNumber]};        
        MessagingService.sendSmsMessage(smsMessage).then(function(response){
            var dialogOptions = {
                headerText: response.status,
                bodyText: response.message
            };                

            DialogService.showDialog({}, dialogOptions);
            $scope.clear();
        });
        
    };
    
    $scope.clear = function(){
        $scope.note = {};
        $scope.smsForm.submitted = false;
        $scope.message.value = null;
    };
    
    $scope.showNotes = function(){
        $scope.showNotesDiv = !$scope.showNotesDiv;
        $scope.showMessagingDiv = !$scope.showMessagingDiv;
    };
    
    $scope.showMessaging = function(){
        $scope.showNotesDiv = !$scope.showNotesDiv;
        $scope.showMessagingDiv = !$scope.showMessagingDiv;
    };
});
