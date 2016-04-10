function SettingsViewModel(qrServer, scannerServices) {
  var self = this;

  this.endpoint = ko.observable('http://gorc.loc/');
  this.apiUser = ko.observable();
  this.apiPass = ko.observable();
  this.selectedEvent = ko.observable();

  this.apiKey = ko.computed(function() {
        return this.apiUser() + "|" + this.apiPass();
       }, this);

  this.hasSelectedEventError = ko.observable(false);

  this.server = qrServer;
  this.scannerServices = scannerServices;



  this.selectedEvent.subscribe(function(newValue) {
      if (newValue != null) {
        self.hasSelectedEventError(false);
      }
  });

  var mapping = {
    'include': ["endpoint", "apiUser", "apiPass"]
  }

  this.clearDetails = function() {
    self.server.isLoggedIn(false);
    self.endpoint(null);
    self.apiUser(null);
    self.apiPass(null);
    self.selectedEvent(null);
    self.hasSelectedEventError(false);
  }

  this.loginCallback = function() {
    var lastEvent = localStorage.getItem("qrcheckin.setttings.selectedEvent");
    if (lastEvent != null) {
      for(var i = 0, len = self.server.eventList().length; i < len; i++) {
        if (self.server.eventList()[i] == lastEvent) {
          self.selectedEvent(lastEvent);
        }
      }
    }
  }

  this.doLogin = function() {
    localStorage.setItem("qrcheckin.setttings", JSON.stringify(ko.mapping.toJS(self, mapping)));
    self.server.checkEndpoint(self.endpoint(), self.apiKey(), self.loginCallback);
  }

  this.scanLogInSettings = function() {
    self.scannerServices.scan(
      function(result) {
        if (!result.cancelled) {
          var stringifiedObject = result.text;

          if (stringifiedObject != null) {
            var reconstitutedObject = JSON.parse(stringifiedObject);
            self.endpoint(reconstitutedObject.e);
//            self.apiKey(reconstitutedObject.a);
            self.apiUser(reconstitutedObject.u);
            self.apiPass(reconstitutedObject.p);
          }
        }
      },
      function(error) {
        alertWrapper("Scan failed: " + error);
      }
    );
  }

  this.loadSettings = function() {
    var stringifiedObject = localStorage.getItem("qrcheckin.setttings");
    if (stringifiedObject != null) {
      var reconstitutedObject = JSON.parse(stringifiedObject);
      ko.mapping.fromJS(reconstitutedObject, {}, self);

      return true;
    }

    return false;
  }

  this.validateHasEvent = function() {
    if (self.selectedEvent() == null) {
      self.hasSelectedEventError(true);
      return false;
    }
    else {
      localStorage.setItem("qrcheckin.setttings.selectedEvent", self.selectedEvent());
      self.hasSelectedEventError(false);
      return true;
    }
  }


}