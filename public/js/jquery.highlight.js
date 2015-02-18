(function($) {
    $.fn.higlight = function(options) {
        var settings = $.extend({
            fadeOutDuration: 'slow',
            fadeOutOpacity: 0.2,
            fadeInDuration: 'slow',
            fadeInOpacity: 1.0
        }, options );

        return this.each(function() {
            $(this)
                .fadeTo(settings.fadeOutDuration, settings.fadeOutOpacity)
                .fadeTo(settings.fadeInDuration, settings.fadeInOpacity);
        });
    };
}( jQuery ));