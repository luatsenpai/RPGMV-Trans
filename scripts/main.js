(function($) {
    var org_data;
    var new_data;
    var file_name = '';
    var debug = false;
    $('#file').on('change', function(env) {
        clearAll();
        var file = env.target.files[0];
        file_name = file.name;
        var reader = new FileReader;
        reader.onloadend = (function(theFile) {
            return function(e) {
                parseData($.parseJSON(e.target.result));
            };
        })(file);
        reader.readAsText(file);
    });
    $('#event_table').on('click', 'tr', loadText);
    $('#text_table').on('change', 'input', saveText);
    $('#items_table').on('change', 'input', saveItem);
    $('#download').on('click', downloadJSON);
    $('#debug').on('click', function() {
        if (debug == false) {
            debug = true;
            $(this).addClass('btn-success').removeClass('btn-danger').html('Đã Bật Debug');
            $('#debug_data').removeClass('hidden');
        } else {
            debug = false;
            $(this).removeClass('btn-success').addClass('btn-danger').html('Bật Debug');
            $('#debug_data').addClass('hidden');
        }
    });
    if (typeof Cookies.get("visited") == 'undefined') {
        Cookies.set("visited", 1, {
            expires: 365
        });
        $('#helpModal').modal();
    } else {
        Cookies.set("visited", 1, {
            expires: 365
        });
    }

    function parseData(json) {
        org_data = json;
        new_data = jQuery.extend(true, $.isArray(json) ? [] : {}, json);
        if (typeof json.events != 'undefined') {
            $('#maps').removeClass('hidden');
            $(json.events).each(function(index, value) {
                if (value == null) {
                    return true;
                }
                var id = value.id;
                var name = value.name;
                $(value.pages).each(function(index, value) {
                    if (value == null) {
                        return true;
                    }
                    var skip = true;
                    $(value.list).each(function(index, value) {
                        if (value == null || (value.code != 401 && value.code != 101)) {
                            return true;
                        } else {
                            skip = false;
                        }
                    });
                    if (skip) {
                        return true;
                    }
                    $('#event_table').append($('<tr>').attr('data-id', id).attr('data-page', index).append($('<td>').html(id)).append($('<td>').html(name)).append($('<td>').html(index + 1)));
                });
            });
        } else if ($.isArray(json)) {
            $.each(org_data, function(index, value) {
                if (value == null) {
                    return true;
                }
                if (typeof value.message3 != 'undefined' || typeof value.nickname != 'undefined') {} else if (typeof value.description != 'undefined' || typeof value.name != 'undefined' || (typeof value.message1 != 'undefined' && typeof value.message2 != 'undefined')) {
                    $('#items_table').append($('<tr>', {
                        'data-id': value.id
                    }).append($('<td>').html(value.name)).append($('<td>').html(value.description || '')).append($('<td>').html(value.message1 || '')).append($('<td>').html(value.message2 || '')).append($('<td>').append(itemEditEl(new_data[index].name, 'name'))).append($('<td>').append(itemEditEl(new_data[index].description, 'description'))).append($('<td>').append(itemEditEl(new_data[index].message1, 'message1'))).append($('<td>').append(itemEditEl(new_data[index].message2, 'message2'))));
                    $('#items').removeClass('hidden');
                }
            })
        }
        console.log(json);
    }

    function itemEditEl(value, field) {
        if (typeof value == 'undefined')
            return $();
        return $('<input>', {
            'type': 'text',
            'class': 'form-control',
            'data-field': field,
            'value': value
        })
    }

    function loadText() {
        $('#text_table').empty();
        var el = $(this);
        el.parents('table').find('.info').removeClass('info');
        el.addClass('info');
        var id = el.data('id');
        var page = el.data('page');
        var list = org_data.events[id].pages[page].list;
        var list_new = new_data.events[id].pages[page].list;
        $(list).each(function(index, value) {
            if (value == null || (value.code != 401 && value.code != 101 && value.code != 102)) {
                return true;
            }
            if (value.code == 101) {
                $('#text_table').append($('<tr>').append($('<td>').html(index)).append($('<td>').html("NEW BOX!")).append($('<td>').html("Image: " + (value.parameters[0] || 'none')).attr('colspan', 2)));
            } else if (value.code == 102) {
                var new_table = $('<table>').addClass('table').append($('<col>').attr('width', '10%')).append($('<col>').attr('width', '90%')).append($('<tbody>'));
                var org_table = new_table.clone();
                $(value.parameters[0]).each(function(index1, value) {
                    if (value == null) {
                        return true;
                    }
                    org_table.find('tbody').append($('<tr>').append($('<td>').html(index1)).append($('<td>').html(value)));
                    new_table.find('tbody').append($('<tr>').append($('<td>').html(index1)).append($('<td>').append($('<input>').val(list_new[index].parameters[0][index1]).attr('data-id', index1).attr('type', 'text'))));
                });
                $('#text_table').append($('<tr>').attr('data-event', id).attr('data-page', page).attr('data-id', index).attr('data-type', 102).addClass('edit_row').append($('<td>').html(index)).append($('<td>').html("Selection")).append($('<td>').append(org_table)).append($('<td>').append(new_table)));
            } else {
                $('#text_table').append($('<tr>').attr('data-event', id).attr('data-page', page).attr('data-id', index).attr('data-type', 401).addClass(value.parameters[0] != list_new[index].parameters[0] && 'success').addClass('edit_row').append($('<td>').html(index)).append($('<td>').html('Text')).append($('<td>').html(value.parameters[0])).append($('<td>').append($('<input>').val(list_new[index].parameters[0]).attr('type', 'text'))));
            }
        });
    }

    function saveText() {
        var el = $(this);
        var par = el.parents('.edit_row');
        par.removeClass('success').addClass('info');
        var id = par.data('id');
        var page = par.data('page');
        var event = par.data('event');
        var type = par.data('type');
        if (type == 401) {
            new_data.events[event].pages[page].list[id].parameters[0] = el.val();
        } else if (type == 102) {
            var sel_id = el.data('id');
            new_data.events[event].pages[page].list[id].parameters[0][sel_id] = el.val();
        }
        par.removeClass('info').addClass('success');
    }

    function saveItem() {
        var el = $(this);
        var par = el.parents('tr');
        par.removeClass('success').addClass('info');
        var id = par.data('id');
        var field = el.data('field');
        new_data[id][field] = el.val();
        par.removeClass('info').addClass('success');
    }

    function downloadJSON() {
        if (file_name == '') {
            return false;
        }
        $('#debug_data').html(btoa(unescape(encodeURIComponent(new_data))));
        var blob = new Blob([JSON.stringify(new_data)], {
            type: "text/json;charset=utf-8"
        });
        saveAs(blob, file_name);
    }

    function clearAll() {
        $('#event_table').empty();
        $('#text_table').empty();
        $('#items_table').empty();
        $('#items').addClass('hidden');
        $('#maps').addClass('hidden');
    }
})(jQuery);
