   // ******* Replace with your unique details ********** //
    var apiKey = "23350992";
    var sessionId = "1_MX4yMzM1MDk5Mn4xMjcuMC4wLjF-V2VkIE1heSAwOCAxNzowMDoyNiBQRFQgMjAxM34wLjkxOTMyMzd-";
    var token = "T1==cGFydG5lcl9pZD0yMzM1MDk5MiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz05ZDZjY2E5ODE2ZjQ4ZWE2OTA3ZTJlMDc4YzgxOTc0ZmI0MWJlNThjOnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9MV9NWDR5TXpNMU1EazVNbjR4TWpjdU1DNHdMakYtVjJWa0lFMWhlU0F3T0NBeE56b3dNRG95TmlCUVJGUWdNakF4TTM0d0xqa3hPVE15TXpkLSZjcmVhdGVfdGltZT0xMzY4MDU3NjkxJm5vbmNlPTAuMTgxMTU5MzU3OTM5ODgwOCZleHBpcmVfdGltZT0xMzcwNjQ5NjkxJmNvbm5lY3Rpb25fZGF0YT0=";
    
    var session;
    var publisher;
    var subscribers = {};
    var onStageID;
    var stateManager;
    var myStreamId;

    var PUBLISHER_WIDTH = 200;
    var PUBLISHER_HEIGHT = 160;

    var subscriber_width = 200;
    var subscriber_height = 160;

    $(document).ready(function() {
      $("#signalLink").hide();
      $("#onstage_msg").hide();
      $("#onstage_msg2").hide();
      $("#unpublishLink").hide();
  });

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
      //checkStage(); //we need this, but it is called before the listener is updated?
      // Now possible to start streaming
      document.getElementById("status").innerHTML = 'You are currently not streaming.';
      show("publishLink");
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
    }

    function streamCreatedHandler(event) {

      // When we get a streamCreated event for the stream we publish,
      // build the grid of subscribers at the appropriate sizes.

      for (var i = 0; i < event.streams.length; i++) {
        if (event.streams[i].connection.connectionId == event.target.connection.connectionId) {
          // Update status and controls
          document.getElementById('status').innerHTML = 'You are currently streaming!';
          show("unpublishLink");
          show("signalLink");
        }
        addStream(event.streams[i]);
      }
    }

    function streamDestroyedHandler(event) {
      for (var i = 0; i < event.streams.length; i++) {
        if (event.streams[i].connection.connectionId == session.connection.connectionId &&
          event.reason == "forceUnpublished") {
          alert("A moderator has stopped publication of your stream.");
        }
        if (event.streams[i].connection.connectionId == event.target.connection.connectionId) {
          // Our publisher just stopped streaming
          // Update status and controls
          document.getElementById("status").innerHTML = 'You are currently not streaming';
          show("publishLink");
          hide("signalLink");
          hide("unpublishLink");
        }
        removeStream(event.streams[i].streamId);
        if (event.streams[i].streamId == onStageID){
          console.log("removing the stage because the person's stream was turned off!");
          removeStage(event.streams[i].streamId);
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
      console.log("onstage changed!");
      onStageID = event.changedValues["onStageID"];
      console.log(onStageID);
      // if the onstageValue is null and the container exists, then delete the container
      if (onStageID == "empty" || onStageID == null){
        alert("Got empty onStageID");
        //if there is a stage set-up, remove that
        if ($(".onstageContainer_audience")[0]){
            $('.onstageContainer_audience').remove();
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

    // Called when user wants to start participating in the call
    function startPublishing() {
      // Starts publishing user local camera and mic
      // as a stream into the session

      // Create a div for the publisher to replace
      var parentDiv = document.getElementById("myCamera");
      var stubDiv = document.createElement("div");
      stubDiv.id = "opentok_publisher";
      parentDiv.appendChild(stubDiv);

      var publisherProps = {width: PUBLISHER_WIDTH, height: PUBLISHER_HEIGHT, publishAudio: false};
      publisher = TB.initPublisher(apiKey, stubDiv.id, publisherProps);
      session.publish(publisher);

      document.getElementById("status").innerHTML = "Starting your stream...";
      hide("publishLink");
    }

    // Called when user wants to stop participating in the call
    function stopPublishing() {
      if (publisher) {
        // Stop the stream
        session.unpublish(publisher);
        publisher = null;
      }

      document.getElementById("status").innerHTML = "Stopping your stream...";
      hide("unpublishLink");
      hide("signalLink");
      show("publishLink");
    }

    function signal() {
      session.signal();
    }

    function createStage(streamId) {

      //if there is already a video on stage, remove that


      //now, prepare the video to go onstage
      var container = document.createElement('div');
      container.className = "onstageContainer_audience";
      var containerId = "container_" + streamId;
      container.setAttribute("id", containerId);
      document.getElementById("stage").appendChild(container);

      // Create the div that will be replaced by the subscriber
      var div = document.createElement('div');
      var divId = streamId;
      div.setAttribute('id', divId);
      div.style.cssFloat = "top";
      container.appendChild(div);

      console.log("in create stage, the streamId is " + streamId);
      console.log("in create stage, the myStreamId is " + myStreamId);
      //if the current user is on stage, show them an alert box that they are LIVE
      if(streamId == myStreamId){
        $("#onstage_msg").show();
        $("#onstage_msg2").show();
      }
      var subscriberProps = {width: PUBLISHER_WIDTH, height: PUBLISHER_HEIGHT, publishAudio: true};
      subscribers[streamId] = session.subscribe(subscribers[streamId].stream, divId, subscriberProps);
    } 

    function removeStage(streamId) {
       //set the stageID to null, and delete the container
        var containerId = "container_" + streamId;
        console.log(containerId);
        console.log(streamId);
       var container = document.getElementById(containerId);
       console.log(container);
        // Clean up the subscriber container
        document.getElementById("stage").removeChild(container);
    }

    //--------------------------------------
    //  HELPER METHODS
    //--------------------------------------

    //no need to show the subscribe divs, but we do need to subscribe to the created streams
    function addStream(stream) {
      //first check to see if the incoming stream is the current user's stream
       if (stream.connection.connectionId == session.connection.connectionId)
       {
         myStreamId = stream.streamId;
       }
      var container = document.createElement('div');
      container.className = "subscriberContainer";
      var containerId = "container_" + stream.streamId;
      container.setAttribute("id", containerId);
      document.getElementById("audience_subscribers").appendChild(container);

      // Create the div that will be replaced by the subscriber
      var div = document.createElement('div');
      var divId = stream.streamId;
      div.setAttribute('id', divId);
      div.style.cssFloat = "top";
      container.appendChild(div);

      var subscriberProps = {width: 0, height: 0, publishAudio: false};
      subscribers[stream.streamId] = session.subscribe(stream, divId, subscriberProps);
    }

    function removeStream(streamId) {
      if (streamId == myStreamId){
        $("#onstage_msg").hide();
        $("#onstage_msg2").hide();
      }
      var subscriber = subscribers[streamId];
      if (subscriber) {

        session.unsubscribe(subscriber);
        delete subscribers[streamId];

      }
    }

    function show(id) {
      document.getElementById(id).style.display = 'block';
    }

    function hide(id) {
      document.getElementById(id).style.display = 'none';
    }
  