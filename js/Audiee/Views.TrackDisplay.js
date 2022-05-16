define([
    'jquery',
    'underscore',
    'backbone',
], function($, _, Backbone) {
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };

    return Backbone.View.extend({
        tagName: 'div',
        className: 'track-display',
        wrapperName: 'display-wrapper',
        wrapperClass: '.display-wrapper',
        maxWidth: 20000,

        template: _.template(
            '<canvas width="{{ width }}" height="{{ height }}">' +
                'Your browser does not support HTML5 canvas.' +
            '</canvas>'
        ),

        initialize: function() {
            _.bindAll(this,
                'render',
                'renderDisplay',
                'renderCursor',
                'renderSelection',
                'cursor',
                'selection',
                'contextMenu'
            );
            this.model.bind('Audiee:zoomChange', this.renderDisplay);

            $(this.el)
                .on('contextmenu', this.wrapperClass, this.contextMenu)
                .on('mousedown', this.wrapperClass, this.cursor)
                .on('mouseup', this.wrapperClass, this.selection);

            this.render();
        },

        render: function() {
            var $wrapperV = $('<div class="' + this.wrapperName + '">'),
                $el = $(this.el);

            $el.append($wrapperV);
            this.renderDisplay();

            return this;
        },

        renderDisplay: function() {
            var width = Audiee.Display.sec2px(this.model.get('length')),
                maxWidth = this.maxWidth,
                height = 100,
                $el = $(this.el),
                $wrapperV = $el.find(this.wrapperClass);

            $el.width(width);
            $wrapperV.children().detach();

            do {
                $wrapperV.append(this.template({
                    width: (width > maxWidth) ? maxWidth : width,
                    height: height
                }));

                width -= maxWidth;
            } while (width > 0);

            this.clearDisplay();
            this.renderCursor();
            this.renderSelection();
        },

        cursor: function(e) {
            var $track = $(this.el).parent('.track'),
                $canvasArray = $(this.wrapperClass, this.el).children('canvas');

            if (!e.shiftKey) {
                var index = $canvasArray.index($(e.target)),
                    offX = e.offsetX === undefined ? e.originalEvent.layerX : e.offsetX,
                    offset = offX + index * this.maxWidth,
                    position = offset % this.maxWidth;

                this.clearDisplay();
                Audiee.Views.Editor.setActiveTrack($track);
                Audiee.Views.Editor.setCursor(Audiee.Display.px2sec(offset));
                Audiee.Views.Editor.unsetMultiSelection();
                this.renderCursor();
            } else {
                this.selection(e);
            }

            $(this.wrapperClass).on('mousemove', this.selection);
        },

        renderCursor: function() {
            if (!Audiee.Views.Editor.isActiveTrack())
                return;

            var $track = Audiee.Views.Editor.getActiveTrack(),
                $canvasArray = $(this.wrapperClass, $track).children('canvas'),
                position = Audiee.Display.sec2px(Audiee.Views.Editor.getCursor()),
                index = Math.floor(position / this.maxWidth);

            Audiee.Display.drawCursor($canvasArray.eq(index)[0], position % this.maxWidth);
        },

        selection: function(e) {
            if (Audiee.Views.Editor.isMoving())
                return;

            if (e.type === 'mouseup')
                $(this.wrapperClass).off('mousemove');

            var $track = $(e.target).parents('.track'),
                $canvasArray = $track.find(this.wrapperClass).children('canvas'),
                offX = e.offsetX === undefined ? e.originalEvent.layerX : e.offsetX,
                selectionTo = offX + $canvasArray.index($(e.target)) * this.maxWidth;

            if (Audiee.Views.Editor.isSelection())
                this.clearDisplay();

            if (e.shiftKey) {
                var from = Audiee.Views.Editor.getCursor(),
                    to = Audiee.Views.Editor.getSelectionTo(),
                    middle = Audiee.Display.sec2px(from + (to - from) / 2);
                if (selectionTo >= middle) {
                    Audiee.Views.Editor.setSelectionTo(Audiee.Display.px2sec(selectionTo), true);
                } else {
                    Audiee.Views.Editor.setSelectionFrom(Audiee.Display.px2sec(selectionTo));
                }
            } else {
                Audiee.Views.Editor.setSelectionTo(Audiee.Display.px2sec(selectionTo));
            }

            if (Audiee.Views.Editor.isActiveTrack() && Audiee.Views.Editor.getActiveTrack().data('cid') !== $track.data('cid')) {
                Audiee.Views.Editor.setMultiSelection($track);
            } else {
                Audiee.Views.Editor.unsetMultiSelection();
            }

            this.renderSelection();
        },

        renderSelection: function() {
            var selectionFrom = Audiee.Display.sec2px(Audiee.Views.Editor.getCursor()),
                selectionTo = Audiee.Display.sec2px(Audiee.Views.Editor.getSelectionTo()),
                indexFrom = Math.floor(selectionFrom / this.maxWidth),
                indexTo = Math.floor(selectionTo / this.maxWidth),
                $tracks = $('.track'),
                that = this,
                from, len, tmp, $canvasArray;

            if (!isNaN(selectionFrom) && selectionFrom !== selectionTo) {
                var index1 = $tracks.index(Audiee.Views.Editor.getActiveTrack()),
                    index2 = index1;

                if (Audiee.Views.Editor.isMultiSelection()) {
                    index2 = $tracks.index(Audiee.Views.Editor.getMultiSelection());
                    if (index1 > index2) {
                        tmp = index1;
                        index1 = index2;
                        index2 = tmp;
                    }
                }

                selectionTo %= this.maxWidth;
                $tracks.slice(index1, ++index2).each(function() {
                    $canvasArray = $(this).find(that.wrapperClass).children('canvas');
                    from = selectionFrom % that.maxWidth;
                    len = (indexFrom !== indexTo) ? (that.maxWidth - from) : (selectionTo - from);

                    for (var index = indexFrom; index <= indexTo; ++index) {
                        Audiee.Display.drawSelection($canvasArray.eq(index)[0], from, len);
                        from = 0;
                        len = (index != indexTo - 1) ? that.maxWidth : selectionTo;
                    }
                });
            }
        },

        clearDisplay: function() {
            var selectionFrom = Audiee.Display.sec2px(Audiee.Views.Editor.getCursor()),
                selectionTo = Audiee.Display.sec2px(Audiee.Views.Editor.getSelectionTo()) + 1,
                indexFrom = Math.floor(selectionFrom / this.maxWidth),
                indexTo = Math.floor(selectionTo / this.maxWidth),
                $tracks = $('.track'),
                that = this,
                from, len, tmp, $canvasArray;

            if (!isNaN(selectionFrom)) {
                var index1 = $tracks.index(Audiee.Views.Editor.getActiveTrack()),
                    index2 = index1;

                if (Audiee.Views.Editor.isMultiSelection()) {
                    index2 = $tracks.index(Audiee.Views.Editor.getMultiSelection());
                    if (index1 > index2) {
                        tmp = index1;
                        index1 = index2;
                        index2 = tmp;
                    }
                }

                selectionTo %= this.maxWidth;
                $tracks.slice(index1, ++index2).each(function() {
                    $canvasArray = $(this).find(that.wrapperClass).children('canvas');
                    from = selectionFrom % that.maxWidth;
                    len = (indexFrom !== indexTo) ? (that.maxWidth - from) : (selectionTo - from);

                    for (var index = indexFrom; index <= indexTo; ++index) {
                        Audiee.Display.clearDisplay($canvasArray.eq(index)[0], from, len);
                        from = 0;
                        len = (index != indexTo - 1) ? that.maxWidth : selectionTo;
                    }
                });
            }
        },

        contextMenu: function(e) {
            e.preventDefault();
        },
    });
});
