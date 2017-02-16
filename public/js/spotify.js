var widgetTemplate       = Handlebars.compile(document.getElementById('player-template').innerHTML),
    widgetPlaceholder    = document.getElementById('player'),
    playingCssClass      = 'playing-album',
    audioObject          = null;
    songNumber           = 0;

var fetchTracks = function (albumId, callback) {
    $.ajax({
        url: 'https://api.spotify.com/v1/albums/' + albumId,
        success: function (response) {
            callback(response);
        }
    });
};

var fetchTopTracks = function (artistId, callback) {
    $.ajax({
        url: "https://api.spotify.com/v1/artists/" + artistId + "/top-tracks?country=jp",
        success: function (response) {
            callback(response);
        }
    });
}

var getITunesTopTracks = function (iTunesId, callback) {
    $.ajax({
        dataType: 'JSONP',
        url: "https://itunes.apple.com/lookup?id=" + iTunesId + "&entity=song&country=jp&sort=popular&limit=20",
        success: function (response) {

            // Delete ArtistInfo
            delete response.results[0];

            var trackList = [];
            var result    = [];
            // remove duplicate song
            response.results.forEach(function(val, index, ary) {
                if (!trackList[val.trackName]) {
                    result.push(val);
                }
                trackList[val.trackName] = val;
            });

            callback(result.slice(0, 15));
        }
    });

}

var searchAlbums = function (query) {
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'album',
            market: 'JP',
            limit: 30,
        },
        beforeSend: function() {
            resultsPlaceholder.innerHTML = loading_template(query);
        },
        success: function (response) {
              var result;
              if (response.albums.total > 0) {
                  result = template(response);
              } else {
                  result = notfound_template(response);
              }

            resultsPlaceholder.innerHTML = result;
        }
    });
};

var play = function(callback) {
    setTimeout(function() {
      audioObject.play();
      audioObject.addEventListener('ended', callback);
    }, 450)
}

$('.preview').on('click', function(e) {

    var target = this;

    if (target !== null) {

        if (target.classList.contains(playingCssClass)) {
            audioObject.pause();
        } else {

            if (audioObject) {
                audioObject.pause();
            }

            getITunesTopTracks(target.getAttribute('data-itunes-id'), function(tracks) {

                songNumber = 0;

                $('#nowplaying').removeClass(playingCssClass).removeAttr('id');
                target.classList.add(playingCssClass);
                $(target).attr('id', 'nowplaying');

                function recursive_play() {

                  audioObject = null;

                  // Player Info
                  widgetPlaceholder.innerHTML = widgetTemplate({
                     songName: tracks[songNumber].trackName,
                     artistName: tracks[songNumber].artistName,
                  });

                  // Player appear
                  widgetPlaceholder.classList.add('playing')
                  document.getElementById('player-control').addEventListener('click', function(e) {
                      songControl(e);
                  });

                  // Forward Event
                  document.getElementById('player-forward').addEventListener('click', function(e) {
                    audioObject.pause();
                    if (songNumber < tracks.length - 1) {
                      songNumber++;
                      recursive_play();
                    } else {
                      target.classList.remove(playingCssClass);
                      widgetPlaceholder.classList.remove('playing')
                      widgetPlaceholder.innerHTML = '';
                      songNumber = 0;
                    }
                  });

                  // Backword Event
                  document.getElementById('player-backward').addEventListener('click', function(e) {
                    if (songNumber > 0) {
                      audioObject.pause();
                      songNumber--;
                      recursive_play();
                    }
                  });

                  // Manage Queue
                  if (songNumber + 1 === tracks.length) { //queue end
                    audioObject = new Audio(tracks[songNumber].previewUrl);
                    play(function() {
                      target.classList.remove(playingCssClass);
                      widgetPlaceholder.classList.remove('playing')
                      widgetPlaceholder.innerHTML = '';
                      songNumber = 0;
                    });

                  } else {
                    audioObject = new Audio(tracks[songNumber].previewUrl);
                    play(function() {
                      target.classList.add(playingCssClass);
                      songNumber++;
                      recursive_play();
                    });
                  }
                }

                recursive_play();
            });
        }
    }


});

var songControl = function(e) {

    var btn = e.target;

    if (btn.classList.contains('fa-play')) {
        btn.classList.remove('fa-play')
        audioObject.play();
        btn.classList.add('fa-pause')
    } else if (btn.classList.contains('fa-pause')) {
        btn.classList.remove('fa-pause')
        audioObject.pause();
        btn.classList.add('fa-play')
    }
}
