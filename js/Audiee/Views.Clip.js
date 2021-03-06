define([
    'jquery',
    'underscore',
    'backbone',
    'Audiee/Views.ClipDisplay',
    'Audiee/Views.EditableName',
    'drag_resize'
], function($, _, Backbone, ClipDisplayV, EditableNameV) {
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };

    return Backbone.View.extend({
        tagName: 'div',
        className: 'clip',

        initialize: function() {
            _.bindAll(this,
                'render',
                'remove',
                'soundwaveRender',
                'positionRender',
                'updatePosition',
                'scrollChange',
                '_clipWidth'
            );
            this.model.bind('change:startTime', this.soundwaveRender);
            this.model.bind('change:endTime', this.soundwaveRender);
            this.model.bind('change:trackPos', this.positionRender);
            this.model.bind('destroy', this.remove);
            this.model.collection.bind('Audiee:zoomChange', this.render);
            this.model.collection.bind('Audiee:scroll', this.scrollChange);

            this.editableName = new EditableNameV({
                model: this.model,
                className: 'clip-name',
                hasColor: true
            }),
            this.clipDisplay  = new ClipDisplayV({
                model: this.model
            });

            $(this.el).draggable({
                addClasses: false,
                axis: 'x',
                containment: 'parent',
                handle: 'div.clip-name',
                cursor: 'move',
                start: this.startMoving,
                drag: this.scrollChange,
                stop: this.updatePosition,
            }).css('position', 'absolute');
        },

        render: function() {
            var left  = Audiee.Display.sec2px(this.model.get('trackPos')),
                width = this._clipWidth(),
                that  = this;

            $(this.el).children().detach().end()
                .css('left', left + 'px')
                .width(width)
                // .resizable('destroy')
                .append(this.editableName.el)
                .append('<div class="ui-resizable-handle ui-resizable-w">')
                .append('<div class="ui-resizable-handle ui-resizable-e">')
                .append(this.clipDisplay.render(width).el)
                .resizable({
                    handles: {
                        w: '.ui-resizable-w',
                        e: '.ui-resizable-e'
                    },
                    containment: 'parent',
                    resize: function(e, ui) {
                        var duration = that.model.get('buffer').duration,
                            loop     = that.model.get('loop'),
                            end      = that.model.clipLength(),
                            newStartTime, newEndTime, newTrackPos;

                        Audiee.Views.Editor.movingOn();

                        if (ui.originalPosition.left === ui.position.left) {
                            newEndTime = (Audiee.Display.px2sec(ui.size.width) + that.model.get('startTime')) % duration;
                            loop       = loop + Math.floor((that.model.get('endTime') + Audiee.Display.px2sec(ui.size.width) - end) / duration);
                        } else {
                            newStartTime = Audiee.Display.px2sec(ui.position.left) - that.model.get('trackPos');

                            if (that.model.get('trackPos') <= 0.05) {
                                if (newStartTime > 0) {
                                    newStartTime += that.model.get('startTime');
                                    newTrackPos  = Audiee.Display.px2sec(ui.position.left);
                                } else {
                                    newStartTime = that.model.get('startTime');
                                    newTrackPos  = 0;
                                }
                            } else {
                                newStartTime += that.model.get('startTime');
                                newTrackPos  = Audiee.Display.px2sec(ui.position.left);
                            }

                            newStartTime %= duration;
                            newStartTime = (newStartTime < 0) ? duration + newStartTime : newStartTime;
                            loop         = loop - Math.floor((that.model.get('startTime') + newTrackPos - that.model.get('trackPos')) / duration);
                        }

                        that.model.set('loop', loop);
                        if (typeof newTrackPos !== 'undefined')
                            that.model.set('trackPos', newTrackPos);
                        if (typeof newStartTime !== 'undefined')
                            that.model.set('startTime', newStartTime);
                        if (typeof newEndTime !== 'undefined')
                            that.model.set('endTime', newEndTime);
                    },
                    stop: function() {
                        var from     = that.model.get('trackPos'),
                            to       = from + that.model.clipLength(),
                            trackCid = $(that.el).parents('.track').data('cid');

                        Audiee.Views.Editor.movingOff();
                        Audiee.Collections.Tracks.deleteSelection(from, to, trackCid, that.model.cid);
                        that.soundwaveRender();
                    }
                });

            this.scrollChange();

            return this;
        },

        remove: function() {
            $(this.el).remove();
        },

        soundwaveRender: function() {
            $(this.el).width(this._clipWidth());
            this.clipDisplay.render(this._clipWidth());
        },

        positionRender: function() {
            var left = Audiee.Display.sec2px(this.model.get('trackPos'));
            $(this.el).css('left', left + 'px');
        },

        startMoving: function() {
            Audiee.Views.Editor.movingOn();
        },

        updatePosition: function(e) {
            var from     = Audiee.Display.px2sec(e.target.offsetLeft),
                to       = from + this.model.clipLength(),
                trackCid = $(this.el).parents('.track').data('cid');

            Audiee.Collections.Tracks.deleteSelection(from, to, trackCid, this.model.cid);
            this.model.set('trackPos', from);
            Audiee.Views.Editor.movingOff();
        },

        scrollChange: function(e, ui) {
            var scrollLeft = Audiee.Views.Editor.scrollLeftOffset(),
                left       = Audiee.Display.px2sec(scrollLeft),
                trackPos   = (typeof ui !== 'undefined') ? Audiee.Display.px2sec(ui.position.left) : this.model.get('trackPos'),
                width      = this._clipWidth(),
                offset     = left - trackPos;

            if (left > trackPos && left < (trackPos + width)) {
                $(this.editableName.el).css('padding-left', Audiee.Display.sec2px(offset))
                    .find('.name-content').text('...' + this.model.get('name'));
            } else {
                $(this.editableName.el).css('padding-left', 0)
                    .find('.name-content').text(this.model.get('name'));
            }
        },

        _clipWidth: function() {
            return Audiee.Display.sec2px(this.model.clipLength());
        },
    });
});
