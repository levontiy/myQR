function ScanViewModel(settingsVM, qrServer, scannerServices) {
  var self = this;

  this.lastCheckInResultModel = new CheckInResultsModel();
  this.settingsPageViewModel = settingsVM;
  this.server = qrServer;
  this.scannerServices = scannerServices;

  this.isScanning = ko.observable(false);

  this.wantsManual = ko.observable(false);
  this.wantsOffline = ko.observable(false);
  this.wantsCheckout = ko.observable(false);

  this.updateStatistics = function() {
    self.server.updateStatistics(
      self.settingsPageViewModel.endpoint(),
      self.settingsPageViewModel.apiKey(),
      self.settingsPageViewModel.selectedEvent(),
      self.lastCheckInResultModel
    );
  }



  this.scanAndCheckInTicket = function(applicationVM) {
    if (self.server.isMakingRequest()) {
      return;
    }

    self.isScanning(true);

    var ticketToken = null;

    self.scannerServices.scan(
      function(result) {
        if (!result.cancelled) {
          ticketToken = result.text;
          

          if(self.wantsOffline())
          {
//                  alert('offline')
                  
                self.server.checkInTicketOffline(
                  self.settingsPageViewModel.selectedEvent(),
                  ticketToken,
                  self.lastCheckInResultModel
                );
          }
          else
          {
//            alert('online')
              
            self.server.checkInTicket(
              self.settingsPageViewModel.endpoint(),
              self.settingsPageViewModel.apiKey(),
              self.settingsPageViewModel.selectedEvent(),
              ticketToken,
              self.lastCheckInResultModel
            );
          }
        }
      },
      function(error) {
        alertWrapper("Scan failed: " + error);
      },
      self.wantsManual()
            
    );

    self.isScanning(false);    
  }


  this.manualCheckin = function() {
    self.server.manualCheckin(
      self.settingsPageViewModel.endpoint(),
      self.settingsPageViewModel.apiKey(),
      self.settingsPageViewModel.selectedEvent(),
      self.lastCheckInResultModel
    );
  }

  this.passOut = function() {
    self.server.passOut(
      self.settingsPageViewModel.endpoint(),
      self.settingsPageViewModel.apiKey(),
      self.settingsPageViewModel.selectedEvent(),
      self.lastCheckInResultModel
    );
  }

  this.passIn = function() {
    self.server.passIn(
      self.settingsPageViewModel.endpoint(),
      self.settingsPageViewModel.apiKey(),
      self.settingsPageViewModel.selectedEvent(),
      self.lastCheckInResultModel
    );
  }
  
  this.Sync = function() {
//    alert('starting sync..')

    var endpointUrl = self.settingsPageViewModel.endpoint();
    var apiKey = self.settingsPageViewModel.apiKey();
    var event = self.settingsPageViewModel.selectedEvent();

    url = endpointUrl + "/qr_check_in/download_tickets/" + encodeURIComponent(apiKey) + "/" + encodeURIComponent(event.replace(/\//g , "--"));

      
    var keyPrefix = "qrcheckin.tickets."+event+".";
        

      
    localIns = getLocalIns(keyPrefix)
      
    $.post(url, {'ins': localIns}, function( data ) {
//        console.log(data)
      ClearSomeLocalStorage(keyPrefix)
      $.each( data, function( ticketToken, val ) {
        var key = keyPrefix+ticketToken;
        localStorage.setItem(key, JSON.stringify(val))

      });
      
      alert('Sent '+Object.keys(localIns).length+', downloaded '+Object.keys(data).length+' ')

    })
      
    return;  
      
//    $.getJSON(url, function( data ) {
////        console.log(data)
//        ClearSomeLocalStorage(keyPrefix)
//      $.each( data, function( ticketToken, val ) {
//        var key = keyPrefix+ticketToken;
//        localStorage.setItem(key, JSON.stringify(val))
//        
//      });
//     alert('downloaded '+Object.keys(data).length+' tickets')
//
//    });
    
//    self.settingsPageViewModel.endpoint(),
//    self.settingsPageViewModel.apiKey(),
//    self.settingsPageViewModel.selectedEvent(),
//    self.lastCheckInResultModel
    
      
  }
}

function ClearSomeLocalStorage(startsWith) {
    var myLength = startsWith.length;

    Object.keys(localStorage) 
        .forEach(function(key){ 
            if (key.substring(0,myLength) == startsWith) {
                localStorage.removeItem(key); 
            } 
        }); 
}

function getLocalIns(startsWith) {
    var myLength = startsWith.length;

    tmpList = {};
    Object.keys(localStorage) 
        .forEach(function(key){ 
            if (key.substring(0,myLength) == startsWith) {
                var ticket = JSON.parse(localStorage.getItem(key));
                
                if(ticket && ticket.is_in /* && ticket.local_change */) //todo uncomment for future events
                {
                    code = key.substring(myLength)

                    tmpList[code] = {is_in: 1, local_time: ticket.local_time}

                }
            } 
        });
        
    return tmpList
}

