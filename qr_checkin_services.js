function CheckInResultsModel() {
  var self = this;

  this.haveResult = ko.observable(false);

  this.success = ko.observable();

  this.name = ko.observable();

  this.errorMessage = ko.observable();

  this.successMessage = ko.observable();
}


function QRCheckInServices() {
  var self = this;


  this.eventStatisticsModel = new EventStatisticsModel();

  this.isMakingRequest = ko.observable(false);
  this.progressMessage = ko.observable();
  this.isLoggedIn = ko.observable(false);
  this.eventList = ko.observableArray();
  this.allowPassInOut = ko.observable(false);
  this.allowManualCheckins = ko.observable(false);

  this.checkEndpoint = function(endpointUrl, apiKey, loginCallback) {
    
    if (self.isMakingRequest()) {
      return;
    }
    self.isLoggedIn(false);
    self.isMakingRequest(true);
    
    $.ajax({
      type: 'GET',
      url: endpointUrl + "/qr_check_in/check_endpoint/" + apiKey,
      dataType: 'json',
      error: function(xhr, ajaxOptions, thrownError) {
        self.isMakingRequest(false);
        alertWrapper("Error logging in!");
      },
      success: function(event, data, status, xhr) {
        self.isMakingRequest(false);
        if (event["success"]) {
          self.isLoggedIn(true);

          self.allowManualCheckins(event["allow_manual_checkins"]);
          self.allowPassInOut(event["allow_pass_in_out"]);

          self.eventList.removeAll();
          for(var i = 0, len=event["event_names"].length; i < len; i++)
          {
            self.eventList.push(event["event_names"][i]);
          }
          loginCallback();
        }
        else {
          alertWrapper("Error logging in!");
        }
      }
    });
  }


  this.updateStatistics = function(endpointUrl, apiKey, event, lastCheckInResultModel) {
    if (self.isMakingRequest()) {
      return;
    }
    url = endpointUrl + "/qr_check_in/get_event_statistics/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--"));
    self.progressMessage("Updating Event Statistics...");
    self.performRemoteEventFunction(
      url,
      lastCheckInResultModel,
      false
    );
  }



  this.checkInTicket = function(endpointUrl, apiKey, event, ticketToken, lastCheckInResultModel, checkedInObservable) {
    if (self.isMakingRequest()) {
      return;
    }
    if (ticketToken != null) {
      url = endpointUrl + "/qr_check_in/check_in/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--")) + "/" + encodeURIComponent(ticketToken);
      self.progressMessage("Checking in Ticket...");
      self.performRemoteEventFunction(
        url,
        lastCheckInResultModel,
        true,
        function (isSuccessful) {
          if (isSuccessful && checkedInObservable != null) {
            checkedInObservable(true);
          }
        }
      );
    }
  }


this.checkInTicketOffline = function(event, ticketToken, lastCheckInResultModel, checkedInObservable) {
    
    if (ticketToken != null) {
//      url = endpointUrl + "/qr_check_in/check_in/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--")) + "/" + encodeURIComponent(ticketToken);
      self.progressMessage("Checking in Ticket Offline...");
      
      

        var keyPrefix = "qrcheckin.tickets."+event+".";
        var key = keyPrefix+ticketToken;
        
      var  ticket = JSON.parse(localStorage.getItem(key));
      
      if(ticket && ! ticket.is_in)
      {
          if (1 && checkedInObservable != null) {
            checkedInObservable(true);
          }

        ticket.is_in = true;
        ticket.local_change = true;
        ticket.local_time = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(ticket))
        
        lastCheckInResultModel.success(1);
//        lastCheckInResultModel.errorMessage("error_message");
        lastCheckInResultModel.successMessage("Success");
        
      }
      else
      {
        lastCheckInResultModel.success(0);
        
        if(ticket && ticket.is_in)
        {
            lastCheckInResultModel.errorMessage("ALREADY IN");
        }
        else
        {
            lastCheckInResultModel.errorMessage("TICKET NOT FOUND");
        }
        
          
      }
    }
    lastCheckInResultModel.haveResult(1);
//    alert('done')
  }






  this.checkOutTicket = function(endpointUrl, apiKey, event, ticketToken, lastCheckInResultModel, checkedInObservable) {
    if (self.isMakingRequest()) {
      return;
    }
    if (ticketToken != null) {
      url = endpointUrl + "/qr_check_in/check_out/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--")) + "/" + encodeURIComponent(ticketToken);
      self.progressMessage("Checking Out Ticket...");
      self.performRemoteEventFunction(
        url,
        lastCheckInResultModel,
        true,
        function (isSuccessful) {
          if (isSuccessful && checkedInObservable != null) {
            checkedInObservable(false);
          }
        }
      );
    }
  }

  this.manualCheckin = function(endpointUrl, apiKey, event, lastCheckInResultModel) {
    if (self.isMakingRequest()) {
      return;
    }
    url = endpointUrl + "/qr_check_in/perform_manual_checkin/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--"));
    self.progressMessage("Checking In...");
    self.performRemoteEventFunction(url, lastCheckInResultModel, true);
  }

  this.passOut = function(endpointUrl, apiKey, event, lastCheckInResultModel) {
    if (self.isMakingRequest()) {
      return;
    }
    url = endpointUrl + "/qr_check_in/perform_pass_out/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--"));
    self.progressMessage("Updating Venue Count...");
    self.performRemoteEventFunction(url, lastCheckInResultModel, true);
  }

  this.passIn = function(endpointUrl, apiKey, event, lastCheckInResultModel) {
    if (self.isMakingRequest()) {
      return;
    }
    url = endpointUrl + "/qr_check_in/perform_pass_in/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--"));
    self.progressMessage("Updating Venue Count...");
    self.performRemoteEventFunction(url, lastCheckInResultModel, true);
  }


  this.performRemoteEventFunction = function(url, lastCheckInResultModel, displaySuccess, callback) {
    lastCheckInResultModel.haveResult(false);
    self.isMakingRequest(true);
    $.ajax({
      type: 'GET',
      url: url,
      dataType: 'json',
      error: function(xhr, ajaxOptions, thrownError) {
        self.isMakingRequest(false);
        alertWrapper("Error contacting server.");
        if (callback != null) {
          callback(false);
        }
      },
      success: function(event, data, status, xhr) {

        self.isMakingRequest(false);

        lastCheckInResultModel.success(event["success"]);
        lastCheckInResultModel.errorMessage(event["error_message"]);
        lastCheckInResultModel.successMessage(event["success_message"]);

        // We now have a result!
        if (displaySuccess) {
          lastCheckInResultModel.haveResult(true);
        }


        self.eventStatisticsModel.number_of_checkins(event["event_statistics"]["number_of_checkins"]);
        self.eventStatisticsModel.number_in_venue(event["event_statistics"]["number_in_venue"]);
        self.eventStatisticsModel.number_of_failed_checkins(event["event_statistics"]["number_of_failed_checkins"]);
        if (callback != null) {
          callback(event["success"]);
        }
      }
    });
  }
}
