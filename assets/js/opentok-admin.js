    // ******* Replace with your unique details ********** //
    var apiKey = "23350992";
    var sessionId = "1_MX4yMzM1MDk5Mn4xMjcuMC4wLjF-V2VkIE1heSAwOCAxNzowMDoyNiBQRFQgMjAxM34wLjkxOTMyMzd-";
    var token = "T1==cGFydG5lcl9pZD0yMzM1MDk5MiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz0zNzRmMzViYjc5NWI0MDRiNWQ3MmUyOWUyM2RmMzE0ZDA4OTkxYmFmOnJvbGU9bW9kZXJhdG9yJnNlc3Npb25faWQ9MV9NWDR5TXpNMU1EazVNbjR4TWpjdU1DNHdMakYtVjJWa0lFMWhlU0F3T0NBeE56b3dNRG95TmlCUVJGUWdNakF4TTM0d0xqa3hPVE15TXpkLSZjcmVhdGVfdGltZT0xMzY4MDU3NzQ5Jm5vbmNlPTAuNzU2MDEwMzM1MjY3NTEyOSZleHBpcmVfdGltZT0xMzcwNjQ5NzQ5JmNvbm5lY3Rpb25fZGF0YT0=";

    var session;
    var publisher;
    var subscribers = {};
    var onStageID;
    var stateManager;

    var PUBLISHER_WIDTH = 200;
    var PUBLISHER_HEIGHT = 160;

    var subscriber_width = 200;
    var subscriber_height = 160;

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
      for (var i = 0; i < event.streams.length; i++) {
        addStream(event.streams[i]);
      }
      if (event.streams.length == 0){
        onStageID = "empty";
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
        if (event.streams[i].streamId == onStageID){
          removeStage(event.streams[i].streamId);
        }
        if (event.streams[i].connection.connectionId == session.connection.connectionId &&
                  event.reason == "forceUnpublished") {
          alert("A moderator has stopped publication of your stream.");
          // update buttons
          hide("unpublishLink");
          show("publishLink");
          hide("signalLink");
          publisher = null;
        } else {
          removeStream(event.streams[i].streamId);
        }
    }
  }

    function signalReceivedHandler(event) {
      // we will put a note below their video that they want to come on camera... need to append it to their video box
      var signalUserId = event.fromConnection.connectionId;
      for (var streamId in subscribers) {
           var currentUser = subscribers[streamId].stream.connection.connectionId;
           if(signalUserId == currentUser){
            //then we add the "wants to come on stage message"
            //first, check to see if a div like this already exists for the user (if so, no need to show again)
            if ($("#handraised_" + subscribers[streamId].id)[0]){
                // do nothing - it already exists
              }
            else{
              var container = document.getElementById(subscribers[streamId].id).parentNode;
              // Create a div to hold the message
              var moderationControls = document.createElement('div');
              var containerId = "handraised_" + subscribers[streamId].id;
              moderationControls.setAttribute("id", containerId);
              moderationControls.style.cssFloat = "bottom";
              moderationControls.innerHTML = '<h5 class="live-admin">Wants to come On Stage</h5>';
              container.appendChild(moderationControls);
              alert("An audience member wants to come On Stage! User " + signalUserId);
            }
          }
       }
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
      onStageID = event.changedValues["onStageID"];
      // if the onstageValue is null and the container exists, then delete the container
      if (onStageID == "empty" || onStageID == null){
        //alert("Got empty onStageID");
        if ($(".onstageContainer")[0]){
            $('.onstageContainer').remove();
          }         
      }
      else if(onStageID != "empty") {
        createStage(onStageID);
      }
      // for debugging only
      //alert("onStageID changed state. Value: " + event.changedValues["onStageID"]);

      /*if (lastOnStageId != onStageID) {
        lastOnStageId = onStageID;
      } else {
        stateManager.addEventListener("changed:onStageID", onStageIDStateChangedHandler);
      }*/
      //stateManager.onStageID = null;
      //stateManager.addEventListener("changed:onStageID", onStageIDStateChangedHandler);

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
      //first create the stage holder
      var container = document.createElement('div');
      container.className = "onstageContainer";
      var containerId = "container_" + streamId;
      container.setAttribute("id", containerId);
      document.getElementById("stage").appendChild(container);

      // Create the div that will be replaced by the subscriber
      var div = document.createElement('div');
      var divId = streamId;
      div.setAttribute('id', divId);
      div.style.cssFloat = "top";
      container.appendChild(div);

      // Create a div for the force disconnect link
      var moderationControls = document.createElement('div');
      moderationControls.style.cssFloat = "bottom";
      moderationControls.innerHTML =
          '<div class="box border-radius-bottom">'
        + '<p>'
        + '<a href="#" class="btn btn-small btn-block turnoff" style="margin:5px; float:left; margin-top:-5px; margin-left:45px;" onclick="javascript:removeStage(\'' + streamId + '\')">Take Off Stage<\/a>'
        + '</p>'
        + '</div>';
      container.appendChild(moderationControls);

      var subscriberProps = {width: PUBLISHER_WIDTH, height: PUBLISHER_HEIGHT, subscribeToAudio: true};
      session.subscribe(subscribers[streamId].stream, divId, subscriberProps);

      // now that they are on stage, remove the message saying they want to get on stage
      var currentUser = subscribers[streamId];
      if (currentUser) {
        // remove the message
        $("#handraised_" + currentUser.id).remove();
      }
}

    function removeStage(streamId) {
       //set the stageID to null, and delete the container
       var containerId = "container_" + streamId;
       var container = document.getElementById(containerId);
        // Clean up the subscriber container
        document.getElementById("stage").removeChild(container);
        stateManager.set("onStageID", "empty");
    }

    function makeOnStage(streamId){
        // function to set the onStageId to the streamID
        //first, we need to see if the stage is already taken up, if so, we need to remove it
        // to do that, we check to see if the onStageContainer already exists
        if ($(".onstageContainer")[0]){
            if(streamId == onStageID){
              //do nothing, they are already on stage
              alert("that person is already on stage!");
            }
            if(streamId =! onStageID){
            alert("stage is already taken! remove the person first and re-add");
            }
         }   
        //now we see the onStageId to the new streamId, which will create a new stage
        else{
          stateManager.set("onStageID", streamId);
        }
    }

    function forceUnpublishStream(streamId) {
      session.forceUnpublish(subscribers[streamId].stream);
    }

    //--------------------------------------
    //  HELPER METHODS
    //--------------------------------------

    function addStream(stream) {
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

      // Create a div for the force disconnect link
      var moderationControls = document.createElement('div');
      moderationControls.style.cssFloat = "bottom";
      moderationControls.innerHTML =
          '<div class="box border-radius-bottom">'
        + '<p>'
        + '<a href="#" class="btn btn-small btn-block onstage" style="margin:5px; float:left;" onclick="javascript:makeOnStage(\'' + stream.streamId + '\')">Make On Stage<\/a><br>'
        + '<a class="btn btn-small btn-block turnoff" style="margin:5px; float:left; margin-top:-12px;" onclick="javascript:forceUnpublishStream(\'' + stream.streamId + '\')">Turn Off Cam<\/a>'
        + '</p>';
      container.appendChild(moderationControls);

      var subscriberProps = {width: PUBLISHER_WIDTH, height: PUBLISHER_HEIGHT, subscribeToAudio: false};
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