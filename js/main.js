require.config({
	paths: {
		jquery    	: 'libs/jquery/jquery',
		drag_resize	: 'libs/jquery/jquery-ui.custom.min',
		underscore 	: 'libs/underscore/underscore-min',
		backbone  	: 'libs/backbone/backbone',

		text 		: 'libs/require/text',
		order		: 'libs/require/order',
		plugins		: 'libs/bootstrap'
	},
});

require(['app'], function(App) {
	App.initialize();
});