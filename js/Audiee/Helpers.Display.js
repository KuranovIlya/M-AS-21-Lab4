define([
    'jquery',
    'underscore',
    'backbone',
    'plugins/modal'
], function($, _, Backbone, AlertT) {
    return (function() {
        function Display() {
            this.zoomLevel = 1;
            this.scale = 20; 
            this.subpixels = 5;            
            this.playbackCursorFollowing = true;
        }

        Display.prototype.zoomOut = function() {
            if (this.zoomLevel * 1.5 < 60)
                this.zoomLevel *= 1.5;
        };

        Display.prototype.zoomIn = function() {
            if (this.zoomLevel / 1.5 > 0.005)
                this.zoomLevel /= 1.5;
        };

        Display.prototype.zoomZero = function() {
            this.zoomLevel = 1;
        };

        Display.prototype.px2sec = function(px) {
            return px * this.zoomLevel / this.scale;
        };

        Display.prototype.sec2px = function(sec) {
            return sec / this.zoomLevel * this.scale;
        };

        Display.prototype.getIntervals = function(frame) {
            var mainInterval = Math.ceil(this.px2sec(frame * 100)),
                subInterval;
            
            mainInterval =  mainInterval >  9000 ?   120 :  // 2 минуты
                            mainInterval >  6000 ?    60 :  // 1 минута
                            mainInterval >  3000 ?    30 :  // 30 секунд
                            mainInterval >  1500 ?    20 :  // 20 секунд
                            mainInterval >   800 ?    10 :  // 10 секунд
                            mainInterval >   300 ?     5 :  //  5 секунд
                            mainInterval >   150 ?     2 :  //  2 секунды
                            mainInterval >    60 ?     1 :  //  1 секунда
                            mainInterval >    30 ?   0.5 :  //  0.500 секунды
                            mainInterval >     5 ?   0.2 :  //  0.200 секунды
                                                     0.1 ;  //  0.100 секунды

            subInterval =   mainInterval ==  120 ? 4 :
                            mainInterval ==   60 ? 4 :
                            mainInterval ==   30 ? 3 :  
                            mainInterval ==   20 ? 4 :
                            mainInterval ==   10 ? 4 :
                            mainInterval ==    5 ? 5 :
                            mainInterval ==    2 ? 4 :
                            mainInterval ==    1 ? 4 :
                            mainInterval ==  0.5 ? 5 :
                            mainInterval ==  0.2 ? 4 :
                                                   5 ;

            return {
                interval : mainInterval,
                subdivision : subInterval
            };
        };

        Display.prototype.getSubinterval = function(frame) {
        };

        Display.prototype.frameRMS = function(buffer, index, frame) {
            var rms = 0;
            for (var i = 0; i < frame; ++i) {
                rms += buffer[index + i] * buffer[index + i];
            }
            return Math.sqrt(rms / frame);
        };

        Display.prototype.frameMax = function(buffer, index, frame) {
        };

        Display.prototype.clearDisplay = function(canvas, from, to) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(from || 0, 0, to || canvas.width, canvas.height);
        };

        Display.prototype.drawSound = function(canvas, audioBuffer, totalWidth, offset) {
            var ctx   = canvas.getContext('2d'),
                frame = audioBuffer.length / this.sec2px(audioBuffer.duration) / this.subpixels,
                ch1   = audioBuffer.getChannelData(0),
                ch2   = undefined,
                mid   = canvas.height / 2;
                val   = 0,
                posX  = 0,
                i     = (offset * frame * this.subpixels) % audioBuffer.length;

            if (audioBuffer.numberOfChannels > 1)
                ch2 = audioBuffer.getChannelData(1);
            
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(posX, mid);

            while(posX <= canvas.width) {
                val = ch1[Math.floor(i)];

                i = (i + frame) % audioBuffer.length;

                ctx.lineTo(posX, (val * mid) + mid);

                if (i >= 0 && i <= frame) {
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillRect(posX, 0, 1, 10);
                    ctx.fillRect(posX, canvas.height - 10, 1, 10);
                    ctx.globalCompositeOperation = 'source-over';
                }

                posX += 1 / this.subpixels;
            }

            ctx.stroke();
        };

        Display.prototype.drawCursor = function(canvas, position) {
            var ctx = canvas.getContext('2d');
            position += 0.5;
            ctx.strokeStyle = '#ff8000';
            ctx.beginPath();
            ctx.moveTo(position, 0);
            ctx.lineTo(position, canvas.height);
            ctx.stroke();
        };

        Display.prototype.drawSelection = function(canvas, from, length) {
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(from, 0, length, canvas.height);
        };    

        Display.prototype.showPlaybackPosition = function(position) {
            if (typeof position === 'undefined')
                return;

            var $cursor = $('#playback-position'),
                tracksCount  = Audiee.Collections.Tracks.length,
                trackHeight  = $('.track').height(),
                editorWidth  = Audiee.Views.Editor.el.width(),
                editorScroll = Audiee.Views.Editor.el.scrollLeft();

            Audiee.Views.PlaybackControls.updateTime(this.px2sec(position));
            position += 120;

            $cursor.height(tracksCount * trackHeight)
                   .css('left', position + 'px')
                   .show();
            
            if (this.playbackCursorFollowing && ((position > (editorScroll + editorWidth)) || position < editorScroll)) {
                Audiee.Views.Editor.el.scrollLeft(position - 120);
            }
        };

        Display.prototype.hidePlaybackPosition = function() {
            $('#playback-position').hide();
        };

        return Display;
    })();
});