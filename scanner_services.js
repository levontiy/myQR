


function ScannerServices(mockScannerVM) {
  var self = this;

  this.mockScannerVM = mockScannerVM;

  this.scan = function(successCallback, errorCallback, wantManual) {
    if (wantManual || (typeof cordova == 'undefined') ) {
      self.mockScannerVM.scan(successCallback, errorCallback);
    } else {
//      var scanner = cordova.require("cordova/plugin/BarcodeScanner");
      cordova.plugins.barcodeScanner.scan(
        function(result) {
          successCallback(result);
        },
        function(error) {
          errorCallback(error);
        },
        {
//          "preferFrontCamera" : true, // iOS and Android 
//          "showFlipCameraButton" : true, // iOS and Android 
//          "prompt" : "Place a barcode inside the scan area", // supported on Android only 
          "formats" : "QR_CODE,EAN_13", // default: all but PDF_417 and RSS_EXPANDED 
//          "orientation" : "landscape" // Android only (portrait|landscape), default unset so it rotates with the device 
        }                
      );
    }
  }
}