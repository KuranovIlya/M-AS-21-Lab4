define([
	'underscore',
	'backbone'
], function(_, Backbone) {
	var Clip = Backbone.Model.extend({
		defaults: {
			name: '',
			color: '#4ecdc4',
			trackPos: 0,
			startTime: 0,
			endTime: 0,
			loop: 0
		},

		initialize: function() {
		},

		clipLength: function() {
            return this.get('endTime') 
              - this.get('startTime') 
              + this.get('loop')
              * this.get('buffer').duration;
        },

        duplicate: function() {
        	var newClip = this.clone(),
        		newTrackPos = newClip.get('trackPos') + this.clipLength();
        	newClip.set('trackPos', newTrackPos);
        	this.collection.addDuplicate(newClip);
        }
	});

	return Clip;
});