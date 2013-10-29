/*
 * Fuel UX Scheduler
 * https://github.com/ExactTarget/fuelux
 *
 * Copyright (c) 2012 ExactTarget
 * Licensed under the MIT license.
 */

define(function(require) {

    var $ = require('jquery');


    // SCHEDULER CONSTRUCTOR AND PROTOTYPE

    var Scheduler = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.scheduler.defaults, options);

        // cache elements
        this.$startDate = this.$element.find('.scheduler-start .datepicker');
        this.$startTime = this.$element.find('.scheduler-start .combobox');

        this.$timeZone = this.$element.find('.scheduler-timezone .select');

        this.$repeatIntervalPanel = this.$element.find('.repeat-interval-panel');
        this.$repeatIntervalTxt = this.$element.find('.repeat-interval-text');
        this.$repeatIntervalSelect = this.$element.find('.repeat-interval .select');
        this.$repeatIntervalSpinner = this.$element.find('.repeat-interval-panel .spinner-input');

        this.$endSelect= this.$element.find('.scheduler-end .select');
        /*this.$hourlyInterval = this.$element.find('input.hours');
         this.$dailyInterval = this.$element.find('input.days');
         this.$weeklyInterval = this.$element.find('input.weeks');
         this.$monthlyInterval = this.$element.find('input.months');*/

        this.$end = this.$element.find('.scheduler-end');
        this.$endAfter = this.$element.find('.scheduler-end .spinner');
        this.$endDate = this.$element.find('.scheduler-end .datepicker');

        // panels
        this.$recurrencePanels = this.$element.find('.recurrence-panel');

        // bind events
        this.$repeatIntervalSelect.on('changed', $.proxy(this.repeatIntervalSelectChanged, this));
        this.$endSelect.on('changed', $.proxy(this.$endSelectChanged, this));

        //initialize sub-controls
        this.$startDate.datepicker();
        this.$endDate.datepicker();
    };

    Scheduler.prototype = {
        constructor: Scheduler,

        value: function() {

            // FREQ = frequency (hourly, daily, monthly...)
            // BYDAY = when picking days (MO,TU,WE,etc)
            // BYMONTH = when picking months (Jan,Feb,March) - note the values should be 1,2,3...
            // BYMONTHDAY = when picking days of the month (1,2,3...)
            // BYSETPOS = when picking First,Second,Third,Fourth,Last (1,2,3,4,-1)

            var interval = this.$repeatIntervalSpinner.val();
            var pattern = '';
            var repeat = this.$repeatIntervalSelect.select('selectedItem').value;
            var startTime = this.$startTime.combobox('selectedItem').text.toLowerCase();
            var timeZone = this.$timeZone.select('selectedItem');
            var getFormattedDate = function(dateObj, dash){
                var fdate = '';
                var item;

                fdate += dateObj.getFullYear();
                fdate += dash;
                item = dateObj.getMonth();
                fdate += (item<10) ? '0' + item : item;
                fdate += dash;
                item = dateObj.getDate();
                fdate += (item<10) ? '0' + item : item;

                return fdate;
            };
            var day, days, hasAm, hasPm, month, pos, startDateTime, type;

            startDateTime = '' + getFormattedDate(this.$startDate.datepicker('getDate'), '-');

            startDateTime += 'T';
            hasAm = !!(startTime.search('am')>0);
            hasPm = !!(startTime.search('pm')>0);
            startTime = $.trim(startTime.replace(/am/g, '').replace(/pm/g, '')).split(':');
            startTime[0] = parseInt(startTime[0], 10);
            startTime[1] = parseInt(startTime[1], 10);
            if(hasAm && startTime[0]>11){
                startTime[0] = 0;
            }else if(hasPm && startTime[0]<12){
                startTime[0] += 12;
            }
            startDateTime += (startTime[0]<10) ? '0' + startTime[0] : startTime[0];
            startDateTime += ':';
            startDateTime += (startTime[1]<10) ? '0' + startTime[1] : startTime[1];

            startDateTime += (timeZone.offset==='+00:00') ? 'Z' : timeZone.offset;

            if(repeat === 'none') {
                pattern = 'FREQ=DAILY;INTERVAL=1;COUNT=1;';
            }
            else if(repeat === 'hourly') {
                pattern = 'FREQ=HOURLY;';
                pattern += 'INTERVAL=' + interval + ';';
            }
            else if(repeat === 'daily') {
                pattern += 'FREQ=DAILY;';
                pattern += 'INTERVAL=' + interval + ';';
            }
            else if(repeat === 'weekdays') {
                pattern += 'FREQ=DAILY;';
                pattern += 'BYDAY=MO,TU,WE,TH,FR;';
                pattern += 'INTERVAL=1;';
            }
            else if(repeat === 'weekly') {
                days = [];
                this.$element.find('.scheduler-weekly .btn-group button.active').each(function() {
                    days.push($(this).data().value);
                });

                pattern += 'FREQ=WEEKLY;';
                pattern += 'BYDAY=' + days.join(',') + ';';
                pattern += 'INTERVAL=' + interval + ';';
            }
            else if(repeat === 'monthly') {
                pattern += 'FREQ=MONTHLY;';
                pattern += 'INTERVAL=' + interval + ';';

                type = parseInt(this.$element.find('input[name=scheduler-month]:checked').val(), 10);
                if(type === 1) {
                    day = parseInt(this.$element.find('.scheduler-monthly-date .select').select('selectedItem').text, 10);
                    pattern += 'BYMONTHDAY=' + day + ';';
                }
                else if(type === 2) {
                    days = this.$element.find('.month-days').select('selectedItem').value;
                    pos = this.$element.find('.month-day-pos').select('selectedItem').value;

                    pattern += 'BYDAY=' + days + ';';
                    pattern += 'BYSETPOS=' + pos + ';';
                }
            }
            else if(repeat === 'yearly') {
                pattern += 'FREQ=YEARLY;';

                type = parseInt(this.$element.find('input[name=scheduler-year]:checked').val(), 10);
                if(type === 1) {
                    month = this.$element.find('.scheduler-yearly-date .year-month').select('selectedItem').value;
                    day = this.$element.find('.year-month-day').select('selectedItem').text;

                    pattern += 'BYMONTH=' + month + ';';
                    pattern += 'BYMONTHDAY=' + day + ';';
                }
                else if(type === 2) {
                    days = this.$element.find('.year-month-days').select('selectedItem').value;
                    pos = this.$element.find('.year-month-day-pos').select('selectedItem').value;
                    month = this.$element.find('.scheduler-yearly-day .year-month').select('selectedItem').value;

                    pattern += 'BYDAY=' + days + ';';
                    pattern += 'BYSETPOS=' + pos + ';';
                    pattern += 'BYMONTH=' + month + ';';
                }
            }

            var end = this.$endSelect.select('selectedItem').value;
            var duration = '';

            // if both UNTIL and COUNT are not specified, the recurrence will repeat forever
            // http://tools.ietf.org/html/rfc2445#section-4.3.10
            if(repeat !=='none'){
                if(end === 'after') {
                    duration = 'COUNT=' + this.$endAfter.spinner('value') + ';';
                }
                else if(end === 'date') {
                    duration = 'UNTIL=' + getFormattedDate(this.$endDate.datepicker('getDate'), '') + ';';
                }
            }

            pattern += duration;

            var data = {
                startDateTime: startDateTime,
                recurrencePattern: pattern,
                timeZone: {
                    name: timeZone.name,
                    offset: timeZone.offset
                }
            };

            return data;
        },

        // called when the repeat interval changes
        // (None, Hourly, Daily, Weekdays, Weekly, Monthly, Yearly
        repeatIntervalSelectChanged: function(e, data) {

            // get the currently selected repeat interval
            var val = data.value,
                txt = data.text;

            // set the text
            this.$repeatIntervalTxt.text(txt);

            switch(val.toLowerCase()) {
                case 'hourly':
                case 'daily':
                case 'weekly':
                case 'monthly':
                    this.$repeatIntervalPanel.show();
                    break;
                default:
                    this.$repeatIntervalPanel.hide();
                    break;
            }

            // hide all panels
            this.$recurrencePanels.hide();

            // show panel for current selection
            this.$element.find('.scheduler-' + val).show();

            // the end selection should only be shown when
            // the repeat interval is not "None (run once)"
            if(val === 'none') {
                this.$end.hide();
            }
            else {
                this.$end.show();
            }
        },

        // called when the end range changes
        // (Never, After, On date)
        $endSelectChanged: function(e, data) {
            // hide all panels
            this.$endAfter.hide();
            this.$endDate.hide();

            if(data.value==='after'){
                this.$endAfter.show();
            }else if(data.value==='date'){
                this.$endDate.show();
            }
        }
    };


    // SCHEDULER PLUGIN DEFINITION

    $.fn.scheduler = function (option) {
        var args = Array.prototype.slice.call( arguments, 1 );
        var matchString = '@~_~@';
        var methodReturn = matchString;

        var $set = this.each(function () {
            var $this = $(this);
            var data = $this.data('scheduler');
            var options = typeof option === 'object' && option;

            if (!data) $this.data('scheduler', (data = new Scheduler(this, options)));
            if( typeof option === 'string' ) methodReturn = data[ option ].apply( data, args );
        });

        return ( methodReturn === matchString ) ? $set : methodReturn;
    };

    $.fn.scheduler.defaults = {};

    $.fn.scheduler.Constructor = Scheduler;

    // SCHEDULER DATA-API

    $(function () {
        $('body').on('mousedown.scheduler.data-api', '.scheduler', function () {
            var $this = $(this);
            if ($this.data('scheduler')) return;
            $this.scheduler($this.data());
        });
    });

});
