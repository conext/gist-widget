var current_group;
var response;
var dbg;

function clog(message) {
    console.log("Join.me ~> " + message);
}

function decommission_splash() {
    $('#splash').css('display', 'none');
    $('#content').css('display', 'block');
}

function render_empty_feed(group_name) {
    clog("in render_empty_feed()");
    messagebox(
        "No new messages.",
        "There doesn't seem to be anything happening for <span id='ht'>" + group_name + "</span>."
    ); 
}

/* Pull from dropdown, atm. */
function get_current_group() {
    return current_group; /* todo: cleanup */
}


function messagebox(message, description) {
    decommission_splash();
    $('#joinme_div').hide();
    $('#c_create').hide();
    $('#messagebox').show();
    $('#mbox_title').text(message);
    $('#mbox_description').html(description);
}

/* Render div with a link to newly created join.me */
function render_goto(site_name, identifier, date) {
    clog("in render_goto()");
    $('#joinme_div').css('display', 'block');
    $('#joinme_list').prepend('<li><a href="' + identifier + '" target="_blank">' + site_name + '</a> <span class="date">(' + date + ')</span></li>');
    /* Make link disappear after it's clicked. */
}

function handle_resource_response(response) {
    clog("This is what I got:");
    console.log(response);
    var res = $.parseJSON(response.resource);
    console.log(res);
    decommission_splash();
    if (res.length > 0) {
        $('#joinme_list').css('display', 'block');
        $('#joinme_list').empty();
        res.reverse().forEach(function(e) {
            var d = Date.parse(e.resource.created_at);
            var date = new Date(d);
            $('#joinme_list')
                .append('<li><a href="' + e.resource.uri + '" target="_blank">' + e.resource.local_name + '</a> <span class="date">(' + date.toTimeString() + ',' + date.toDateString() + ')</span></li>');
        });
    }
}

/* Fire a request for resources and pass the response to rendering function. */
function get_wp_resources(group_id) {
    if (osapi.resources === undefined) {
        clog("osapi.resources is not defined. This won't work. Missing a <require>, maybe?");
    } else {
        clog("asking for " + get_current_group() + "'s resources");
        /* readable, innit? */
        osapi.resources.getResources({
            'groupId': get_current_group()
        }).execute(handle_resource_response);
    }
}

function entry() {
    /* enlarge your widget. satisfy your user. */
    gadgets.window.adjustHeight(295);
    window.addEventListener("message", function(ev) {
        console.log(ev.data);
        if (!ev.data) {
            clog("No group.");
            messagebox('No group selected.', 'Weird, I couldn\'t get your current group.');
        } else if (ev.data != current_group) {
            current_group = ev.data;
            var group_name = ev.data.split(":");
            group_name = group_name[group_name.length-1];
            clog("Your group: " + group_name);
            get_wp_resources(group_name);
        } else {
            clog("no changes required, same group.");
        }
    });

    top.postMessage("let's go!", top.location.origin);

    $('#create_form').submit(function(e) {
        e.preventDefault();
        var local_name = $('#site_name').val();
        if (local_name == "") {
            local_name = "Untitled";
        }
        var identifier = $('#identifier').val();
        clog("Will create: " + local_name + " for " + identifier);
        var date = new Date();
        osapi.resources.createResource({
            "groupId": get_current_group(),
            "obj" : {
                "local_name": local_name,
                "uri": identifier,
                "date": date
            }
        }).execute(function(res) {
                clog("response I got: ");
                console.log(res);
                var res = $.parseJSON(res.resource);
                console.log(res);
                if (res.outcome == "ok") {
                    render_goto(local_name, identifier, date);
                } else {
                    clog("Not OK.");
                    render_goto(local_name, identifier, date);
                }
            });
    });
}

