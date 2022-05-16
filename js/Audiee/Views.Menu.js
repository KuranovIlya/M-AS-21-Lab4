define([
    'underscore',
    'backbone',
    'text!templates/Menu.html',
    'text!templates/NewtrackModal.html',
    'text!templates/AlertModal.html',
    'text!templates/InfoModal.html',
    'Audiee/Models.Track',
    'plugins/modal',
    'plugins/dropdown'
], function(_, Backbone, MenuT, ModalT, AlertT, InfoT, TrackM) {

    return Backbone.View.extend({
        el: $('#menu-view ul.nav'),

        template: _.template(MenuT),

        events: {
            'click #m-addtrack'     : 'addTrack',
            'click #m-removetrack'  : 'removeTrack',
            'click #m-fullscreen'   : 'toggleFullscreen',
            'click #m-zoomin'       : 'zoomIn',
            'click #m-zoomout'      : 'zoomOut',
            'click #m-zoomzero'     : 'zoomZero',
            'click #m-copy'         : 'copy',
            'click #m-cut'          : 'cut',
            'click #m-paste'        : 'paste',
            'click #m-delete'       : 'delete',
            'click #m-split'        : 'split',
        },

        initialize: function() {
            _.bindAll(this, 'render', '_fileSelected', '_fileLoaded', 'handleKey');
            $(document).on('keyup', this.handleKey);
            this.enableHotkeys();
            this.el.bind('Audiee:fileLoaded', this._fileLoaded);
            this.render();
        },

        render: function() {
            $(this.el).html(this.template());
        },

        handleKey: function(e) {
            if (!this.hotkeysEnabled)
               return; 

            switch(e.which) {
                case 46:
                    if (e.ctrlKey)
                        $('#m-removetrack').trigger('click');
                    else
                        $('#m-delete').trigger('click');
                    break;
                case 78:
                    $('#m-addtrack').trigger('click');
                    break;
                case 107:
                case 191: 
                    $('#m-zoomin').trigger('click');
                    break;
                case 109:
                case 187:
                    $('#m-zoomout').trigger('click');
                    break;
                case 48:
                case 96:
                    $('#m-zoomzero').trigger('click');
                    break;
                case 67:
                    $('#m-copy').trigger('click');
                    break;
                case 88:
                    $('#m-cut').trigger('click');
                    break;
                case 86:
                    $('#m-paste').trigger('click');
                    break;
                case 70:
                    $('#m-fullscreen').trigger('click');
                    break;
                case 69:
                    $('#m-split').trigger('click');
                    break;
            }
        },

        addTrack: function() {
            var tpl = (_.template(ModalT))(),
                $tpl = $(tpl);

            $tpl.on('change', '#file-name', this._fileSelected)
                .on('hide', function() { $tpl.remove() })
                .modal();
        },

        removeTrack: function() {
            var $track = Audiee.Views.Editor.getActiveTrack();
            if (typeof $track !== 'undefined')
                Audiee.Collections.Tracks.remove($track.data('cid'));
        },
        
        _fileSelected: function(e) {
            try {
                Audiee.Player.loadFile(e.target.files[0], this.el);
            } catch (e) {
                var tpl = (_.template(AlertT))({message: e}),
                    $tpl = $(tpl);

                $tpl.on('hide', function() { $tpl.remove() })
                    .modal();

                $('#newTrackModal').modal('hide');
            }
        },

        _fileLoaded: function(e, audioBuffer, file) {
            e.stopPropagation();
            $('#newTrackModal').modal('hide');

            var name = 'Track ' + Audiee.Collections.Tracks.getIndexCount();
                track = new TrackM({buffer: audioBuffer, file: file, name: name});
            Audiee.Collections.Tracks.add(track);
        },

        zoomIn: function() {
            Audiee.Display.zoomIn();
            Audiee.Views.Tracks.trigger('Audiee:zoomChange');
            Audiee.Views.Timeline.trigger('Audiee:zoomChange');
        },

        zoomOut: function() {
            Audiee.Display.zoomOut();
            Audiee.Views.Tracks.trigger('Audiee:zoomChange');
            Audiee.Views.Timeline.trigger('Audiee:zoomChange');
        },

        zoomZero: function() {
            Audiee.Display.zoomZero();
            Audiee.Views.Tracks.trigger('Audiee:zoomChange');
            Audiee.Views.Timeline.trigger('Audiee:zoomChange');
        },

        toggleFullscreen: function() {
            var $html = $('html');

            if ($html.hasClass('fullscreen')) 
                document.webkitCancelFullScreen();
            else
                $html[0].webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            
            $html.toggleClass('fullscreen');
        },

        copy: function() {
            Audiee.Views.Editor.setClipboard();
        },

        cut: function() {
            Audiee.Views.Editor.setClipboard();
            this.delete();
        },

        paste: function() {
            Audiee.Views.Editor.pasteClipboard();
        },

        split: function() {
            Audiee.Views.Editor.splitClip();
        },

        delete: function() {
            Audiee.Views.Editor.deleteSelection();
        },

        enableHotkeys: function() {
            this.hotkeysEnabled = true;
        },

        disableHotkeys: function() {
            this.hotkeysEnabled = false;
        }
    });
});