define([
    'jquery',
    'underscore',
    'backbone',
    'plugins/button'
], function($, _, Backbone) {
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };

    return Backbone.View.extend({
        tagName: 'div',
        className: 'track-controls',

        template: _.template(
            '<button class="btn mute {{ muted }}" data-toggle="button" title="Заглушить">M</button>' +
            '<button class="btn solo {{ solo }}" data-toggle="button" title="Соло">S</button>' +
            '<input type="range" class="volume" value="{{ gain }}" title="volume">'
        ),

        initialize: function() {
            _.bindAll(this, 'render', 'volumeChange', 'solo', 'mute');
            this.render();            
            $('input.volume', this.el).on('change', this.volumeChange);
            $('button.mute', this.el).on('click', this.mute);
            $('button.solo', this.el).on('click', this.solo);
        },

        render: function() {
            var gain = this.model.get('gain') * 100,
                muted = (this.model.get('muted')) ? 'active' : '',
                solo = (this.model.get('solo')) ? 'active' : '';

            $(this.el).html(this.template({
                gain: gain,
                muted: muted,
                solo: solo
            }));

            $(this.el).find('.btn').button();

            return this;
        },

        volumeChange: function() {
            var volume = $('input.volume', this.el).val() / 100,
                cid = $(this.el).parents('.track').data('cid');

            this.model.set('gain', volume);

            if (!Audiee.Collections.Tracks.isAnySolo() || this.model.get('solo'))
                Audiee.Player.volumeChange(volume, cid);  

            if ($('button.mute', this.el).hasClass('active')) {
                $('button.mute', this.el).button('toggle');
                this.mute();
            }
                
        },

        mute: function() {
            var muted = this.model.get('muted');
            this.model.set('muted', !muted);
            if (muted) {
                if (!Audiee.Collections.Tracks.isAnySolo() || this.model.get('solo'))
                    Audiee.Player.volumeChange(this.model.get('gain'), this.model.cid);
            } else {
                if (!this.model.get('solo'))
                    Audiee.Player.volumeChange(0, this.model.cid);
            }
        },

        solo: function() {
            this.model.set('solo', !this.model.get('solo'));
            var soloTracks = Audiee.Collections.Tracks.filter(
                                function(model) { 
                                    return model.get('solo') === true;
                                }
                            ),
                otherTracks = Audiee.Collections.Tracks.filter(
                                function(model) {
                                    return model.get('solo') === false;
                                }
                            );

            if (soloTracks.length === 0) {
                Audiee.Collections.Tracks.each(function(model) {
                    if (model.get('muted') === false) {
                        Audiee.Player.volumeChange(model.get('gain'), model.cid);
                    } else {
                        Audiee.Player.volumeChange(0, model.cid);
                    }
                });
            } else {
                _.each(soloTracks, function(model) {
                    Audiee.Player.volumeChange(model.get('gain'), model.cid);
                });
                _.each(otherTracks, function(model) {
                    Audiee.Player.volumeChange(0, model.cid);
                });
            }
        }
    });
});