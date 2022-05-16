define([
    'underscore',
    'backbone'
], function(_, Backbone) {
    var Project = Backbone.Model.extend({
        defaults: {
            name: 'Audio',
            created: Date.now(),
            user: 'Guest', 
            changed: false
        },

        initialize: function() {
            this.bind('error', function(model, err) {
                alert(err);
            });
        },

        validate: function(attribs) {
            var regex = /^(\w+[\ ]*)+$/;
            if (!regex.test(attribs.name))
                return "Недопустимое название файла.";
        }
    });

    return Project;
});