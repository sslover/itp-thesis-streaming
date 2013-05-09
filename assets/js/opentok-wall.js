    // ******* Replace with your unique details ********** //
    var apiKey = "23350992";
    var sessionId = "1_MX4yMzM1MDk5Mn4xMjcuMC4wLjF-V2VkIE1heSAwOCAxNzowMDoyNiBQRFQgMjAxM34wLjkxOTMyMzd-";
    var token = "T1==cGFydG5lcl9pZD0yMzM1MDk5MiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz1hN2NiNDU0NTI4YzE1ZTgxYmJkODdjZGYwOWJkYzcxYjc1MTlmNzVjOnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9MV9NWDR5TXpNMU1EazVNbjR4TWpjdU1DNHdMakYtVjJWa0lFMWhlU0F3T0NBeE56b3dNRG95TmlCUVJGUWdNakF4TTM0d0xqa3hPVE15TXpkLSZjcmVhdGVfdGltZT0xMzY4MDU3NzIyJm5vbmNlPTAuMjU1MDMxNDAxNzUxMDcyMSZleHBpcmVfdGltZT0xMzcwNjQ5NzIxJmNvbm5lY3Rpb25fZGF0YT0=";

    var session;
    var publisher;
    var subscribers = {};
    var onStageID;
    var stateManager;

    var PUBLISHER_WIDTH = 200;
    var PUBLISHER_HEIGHT = 160;

    var subscriber_width = 640;
    var subscriber_height = 480;

    // Un-comment either of the following to set automatic logging and exception handling.
    // See the exceptionHandler() method below.
    // TB.setLogLevel(TB.DEBUG);
    TB.addEventListener("exception", exceptionHandler);

    if (TB.checkSystemRequirements() != TB.HAS_REQUIREMENTS) {
      alert("You don't have the minimum requirements to run this application."
          + "Please upgrade to the latest version of Flash.");
    } else {
      // Register the exception handler and
      // create the local session object
      session = TB.initSession(sessionId);

      // Add event listeners to the session
      session.addEventListener("sessionConnected", sessionConnectedHandler);
      session.addEventListener("streamCreated", streamCreatedHandler);
      session.addEventListener("streamDestroyed", streamDestroyedHandler);
      session.addEventListener("signalReceived", signalReceivedHandler);
      /*
      If testing the app from the desktop, be sure to check the Flash Player Global Security setting
      to allow the page from communicating with SWF content loaded from the web. For more information,
      see http://www.tokbox.com/opentok/build/tutorials/helloworld.html#localTest
      */
      session.connect(apiKey, token);
    }

    //--------------------------------------
    //  OPENTOK EVENT HANDLERS
    //--------------------------------------

    function sessionConnectedHandler(event) {
      // on connection, add a new event listener for the onStage component
      stateManager = session.getStateManager();
      stateManager.addEventListener("changed:onStageID", onStageIDStateChangedHandler);
      //if no one is streaming on page load, set onStageId to null
      if (event.streams.length == 0){
        onStageID = "empty";
      }
      for (var i = 0; i < event.streams.length; i++) {
        addStream(event.streams[i]);
      }
    }

    function sessionDisconnectedHandler(event) {
      event.preventDefault(); // Prevent the default cleanup because we do it ourselves

      // Remove the publisher
      if (publisher) {
        stopPublishing();
      }

      // Remove all subscribers
      for (var streamId in subscribers) {
        removeStream(streamId);
        if (streamId == onStageID){
          console.log("removing the stage because the person closed their window!");
          removeStage(streamId);
        }
      }

      if (event.reason == "forceDisconnected") {
        alert("A moderator has disconnected you from the session.");
      }

      show("connectLink");
      hide("disconnectLink");
      hide("publishLink");
      hide("unpublishLink");
      hide("signalLink");
    }

    function streamCreatedHandler(event) {
      for (var i = 0; i < event.streams.length; i++) {
        addStream(event.streams[i]);
      }
    }

    function streamDestroyedHandler(event) {

      for (var i = 0; i < event.streams.length; i++) {
        removeStream(event.streams[i].streamId);
        if (event.streams[i].connection.connectionId == session.connection.connectionId &&
                  event.reason == "forceUnpublished") {
          alert("A moderator has stopped publication of your stream.");
          // update buttons
          hide("unpublishLink");
          show("publishLink");
          hide("signalLink");
          publisher = null;
        } 
        else{
        removeStream(event.streams[i].streamId);}
        if (event.streams[i].streamId == onStageID){
          console.log("removing the stage because the person's stream was turned off!");
          removeStage(event.streams[i].streamId);
        }  
      }
    }

    function signalReceivedHandler(event) {
      // we will put a note below their video that they want to come on camera... need to append it to their video box
      var signalUserID = event.fromConnection.connectionId;
    }

    /*
    If you un-comment the call to TB.addEventListener("exception", exceptionHandler) above, OpenTok calls the
    exceptionHandler() method when exception events occur. You can modify this method to further process exception events.
    If you un-comment the call to TB.setLogLevel(), above, OpenTok automatically displays exception event messages.
    */
    function exceptionHandler(event) {
      alert("Exception: " + event.code + "::" + event.message);
    }

    function onStageIDStateChangedHandler(event) {
      // set the onStageID to the new stream ID
      console.log("onstage changed!");
      onStageID = event.changedValues["onStageID"];
      console.log(onStageID);
      // if the onstageValue is null and the container exists, then delete the container
      if (onStageID == "empty" || onStageID == null){
        alert("Got empty onStageID");
        //if there is a stage set-up, remove that
        if ($(".mainonstageContainer")[0]){
            $('.mainonstageContainer').remove();
          }         
      }
      else if(onStageID != "empty") {
        console.log("Trying to create stage");
        createStage(onStageID);
      }
      // for debugging only
      alert("onStageID changed state. Value: " + event.changedValues["onStageID"]);
    }

    //--------------------------------------
    //  LINK CLICK HANDLERS
    //--------------------------------------

    /*
    If testing the app from the desktop, be sure to check the Flash Player Global Security setting
    to allow the page from communicating with SWF content loaded from the web. For more information,
    see http://www.tokbox.com/opentok/build/tutorials/helloworld.html#localTest
    */
    function connect() {
      session.connect(apiKey, token);
    }

    function disconnect() {
      session.disconnect();
    }

    // Called when user wants to start publishing to the session
    function startPublishing() {
      if (!publisher) {
        var parentDiv = document.getElementById("myCamera");
        var publisherDiv = document.createElement('div'); // Create a div for the publisher to replace
        publisherDiv.setAttribute('id', 'opentok_publisher');
        parentDiv.appendChild(publisherDiv);
                publisher = TB.initPublisher(apiKey, 'opentok_publisher'); // Pass the replacement div id
        session.publish(publisher);
        hide('publishLink');
      }
    }

    function stopPublishing() {
      if (publisher) {
        session.unpublish(publisher);
        // when someone turns off webcam, give them button to turn it back on and hide the ability to raise hand
        hide("unpublishLink");
        show("publishLink");
        hide("signalLink");
      }

      publisher = null;
    }

    function signal() {
      session.signal();
    }

    function forceDisconnectStream(streamId) {
      session.forceDisconnect(subscribers[streamId].stream.connection.connectionId);
    }

    function createStage(streamId) {
      var container = document.createElement('div');
      container.className = "mainonstageContainer";
      var containerId = "container_" + streamId;
      container.setAttribute("id", containerId);
      document.getElementById("mainstage").appendChild(container);

      // Create the div that will be replaced by the subscriber
      var div = document.createElement('div');
      var divId = streamId;
      div.setAttribute('id', divId);
      div.style.cssFloat = "top";
      container.appendChild(div);

      var subscriberProps = {width: subscriber_width, height: subscriber_height, publishAudio: true};
      session.subscribe(subscribers[streamId].stream, divId, subscriberProps);
    } 

    function removeStage(streamId) {
       //set the stageID to null, and delete the container
        var containerId = "container_" + streamId;
        console.log(containerId);
        console.log(streamId);
       var container = document.getElementById(containerId);
       console.log(container);
        // Clean up the subscriber container
        document.getElementById("mainstage").removeChild(container);
    }


    function forceUnpublishStream(streamId) {
      session.forceUnpublish(subscribers[streamId].stream);
    }

    //--------------------------------------
    //  HELPER METHODS
    //--------------------------------------

    function addStream(stream) {
      console.log(stream.streamId);
      if (stream.connection.connectionId == session.connection.connectionId) {
        show("unpublishLink");
        return;
      }
      // Create the container for the subscriber
      var container = document.createElement('div');
      container.className = "subscriberContainer";
      var containerId = "container_" + stream.streamId;
      container.setAttribute("id", containerId);
      document.getElementById("subscribers").appendChild(container);

      // Create the div that will be replaced by the subscriber
      var div = document.createElement('div');
      var divId = stream.streamId;
      div.setAttribute('id', divId);
      div.style.cssFloat = "top";
      container.appendChild(div);

      var subscriberProps = {width: PUBLISHER_WIDTH, height: PUBLISHER_HEIGHT, publishAudio: false};
      subscribers[stream.streamId] = session.subscribe(stream, divId, subscriberProps);
    }


    function removeStream(streamId) {
      var subscriber = subscribers[streamId];
      if (subscriber) {
        var container = document.getElementById(subscriber.id).parentNode;

        session.unsubscribe(subscriber);
        delete subscribers[streamId];

        // Clean up the subscriber container
        document.getElementById("subscribers").removeChild(container);
      }
    }


    function show(id) {
      document.getElementById(id).style.display = 'block';
    }

    function hide(id) {
      document.getElementById(id).style.display = 'none';
    }