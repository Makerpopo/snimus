$(function() {

    var head = $('#sn-head');

    var scrollTopEdge = function() {
        if ($(document).scrollTop() <= 5) {
            head.removeClass('sn-header-w');
        } else {
            head.addClass('sn-header-w');
        }
    }

    $(document)
        // change header theme according to the scroll
        .on('scroll', scrollTopEdge)
        .on('keydown', 'textarea#id_title', function(e) {
            if (e.which == 13) e.preventDefault();
        })
        // toggle the dropdown menu
        .on('click', '.sn-drpdwn .sn-actuate', function(e) {
            e.preventDefault();

            var container = $(this).nextAll('.sn-container');
            var aOffsetY = $(this).offset().top;
            var cHeight = container.height();

            container.toggle();
            // if there is an arrow there toggle that too
            $(this).find('.sn-i-up, .sn-i-down')
                .toggleClass('sn-i-down sn-i-up');

            if (aOffsetY + cHeight > $(window).height() - 60 &&
            aOffsetY - $(document).scrollTop() - 60 > cHeight) {
                container.find('header, footer')
                    .css('width', $(this).width())
                    .hide();
                container.find('footer').show();
                container.css({
                    bottom: $(this).height()
                });
            } else {
                container.find('header, footer')
                    .css('width', $(this).width())
                    .hide();
                container.find('header').show();
                container.css({
                    bottom: 'auto'
                });
            }

            if (container.hasClass('sn-center')) {
                container
                    .css('left', container.closest('.sn-drpdwn').width()/2 -
                    container.width()/2);

                container.find('header, footer')
                    .css('width', '100%');
            }

            if (container.find('li').length > 5) {
                container.find('nav')
                    .height('260px')
                    .mCustomScrollbar({
                        axis: 'y',
                        theme: 'minimal',
                        scrollInertia: 500
                    });
            }
        })
        // hide the dropdown menu when .sn-close is pressed
        .on('click', '.sn-drpdwn .sn-close', function(e) {
            $(this).closest('.sn-container').hide();
            // if there is an arrow there toggle that too
            $(this).closest('.sn-container')
                .prevAll('.sn-actuate').find('.sn-i-up')
                .removeClass('sn-i-up')
                .addClass('sn-i-down');
        })
        // change the real select value with the custom dropdown select
        .on('click', '.sn-drpdwn.sn-select a.sn-option', function(e) {
            e.preventDefault();
            var container = $(this).closest('.sn-container');
            var dropdown = $(this).closest('.sn-drpdwn');
            var value = $(this).data('value');
            if (value != 'add') {
                dropdown.prev('select').find('option')
                    .filter('[value='+$(this).data('value')+']')
                        .prop('selected', true).trigger('change');

                dropdown.prev('select').trigger('change');

                dropdown.find('.sn-actuate .sn-text').text($(this).text());
                dropdown.find('.sn-close').trigger('click');
            } else {
                var input = $('<p><input class="sn-select-add" type="text" placeholder="' +
                    $(this).text() + '"></p>');
                $(this)
                    .after(input)
                    .hide();
                input.find('input').focus();

                if (container.hasClass('sn-center')) {
                    container
                        .css('left', container.closest('.sn-drpdwn').width()/2 -
                        container.width()/2);
                }
            }
        })
        // dynamically add on dropdown selection
        .on('blur', '.sn-drpdwn.sn-select input.sn-select-add', function(e) {
            var container = $(this).closest('.sn-container');
            var p = $(this).closest('p');
            p.prev('.sn-option').show();
            p.remove();
            if (container.hasClass('sn-center')) {
                container
                    .css('left', container.closest('.sn-drpdwn').width()/2 -
                    container.width()/2);
            }
        })
        .on('keypress', '.sn-drpdwn.sn-select input.sn-select-add', function(e) {
            if (e.which == 13) {
                e.preventDefault();
                var that = $(this);
                $.ajax({
                    method: 'POST',
                    url: '/c/add',
                    data: { name: $(this).val() }
                })
                    .fail(function(jqxhr, status, err) {
                        if (jqxhr.status == 401) alert('권한이 없습니다.');
                    })
                    .done(function(res) {
                        var ops = JSON.parse(res)[0];
                        var container = that.closest('.sn-container');
                        var option = that.closest('p').prev('.sn-option').show();
                        var select = that.closest('.sn_select').prev('select');

                        select.append('<option value="' + ops.index + '">' +
                            ops.name + '</option>');

                        that.closest('li')
                            .before('<li><a class="sn-option" href="#" data-value="' +
                                ops.index + '">' + ops.name + '</a></li>');

                        that.blur();

                        if (container.hasClass('sn-center')) {
                            container
                                .css('left', container.closest('.sn-drpdwn').width()/2 -
                                container.width()/2);
                        }
                    });
            }
        });

    // dynamically render the dropdown menu from select
    $('select.sn-select')
        .each(function() {
            var option = $(this).find('option');
            var dropdown = $('<div class="sn-drpdwn sn-select">' +
                '<a class="sn-actuate sn-meta-box" href="#"></a>' +
                '<div class="sn-container" style="display:none;">' +
                '<header style="display:none;"><span></span></header>' +
                '<nav><ul></ul></nav>' +
                '<footer style="display:none;"><span></span></footer>' +
                '<div class="sn-close">' +
                '</div></div>'
            );

            dropdown.find('.sn-actuate')
                .html('<span class="sn-text">' +
                $(this).find('option').first().text() +
                '</span>' +
                '<i class="sn-i sn-i-down"></i>');

            if ($(this).hasClass('sn-center')) {
                dropdown.find('.sn-container').addClass('sn-center');
            }

            option.each(function() {
                var text = $(this).text();
                var value = $(this).attr('value');
                var li = $('<li><a class="sn-option" href="#" data-value="' +
                value + '">' + text + '</a></li>');

                if($(this).prop('selected')) {
                    dropdown.find('.sn-actuate .sn-text')
                        .text(text);
                }

                li.find('a').data('value', value);

                dropdown.find('nav ul').append(li);

                if (value == 'add') $(this).remove();
            });

            $(this)
                .after(dropdown)
                .hide();
        });
});
