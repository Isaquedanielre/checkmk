// +------------------------------------------------------------------+
// |             ____ _               _        __  __ _  __           |
// |            / ___| |__   ___  ___| | __   |  \/  | |/ /           |
// |           | |   | '_ \ / _ \/ __| |/ /   | |\/| | ' /            |
// |           | |___| | | |  __/ (__|   <    | |  | | . \            |
// |            \____|_| |_|\___|\___|_|\_\___|_|  |_|_|\_\           |
// |                                                                  |
// | Copyright Mathias Kettner 2014             mk@mathias-kettner.de |
// +------------------------------------------------------------------+
//
// This file is part of Check_MK.
// The official homepage is at http://mathias-kettner.de/check_mk.
//
// check_mk is free software;  you can redistribute it and/or modify it
// under the  terms of the  GNU General Public License  as published by
// the Free Software Foundation in version 2.  check_mk is  distributed
// in the hope that it will be useful, but WITHOUT ANY WARRANTY;  with-
// out even the implied warranty of  MERCHANTABILITY  or  FITNESS FOR A
// PARTICULAR PURPOSE. See the  GNU General Public License for more de-
// tails.  You should have received  a copy of the  GNU  General Public
// License along with GNU Make; see the file  COPYING.  If  not,  write
// to the Free Software Foundation, Inc., 51 Franklin St,  Fifth Floor,
// Boston, MA 02110-1301 USA.

import $ from "jquery";
import * as utils from "utils";

// ----------------------------------------------------------------------------
// General functions for WATO
// ----------------------------------------------------------------------------

var dialog_properties = null;

export function prepare_edit_dialog(attrs) {
    dialog_properties = attrs;
}

/* Switch the visibility of all host attributes during the configuration
   of attributes of a host */
export function fix_visibility() {
    /* First collect the current selection of all host attributes.
       They are in the same table as we are */
    var current_tags = get_effective_tags();
    if (!current_tags)
        return;

    var hide_topics = dialog_properties.volatile_topics.slice(0);
    /* Now loop over all attributes that have conditions. Those are
       stored in the global variable depends_on_tags, which is filled
       during the creation of the web page. */

    var index;
    for (var i = 0; i < dialog_properties.check_attributes.length; i++) {
        var attrname = dialog_properties.check_attributes[i];
        /* Now comes the tricky part: decide whether that attribute should
           be visible or not: */
        var display = "";

        // Always invisible
        if (dialog_properties.hide_attributes.indexOf(attrname) > -1){
            display = "none";
        }

        // Visibility depends on roles
        if (display == "" && attrname in dialog_properties.depends_on_roles) {
            for (index = 0; index < dialog_properties.depends_on_roles[attrname].length; index++) {
                var role = dialog_properties.depends_on_roles[attrname][index];
                var negate = role[0] == "!";
                var rolename = negate ? role.substr(1) : role;
                var have_role = dialog_properties.user_roles.indexOf(rolename) != -1;
                if (have_role == negate) {
                    display = "none";
                    break;
                }
            }
        }

        // Visibility depends on tags
        if (display == "" && attrname in dialog_properties.depends_on_tags) {
            for (index = 0; index < dialog_properties.depends_on_tags[attrname].length; index++) {
                var tag = dialog_properties.depends_on_tags[attrname][index];
                var negate_tag = tag[0] == "!";
                var tagname = negate_tag ? tag.substr(1) : tag;
                var have_tag = current_tags.indexOf(tagname) != -1;
                if (have_tag == negate_tag) {
                    display = "none";
                    break;
                }
            }
        }


        var oTr = document.getElementById("attr_" + attrname);
        if(oTr) {
            oTr.style.display = display;

            // Prepare current visibility information which is used
            // within the attribut validation in wato
            // Hidden attributes are not validated at all
            var oAttrDisp = document.getElementById("attr_display_" + attrname);
            if (!oAttrDisp) {
                oAttrDisp = document.createElement("input");
                oAttrDisp.name  = "attr_display_" + attrname;
                oAttrDisp.id  = "attr_display_" + attrname;
                oAttrDisp.type = "hidden";
                oAttrDisp.className = "text";
                oTr.appendChild(oAttrDisp);
            }
            if ( display == "none" ) {
                // Uncheck checkboxes of hidden fields
                var chkbox = oAttrDisp.parentNode.childNodes[0].childNodes[1].childNodes[0];
                chkbox.checked = false;
                toggle_attribute(chkbox, attrname);

                oAttrDisp.value = "0";
            } else {
                oAttrDisp.value = "1";
            }

            // There is at least one item in this topic -> show it
            var topic = oTr.parentNode.childNodes[0].textContent;
            if (display == ""){
                index = hide_topics.indexOf(topic);
                if (index != -1)
                    delete hide_topics[index];
            }
        }
    }

    // FIXME: use generic identifier for each form
    var available_forms = [ "form_edit_host", "form_editfolder" ];
    for (var try_form = 0; try_form < available_forms.length; try_form++) {
        var my_form = document.getElementById(available_forms[try_form]);
        if (my_form != null) {
            for (var child in my_form.childNodes){
                oTr = my_form.childNodes[child];
                if (oTr.className == "nform"){
                    if( hide_topics.indexOf(oTr.childNodes[0].childNodes[0].textContent) > -1 )
                        oTr.style.display = "none";
                    else
                        oTr.style.display = "";
                }
            }
            break;
        }
    }
}

