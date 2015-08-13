$(function() {

    var head = $('#sn-head');

    var scrollTopEdge = function() {
        if ($(document).scrollTop() <= 5) {
            head.removeClass('sn-header-w');
        } else {
            head.addClass('sn-header-w');
        }
    }

    $(document).on('scroll', scrollTopEdge);

    $('.sn-drpdwn .sn-actuate').on('click', function(e) {
        e.preventDefault();
        $(this).next('.sn-container').toggle();
    });

    $('.sn-drpdwn .sn-close').on('click', function(e) {
        $(this).closest('.sn-container').hide();
    });
});
