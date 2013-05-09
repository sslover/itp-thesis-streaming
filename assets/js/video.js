function embedPlayer(divId, width, height, callbackFunction) {
			// For version detection, set to min. required Flash Player version, or 0 (or 0.0.0), for no version detection. 
			var swfVersionStr = "11.4.0";
			// To use express install, set to playerProductInstall.swf, otherwise the empty string. 
			var xiSwfUrlStr = "myplayer/playerProductInstall.swf";
			var flashvars = {};
			var params = {};
			params.quality = "high";
			params.bgcolor = "#000000";
			params.allowscriptaccess = "sameDomain";
			params.allowfullscreen = "true";
			var attributes = {};
			attributes.id = divId;
			attributes.name = divId;
			attributes.align = "middle";
			swfobject.embedSWF(
				"myplayer/SimpleStreamingVideoPlayer.swf", divId, 
				width, height, swfVersionStr, xiSwfUrlStr, 
				flashvars, params, attributes, callbackFunction);
		}
		
		function playerInit(playerObjectId) {
			//alert(playerObjectId);
			if (playerObjectId == mainPlayer.player_id) {
				mainPlayer.player_object.startStream(streamingServerAndApp, streams[0].main);
			} else {
				//alert("else");
				for (var t = 0; t < thumbPlayers.length; t++) {
					//alert("does " + playerObjectId + " == " + thumbPlayers[t].player_id);
					if (playerObjectId == thumbPlayers[t].player_id) {
						thumbPlayers[t].player_object.startStream(streamingServerAndApp, streams[t].thumb);
						break;
					}
				}
			}
		}
		
		function playerClicked(playerObjectId) {
			console.log("playerClicked " + playerObjectId);
			for (var t = 0; t < thumbPlayers.length; t++) {
				if (playerObjectId == thumbPlayers[t].player_id) {
					mainPlayer.player_object.startStream(streamingServerAndApp, streams[t].main);
					break;
				}
			}
		}

		function Stream(_main, _thumb) {
			this.main = _main;
			this.thumb = _thumb;
		}
		
		var streams = new Array();
		streams[0] = new Stream("ptzcamera.stream","ptzcamera.stream");
		streams[1] = new Stream("camera3.stream","thumb3.stream");
		streams[2] = new Stream("camera4.stream","thumb4.stream");
		streams[3] = new Stream("camera7.stream","thumb7.stream");
		streams[4] = new Stream("camera6.stream","thumb6.stream");

		var streamingServerAndApp = "rtmp://128.122.151.16/live/";

		function Player(_id, _object) {
			this.player_id = _id;
			this.player_object = _object;
		}			
		
		var mainPlayer = null;
		var thumbPlayers = new Array();

		$(document).ready(function() {
			embedPlayer("mainPlayer",480,270, function(e) {
				if (e.success) {
					mainPlayer = new Player(e.id, e.ref);	
				}
			});

			for (var i = 0; i < 5; i++) {
				embedPlayer("thumbPlayer"+(i+1),160,90, function(e) {
					if (e.success) {
						thumbPlayers.push(new Player(e.id, e.ref));
					}
				});
			}
							
		});