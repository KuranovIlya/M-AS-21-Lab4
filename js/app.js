define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		Backbone = require('backbone'),

		PlayerH = require('Audiee/Helpers.Player'),
		DisplayH = require('Audiee/Helpers.Display'),

		ProjectM = require('Audiee/Models.Project'),

		TracksC = require('Audiee/Collections.Tracks'),

		PlaybackControlsV = require('Audiee/Views.PlaybackControls'),
		EditableNameV = require('Audiee/Views.EditableName'),
		EditorV = require('Audiee/Views.Editor'),
		TracksV = require('Audiee/Views.Tracks'),
		MenuV = require('Audiee/Views.Menu'),
		TimelineV = require('Audiee/Views.Timeline'),

		AlertT = require('text!templates/AlertModal.html');

		require('plugins/modal');


	var Audiee = {
		Collections: {},
		Models: {},
		Views: {},
	};
	Audiee.Display = new DisplayH;
	Audiee.Player = new PlayerH;

	var init = function() {
		window.Audiee = Audiee;
		
		Audiee.Collections.Tracks = new TracksC;
		
		Audiee.Models.Project = new ProjectM;
		
		Audiee.Views.Editor = new EditorV({
			model: Audiee.Models.Project
		});	
		
		Audiee.Views.Timeline = new TimelineV;
		
		Audiee.Views.Tracks = new TracksV({
			collection: Audiee.Collections.Tracks,
			el: '#tracks'
		}).render();											
		
		new EditableNameV({
			model: Audiee.Models.Project,
			el: '#project-name',
			hasColor: false
		});
		
		Audiee.Views.PlaybackControls = new PlaybackControlsV({
			model: Audiee.Models.Project
		});

		if (typeof webkitAudioContext !== 'undefined' || typeof AudioContext !== 'undefined') 
			Audiee.Views.Menu = new MenuV;

		window.onbeforeunload = function(e) {
			e = e || window.event;

			if (e) 
		    	e.returnValue = 'При переходе на другую страницу все данные будут потеряны.';

			return 'При переходе на другую страницу все данные будут потеряны.';
		};
	};
	
	return {	
		initialize: init
	};
});