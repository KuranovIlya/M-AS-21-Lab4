define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };

    return Backbone.View.extend({
        el: $('#time-line'),

        template: _.template(
            '<canvas width="{{ width }}" height="{{ height }}">' +
                'Your browser does not support HTML5 canvas.' +
            '</canvas>'
        ),

        initialize: function() {
            _.bindAll(this, 
               'render'
            );

            this.bind('Audiee:scroll', this.drawScale);
            this.bind('Audiee:zoomChange', this.drawScale);
            $(window).on('resize', this.render);
            this.render();
        },

        render: function() {
            var $el = $(this.el),
                width = $el.width(),
                height = $el.height();

            $el.html(this.template({width: width, height: height}));
            this.drawScale();
            return this;
        },

        drawScale: function() {
            var $el = $(this.el),
                ctx = $el.children('canvas')[0].getContext('2d'),
                width = $el.width(),
                height = $el.height(),
                minFrame = 50,
                intervals = Audiee.Display.getIntervals(minFrame),
                interval = Audiee.Display.sec2px(intervals.interval),
                sub = interval / intervals.subdivision,
                offsetLeft = Audiee.Views.Editor.scrollLeftOffset(),
                timeLeft = Audiee.Display.px2sec(offsetLeft),
                i, t, min, sec, millisec;

            ctx.fillStyle = '#444';
            ctx.font="0.8em sans-serif";
            ctx.clearRect(0, 0, width, height);

            i = sub - (offsetLeft % sub);
            for (; i < width; i += sub) 
                ctx.fillRect(i, height, 1, -5);
            

            i = (offsetLeft > 0) ? interval - (offsetLeft % interval) : 0;
            timeLeft += Audiee.Display.px2sec(i);

            for (; i < width; i += interval) {
                min = Math.floor(timeLeft / 60);
                sec = Math.floor(timeLeft % 60);
                if (intervals.interval < 1)
                    millisec = Math.round((timeLeft % 1) * 10) % 10;

                t = min + ':';
                t +=(sec < 10) ? '0' + sec : sec;
                if (intervals.interval < 1) 
                    t += ',' + millisec + '0';

                ctx.fillRect(i, height, 1, -12);
                ctx.fillText(t, i, 13);

                timeLeft += intervals.interval;
            }
        }
    });
});