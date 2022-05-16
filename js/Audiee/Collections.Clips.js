define([
    'underscore',
    'backbone',
    'Audiee/Models.Clip'
], function(_, Backbone, ClipM) {
	return Backbone.Collection.extend({
		model: ClipM,

        getSnapshot: function(from, to) {
            var snapshot = [],
                trackPos, end, offset, startTime, endTime, loop, duration;

            this.each(function(model) {
                trackPos = model.get('trackPos');
                end      = trackPos + model.clipLength();
                
                if (trackPos < to && end > from) {
                    loop      = model.get('loop');
                    duration  = model.get('buffer').duration;
                    offset    = (trackPos < from) ? 0 : trackPos - from;
                    startTime = model.get('startTime');
                    endTime   = model.get('endTime');

                    if (trackPos < from) {
                        loop -= Math.floor((startTime + from - trackPos) / duration);
                        startTime = (startTime + from - trackPos) % duration;
                    }

                    if (end > to) {
                        loop += Math.floor((endTime + to - end) / duration);
                        endTime = (endTime - (end - to)) % duration;
                        if (endTime < 0)
                            endTime += duration;
                    }

                    snapshot.push({
                        offset:     offset,
                        startTime:  startTime,
                        endTime:    endTime,
                        loop:       loop,
                        name:       model.get('name'),
                        color:      model.get('color'),
                        buffer:     model.get('buffer')
                    });
                }
            });
            
            return snapshot;
        },

        deleteSelection: function(from, to, except) {
            var that = this,
                deleteRequest = [],
                trackPos, end, startTime, endTime, loop, duration, newLoop, newEndTime, newStartTime;

            this.each(function(model) {
                if (model.cid !== except) {
                    trackPos = model.get('trackPos');
                    end      = trackPos + model.clipLength();
                    
                    if (trackPos < to && end > from) {  // clip within the range of selection
                        loop      = model.get('loop');
                        duration  = model.get('buffer').duration;
                        startTime = model.get('startTime');
                        endTime   = model.get('endTime');

                        if (trackPos < from && end > to) {
                            newEndTime = (startTime + from - trackPos) % duration;              
                            newLoop    = loop + Math.floor((endTime + from - end) / duration);    
                            model.set('loop', newLoop);
                            model.set('endTime', newEndTime);

                            newStartTime = (startTime + to - trackPos) % duration;              
                            newLoop      = loop - Math.floor((startTime + to - trackPos) / duration);

                            var clip = new ClipM({
                                name:       model.get('name'),
                                color:      model.get('color'),
                                trackPos:   to,
                                startTime:  newStartTime,
                                loop:       newLoop,
                                endTime:    endTime,
                                buffer:     model.get('buffer')
                            });
                            that.add(clip);   
                        } else if (trackPos >= from && end <= to) {
                            deleteRequest.push(model);
                        } else if (trackPos < from && end <= to) {
                            newEndTime = (startTime + from - trackPos) % duration;          
                            newLoop    = loop + Math.floor((endTime + from - end) / duration); 
                            model.set('loop', newLoop);
                            model.set('endTime', newEndTime);
                        } else if (trackPos >= from && end > to) {
                            newStartTime = (startTime + to - trackPos) % duration;          
                            newLoop      = loop - Math.floor((startTime + to - trackPos) / duration);
                            model.set('loop', newLoop);
                            model.set('trackPos', to);
                            model.set('startTime', newStartTime);
                        }
                    }
                }
            });

            this.remove(deleteRequest);    
        },

        addDuplicate: function(clip) {
            var from = clip.get('trackPos'),
                to   = from + clip.clipLength();
            this.deleteSelection(from, to);
            this.add(clip);
        }
	});
});