(function ($) {
    "use strict";

    var body = $('body'),
        handle = $('#djtext_toolbar_handle'),
        toolbar = $('#djtext_toolbar'),
        language = toolbar.data('language'),
        url_get_pattern = toolbar.data('url-pattern'),
        closer = $('.djtext_close_toolbar'),
        toolbar_active = false,
        menu_items = $('.djtext_menu li'),
        form = $('#djtext_form', toolbar),
        url_post_pattern = form.attr('action'),
        editor = $('.djtext_editor'),
        editor_element = $('.djtext_html_editor', form),
        content_element = $('.djtext_editor_input'),
        text_id = null,
        text_name = null,
        csrf_input = $('[name=csrfmiddlewaretoken]', form),
        name_element = $('.djtext_text_name'),
        start_element = $('.djtext_editor_start'),
        submit = $(".djtext_submit"),
        alert_message = $("#djtext_alert"),
        changes = 0,
        sessions = [];


    function toggle_toolbar() {
        if (toolbar_active) {
            toolbar.removeClass("djtext_toggle");
            body.css('overflow', 'visible');
        } else {
            toolbar.addClass("djtext_toggle");
            body.css('overflow', 'hidden');
            alert_message.removeClass("view");
        }
        toolbar_active = !toolbar_active;
    }   

    form.on('input propertychange paste', function() {
        changes++;
        submit.show();
    });

    submit.click(function() {
        form.submit();
        toggle_toolbar();
        submit.hide();
        sessions[sessions.length] = changes; 
        alert_message.addClass("view");
    });

    function init_toolbar_handles() {
        handle.on('click', toggle_toolbar);
        closer.on('click', toggle_toolbar);
    }

    function get_text_slug(name) {
        return name + '_' + language;
    }

    function get_url(name) {
        return url_get_pattern.replace('__id__', get_text_slug(name));
    }

    function post_url() {
        return url_post_pattern.replace('0', text_id);
    }

    function update_editor(text_data) {
        Object.keys(text_data).forEach(function (key) {
            $('#id_djtext_form-' + key, form).val(text_data[key]).change();
        });
        form.attr('action', post_url(text_data.name));
        name_element.text(get_text_slug(text_data.name));
        editor_element.html(text_data.render).focus();
        start_element.hide();
        editor.show();
    }

    function load_text() {
        var menu_item = $(this),
            name = menu_item.data('name'),
            url = get_url(name);
        $.getJSON(url, function (response) {
            update_editor(response);
            text_id = response.id;
            text_name = response.name;
        });
    }

    function save_form() {
        $.ajax({
            url: post_url(),
            type: 'POST',
            data: form.serialize(),
            dataType: 'JSON',
            headers: {
                'X-CSRFToken': csrf_input.val()
            },
            success: function () {
                var selector = '.' + toolbar.data('inline-wrapper-class') + '[data-text-name="' + text_name + '"]';
                $(selector).html(content_element.val());
            }
        });
        session();
    }

    function session() {
        var session_changes = changes - sessions[sessions.length-1];
        if (session_changes > 0) {
            alert_message.text("Applied " + session_changes + " changes");
        } else if (changes == 1) {
            alert_message.text("Applied " + changes + " change");
        } else {
            alert_message.text("Applied " + changes + " changes");
        }
    }

    function init_form() {
        form.on('submit', function (e) {
            e.preventDefault();
            save_form();
            return false;
        });
    }

    function init_text_menu() {
        menu_items.on('click', load_text);
    }

    function init() {
        init_toolbar_handles();
        init_text_menu();
        init_form();
    }

    $(init);
}(Zepto));
