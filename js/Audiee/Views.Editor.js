define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {

    return Backbone.View.extend({
        el: $('#editor-view'),

        events: {
           'mousewheel' : 'zoomHandler',
           'scroll' : 'scrollHandler'
        },

        initialize: function() {
            _.bindAll(this, 
                'render', 
                'changeTitle', 
                'resizeView', 
                'scrollHandler', 
                'zoomHandler',
                'setClipboard'
            );
            this.model.bind('change:name', this.changeTitle);
            this.moving = false;

            $('title').text(this.model.get('name'));

            $(window).on('resize', this.resizeView);            
            this.resizeView();
        },

        render: function() {
            return this;
        },

        changeTitle: function() {
            $('title').text(this.model.get('name'));
        },

        resizeView: function() {
            var $editorView = $(this.el),
                height = $(window).height() - $editorView.position().top
                            - parseInt($editorView.css('margin-top'));

            $editorView.height(height);
        },

        scrollHandler: function() {
            Audiee.Views.Tracks.trigger('Audiee:scroll');  
            Audiee.Views.Timeline.trigger('Audiee:scroll');
        },

        scrollLeftOffset: function() {
            return $(this.el).scrollLeft();
        },

        scrollTopOffset: function() {
            return $(this.el).scrollTop();
        },

        zoomHandler: function(e) {
            if (e.altKey) {
                e.preventDefault();
                var originalOffset = Audiee.Display.px2sec(e.originalEvent.offsetX);
                (e.originalEvent.wheelDelta < 0) ? Audiee.Display.zoomOut() : Audiee.Display.zoomIn();
                var newOffset = Audiee.Display.sec2px(originalOffset),
                    scrollChange = this.scrollLeftOffset() + newOffset - e.originalEvent.offsetX;
                $(this.el).scrollLeft(scrollChange);
                
                Audiee.Views.Tracks.trigger('Audiee:zoomChange');
                Audiee.Views.Timeline.trigger('Audiee:zoomChange');

                return false;
            }
        },

        movingOn: function() {
            this.moving = true;
        },

        movingOff: function() {
            this.moving = false;
        },

        isMoving: function() {
            return this.moving;        
        },

        setActiveTrack: function($track) {
            this.activeTrack = $track;
            $track.addClass('active').siblings().removeClass('active');
        },

        getActiveTrack: function() {
            return this.activeTrack;
        },

        isActiveTrack: function() {
            return typeof this.activeTrack !== 'undefined';
        },

        unsetActiveTrack: function() {
            Audiee.Views.Tracks.clearDisplays();
            
            if (typeof this.activeTrack !== 'undefined') {
                this.activeTrack.removeClass('active');
                this.activeTrack = undefined;
            }            
        },

        setSelectionFrom: function(position) {
            this.selectionFrom = position;
        },

        setCursor: function(position) {
            this.originalCursor = position;
            this.selectionFrom = position;
            this.selectionTo = position;
        },

        setSelectionTo: function(position, forced) {
            if (typeof forced !== 'undefined') {
                this.selectionTo = position;
            } else {
                if (position < this.originalCursor) {
                    this.selectionFrom = position;
                } else {
                    this.selectionTo = position;
                } 
            }
        },

        isSelection: function() {
            return this.selectionFrom !== this.selectionTo;
        },

        setMultiSelection: function($track) {
            this.multilineTo = $track;
        },

        getMultiSelection: function() {
            return this.multilineTo;
        },

        unsetMultiSelection: function() {
            this.multilineTo = undefined;
        },

        isMultiSelection: function() {
            return typeof this.multilineTo !== 'undefined';
        },

        getCursor: function() {
            return this.selectionFrom;
        },

        getSelectionTo: function() {
            return this.selectionTo;
        },

        setClipboard: function() {
            var clipboard = {},
                $tracks = $('.track'),
                that = this,
                cid;

            if (!isNaN(this.selectionFrom) && this.selectionFrom !== this.selectionTo) {
                clipboard.from = this.selectionFrom;
                clipboard.to = this.selectionTo;
                clipboard.tracks = {};

                var index1 = $tracks.index(this.getActiveTrack()),
                    index2 = index1,
                    tmp;

                if (this.isMultiSelection()) {
                    index2 = $tracks.index(this.getMultiSelection());
                    if (index1 > index2) {
                        tmp = index1;
                        index1 = index2;
                        index2 = tmp;
                    }
                }

                $tracks.slice(index1, ++index2).each(function() {
                    cid = $(this).data('cid');
                    clipboard.tracks[cid] = Audiee.Collections.Tracks.getSnapshot(that.selectionFrom, that.selectionTo, cid);
                });

                this.clipboard = clipboard;
            }
        },

        getClipboard: function() {
            return this.clipboard;
        },

        eraseClipboard: function() {
            this.clipboard = undefined; 
        },

        pasteClipboard: function() {
            var cursor = this.getCursor(),
                clipboard = this.getClipboard();
            
            if (typeof clipboard === 'undefined')
                return;
            
            for (var cid in clipboard.tracks) {
                Audiee.Collections.Tracks.pasteSelection(cid, cursor, clipboard.tracks[cid]);
            }            
        },

        deleteSelection: function() {
            var $tracks = $('.track'),
                that = this,
                cid;

            if (!isNaN(this.selectionFrom) && this.selectionFrom !== this.selectionTo) {
                var index1 = $tracks.index(this.getActiveTrack()),
                    index2 = index1,
                    tmp;

                if (this.isMultiSelection()) {
                    index2 = $tracks.index(this.getMultiSelection());
                    if (index1 > index2) {
                        tmp = index1;
                        index1 = index2;
                        index2 = tmp;
                    }
                }

                $tracks.slice(index1, ++index2).each(function() {
                    cid = $(this).data('cid');
                    Audiee.Collections.Tracks.deleteSelection(that.selectionFrom, that.selectionTo, cid);
                });
            }
        },

        splitClip: function() {
            var $track = this.getActiveTrack(),
                cursor = this.getCursor(),
                cid;

            if (typeof $track !== 'undefined')
                cid = $track.data('cid');

            Audiee.Collections.Tracks.getByCid(cid).deleteSelection(cursor, cursor);
        }
    });
});