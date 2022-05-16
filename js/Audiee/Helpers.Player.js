define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/AlertModal.html',
    'plugins/modal'
], function($, _, Backbone, AlertT) {
    return (function() {
        function Player() {
            if (typeof webkitAudioContext === 'undefined' && typeof AudioContext === 'undefined') {
                var tpl = (_.template(AlertT))({
                    message: 'Ваш браузер не поддерживается.'
                });
                $(tpl).modal();
            } else {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }

            this.nodes     = [];
            this.gainNodes = {};
            this.playing   = false;
            this.playbackFrom;
            this.playbackPositionInterval;
        }

        Player.prototype.initTrack = function(cid) {
            if (typeof this.gainNodes[cid] === 'undefined') {
                this.gainNodes[cid] = this.context.createGain();
                this.gainNodes[cid].connect(this.context.destination);
            }
        };

        Player.prototype.releaseTrack = function(cid) {
           this.gainNodes[cid].disconnect(this.context.destination);
           delete this.gainNodes[cid];
        };

        Player.prototype.play = function() {
            var that = this,
                currentTime = this.context.currentTime;

            this.playbackFrom = currentTime;

            if (Audiee.Views.Editor.isActiveTrack())
                this.playbackFrom -= Audiee.Views.Editor.getCursor();

            if (this.playing)
                this.stop();

            Audiee.Collections.Tracks.each(function(track) {
                var cid = track.cid,
                    gainNode = that.gainNodes[cid];

                track.clips.each(function(clip) {
                    var trackPosition = clip.get('trackPos'),
                        startTime     = clip.get('startTime'),
                        endTime       = clip.get('endTime'),
                        loop          = clip.get('loop'),
                        duration      = clip.get('buffer').duration,
                        inClipStart   = false,
                        cursor        = 0,
                        node, offset;

                    if (Audiee.Views.Editor.isActiveTrack()) {
                        cursor = Audiee.Views.Editor.getCursor();

                        if (trackPosition + clip.clipLength() <= cursor)
                            return;
                        else if (trackPosition < cursor && trackPosition + clip.clipLength() > cursor) {
                            startTime     = (startTime + cursor - trackPosition) % duration;
                            loop          = loop - Math.floor((clip.get('startTime') + cursor - trackPosition) / duration);
                            trackPosition = cursor;
                            inClipStart   = true;
                        }
                    }

                    for (var i = 0; i <= loop; ++i) {
                        node = that.context.createBufferSource();
                        that.nodes.push(node);
                        node.buffer = clip.get('buffer');
                        node.connect(gainNode);

                        if (loop > 0) {
                            if (i === 0) {
                                offset = startTime;
                                duration = duration - offset;
                            } else if (i === loop) {
                                offset = 0;
                                duration = endTime;
                            } else {
                                offset = 0;
                                duration = clip.get('buffer').duration;
                            }
                        } else {
                            offset = startTime;
                            if (inClipStart)
                                duration = endTime - startTime;
                            else
                                duration = clip.clipLength();
                        }

                        node.start(
                            currentTime + trackPosition - cursor,
                            offset,
                            duration
                        );

                        trackPosition += duration;
                    }

                });
            });

            this.playing = true;
            this.playbackPositionInterval = setInterval("Audiee.Player.updatePlaybackPosition(Audiee.Player.playbackFrom)", 50);
        };

        Player.prototype.stop = function() {
            if (this.playing) {
                for (var i = 0, len = this.nodes.length; i < len; ++i) {
                    this.nodes[i].stop(0);
                }
                this.playing = false;
            } else {
                Audiee.Views.Editor.unsetActiveTrack();
                Audiee.Views.PlaybackControls.updateTime();
                Audiee.Display.showPlaybackPosition(0);
            }

            if (typeof this.playbackPositionInterval !== 'undefined')
                clearInterval(this.playbackPositionInterval);
            Audiee.Display.hidePlaybackPosition();
        };

        Player.prototype.updatePlaybackPosition = function(startTime) {
            if (this.playing && typeof startTime !== 'undefined') {
                var newTime = this.context.currentTime - startTime;

                if (newTime >= Audiee.Collections.Tracks.first().get('length'))
                    $('#stop').trigger('click');
                else
                    Audiee.Display.showPlaybackPosition(Audiee.Display.sec2px(newTime));
            } else {
                Audiee.Display.hidePlaybackPosition();
            }
        }

        Player.prototype.volumeChange = function(volume, cid) {
            this.gainNodes[cid].gain.value = volume;
        };

        Player.prototype.loadFile = function(file, el) {
            var reader = new FileReader,
                fileTypes = ['audio/mpeg', 'audio/mp3', 'audio/wave', 'audio/wav'],
                that   = this;

            if (fileTypes.indexOf(file.type) < 0) {
                throw('Неподдерживаемый формат файла!');
            }

            reader.onloadend = function(e) {
                if (e.target.readyState == FileReader.DONE) { // DONE == 2
                    $('.progress').children().width('100%');

                    var onsuccess = function(audioBuffer) {
                        $(el).trigger('Audiee:fileLoaded', [audioBuffer, file]);
                    },
                    onerror = function() {
                        var tpl = (_.template(AlertT))({
                            message: 'Ошибка при загрузке файла ' + file.name + '.'
                        }),
                        $tpl = $(tpl);

                        $tpl.on('hide', function() { $tpl.remove() })
                        .modal();

                        $('#newTrackModal').modal('hide');
                    };

                    that.context.decodeAudioData(e.target.result, onsuccess, onerror);
                }
            };

            reader.onprogress = function(e) {
                if (e.lengthComputable) {
                    $progress = $('.progress', '#newTrackModal');
                    if ($progress.hasClass('hide'))
                        $progress.fadeIn('fast');

                    var loaded = Math.floor(e.loaded / e.total * 100);
                    $progress.children().width(loaded + '%');
                }
            };

            reader.readAsArrayBuffer(file);
        };

        return Player;
    })();
});