/* Make attributes visible or not when clicked on a checkbox */
export function toggle_attribute(oCheckbox, attrname) {
    var oEntry =   document.getElementById("attr_entry_" + attrname);
    var oDefault = document.getElementById("attr_default_" + attrname);

    // Permanent invisible attributes do
    // not have attr_entry / attr_default
    if (!oEntry){
        return;
    }

    if (oCheckbox.checked) {
        oEntry.style.display = "";
        oDefault.style.display = "none";
    }
    else {
        oEntry.style.display = "none";
        oDefault.style.display = "";
    }
}

function get_effective_tags()
{
    var current_tags = [];

    var container_ids = [ "wato_host_tags", "data_sources", "address" ];

    for (var a = 0; a < container_ids.length; a++) {
        var container_id = container_ids[a];

        var oHostTags = document.getElementById(container_id);

        if (!oHostTags)
            continue;

        var oTable = oHostTags.childNodes[0]; /* tbody */

        for (var i = 0; i < oTable.childNodes.length; i++) {
            var oTr = oTable.childNodes[i];
            var add_tag_id = null;
            if (oTr.tagName == "TR") {
                var oTdLegend = oTr.childNodes[0];
                if (oTdLegend.className != "legend") {
                    continue;
                }
                var oTdContent = oTr.childNodes[1];

                /*
                 * If the Checkbox is unchecked try to get a value from the inherited_tags
                 *
                 * The checkbox may be disabled. In this case there is a hidden field with the original
                 * name of the checkbox. Get that value instead of the checkbox checked state.
                 */
                var input_fields = oTdLegend.getElementsByTagName("input");
                var checkbox = input_fields[0];
                var attr_enabled = false;
                if (checkbox.name.indexOf("ignored_") === 0) {
                    var hidden_field = input_fields[input_fields.length - 1];
                    attr_enabled = hidden_field.value == "on";
                } else {
                    attr_enabled = checkbox.checked;
                }

                if (attr_enabled == false ){
                    var attr_ident = "attr_" + checkbox.name.replace(/.*_change_/, "");
                    if (attr_ident in dialog_properties.inherited_tags && dialog_properties.inherited_tags[attr_ident] !== null){
                        add_tag_id = dialog_properties.inherited_tags[attr_ident];
                    }
                } else {
                    /* Find the <select>/<checkbox> object in this tr */
                    var elements = oTdContent.getElementsByTagName("input");
                    if (elements.length == 0)
                        elements = oTdContent.getElementsByTagName("select");

                    if (elements.length == 0)
                        continue;

                    var oElement = elements[0];
                    if (oElement.type == "checkbox" && oElement.checked) {
                        add_tag_id = oElement.name.substr(4);
                    } else if (oElement.tagName == "SELECT") {
                        add_tag_id = oElement.value;
                    }
                }
            }

            current_tags.push(add_tag_id);
            if (dialog_properties.aux_tags_by_tag[add_tag_id]) {
                current_tags = current_tags.concat(dialog_properties.aux_tags_by_tag[add_tag_id]);
            }
        }
    }
    return current_tags;
}


export function randomize_secret(id, len)
{
    var secret = "";
    for (var i=0; i<len; i++) {
        var c = parseInt(26 * Math.random() + 64);
        secret += String.fromCharCode(c);
    }
    var oInput = document.getElementById(id);
    oInput.value = secret;
}

export function toggle_container(id)
{
    var obj = document.getElementById(id);
    if (utils.has_class(obj, "hidden"))
        utils.remove_class(obj, "hidden");
    else
        utils.add_class(obj, "hidden");
}

// ----------------------------------------------------------------------------
// Folderlist
// ----------------------------------------------------------------------------

export function open_folder(event, link) {
    if (!event)
        event = window.event;
    var target = utils.get_target(event);
    if(target.tagName != "DIV") {
        // Skip this event on clicks on other elements than the pure div
        return false;
    }

    location.href = link;
}

export function toggle_folder(event, oDiv, on) {
    if (!event)
        event = window.event;

    // Skip mouseout event when moving mouse over a child element of the
    // folder element
    if (!on) {
        var node = event.toElement || event.relatedTarget;
        while (node) {
            if (node == oDiv) {
                return false;
            }
            node = node.parentNode;
        }
    }

    var obj = oDiv.parentNode;
    var id = obj.id.substr(7);

    var elements = ["edit", "popup_trigger_move", "delete"];
    for(var num in elements) {
        var elem = document.getElementById(elements[num] + "_" + id);
        if(elem) {
            if(on) {
                elem.style.display = "inline";
            } else {
                elem.style.display = "none";
            }
        }
    }

    if(on) {
        utils.add_class(obj, "open");
    } else {
        utils.remove_class(obj, "open");

        // Hide the eventual open move dialog
        var move_dialog = document.getElementById("move_dialog_" + id);
        if(move_dialog) {
            move_dialog.style.display = "none";
        }
    }
}

export function toggle_rule_condition_type(value) {
    $(".condition").hide();
    $(".condition."+value).show();
}
