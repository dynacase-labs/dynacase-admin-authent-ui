// Token Access
$(document).ready(function ()
{
    "use strict";

    var $token = $('.token');
    var tokenTable;
    var lang = $token.attr("lang");

    // Setup - add a text input to each footer cell
    $('.token thead th').each(function ()
    {
        var title = $(this).text();
        if (title) {
            $(this).html('<input type="text" placeholder="' + title + '" />');
        }
    });

    $(".token-view-createform").button({
        "icon": "ui-icon-circle-plus"
    }).on("click", function ()
    {
        $(".token-form-add").dialog({
            width: "auto"
        });
    });

    $(".token-add-key").button({
        "icon": "ui-icon-plus"
    }).on("click", function ()
    {
        var $tr = $(this).closest("table").find("tfoot tr");
        var $tbody = $(this).closest("table").find("tbody");
        var $ntr=$tr.clone(true);

        $ntr.find("select").selectmenu({
            open: function (event, ui)
            {
                var $dialog = $(event.target).closest(".ui-dialog");

                if ($dialog.length > 0) {
                    var zIndex = parseInt($dialog.css("z-index"));
                    var $menu = $(event.target).selectmenu("menuWidget").parent();

                    if (zIndex > 100) {
                        $dialog.css("z-index", 100);
                    }
                    $menu.css("z-index", zIndex + 1);
                }
            }
        });

        $tbody.append($ntr);

    }).trigger("click");



    $token.dataTable({

        "dom": '<"token-header-add"><"token-header-nav"p>eri',
        "paging": true,
        "pageLength": 20,
        "ordering": false,
        "autoWidth": false,
        "heigth": "200px",
        "language": {
            url: (lang === "fr") ? "AUTHENTUI/Layout/token_fr.js" : "AUTHENTUI/Layout/token_en.js"
        },
        processing: true,
        serverSide: true,
        ajax: {
            url: $token.data("tokenUrl"),
            type: "POST",
                dataType: "json",
            data: function (d)
            {
                d.showExpired = $("#ctoken-expired").attr("checked") === "checked";
                return d;
            },
            error: function (response) {
                try {
                    var info=JSON.parse((response.responseText));
                    if (info.error) {
                        $(".dataTables_processing").hide();
                        alert(info.error);
                    }
                } catch (e) {
                }
            }
        },
        columns: [
            { data: 'button', "class": "token-button" },
            { data: 'description', "class": "token-description" },
            { data: 'token', "class": "token-id" },
            { data: 'user', "class": "token-user" },
            { data: 'expire', "class": "token-expire" },
            { data: 'expendable', "class": "token-expendable" },
            { data: 'context', "class": "token-context" }
        ],
        "initComplete": function (settings)
        {
            $(".token-header-add").append($(".token-header"));
            $(".dataTables_wrapper").addClass("ui-state-default");
            $("#ctoken-expired").checkboxradio().on("click", function ()
            {
                tokenTable.draw();
            });
            $(".token-form input[type=radio]").checkboxradio();
            $(".ui-checkboxradio-icon.ui-state-hover").removeClass("ui-state-hover");
            // Apply the search
            tokenTable.columns().eq(0).each(function (colIdx)
            {
                $('input', tokenTable.column(colIdx).header()).on('keypress', function (e)
                {
                    if (e.keyCode === 13) {
                        tokenTable.column(colIdx)
                            .search(this.value)
                            .draw();
                    }
                }).on("change", function ()
                {
                    tokenTable.column(colIdx)
                        .search(this.value);
                });
            });
            $(".token th input, .token-form input").addClass("ui-button ui-widget");
            $(".token-form button").button();
            $(".token-count-info").append($(".dataTables_info"));

            settings.oInit.customExpired(settings);
        },
        "drawCallback": function (settings)
        {
            // Add info button
            $(".token-button a", settings.nTBody).button({
                icon: "ui-icon-info",
                "classes": { "ui-button": "token-info-button" }
            });


            settings.oInit.customExpired(settings);

        },
        "rowCallback": function (row, data)
        {
            var $tokenCell = $('.token-id', row);
            var $descCell = $('.token-description', row);
            var $descUser = $('.token-user', row);
            if (data.hasExpired) {
                $('.token-expire', row).addClass("token-expired");
            }
            $tokenCell.html($("<input type='text'/>").attr("readonly", "readonly").attr("size", "40").val(data.token));
            $descCell.text($descCell.html());
            $descUser.text($descUser.html());
            if (data.token === $token.data("addedToken")) {
                $(row).addClass("token-added");
            }
            $(row).attr("data-token", data.token);

        },
        "customExpired": function (settings)
        {
            var $cexpire = $("#ctoken-expired");

            if ($cexpire.data("uiCheckboxradio")) {
                if (settings.json.expireCount > 0) {
                    $cexpire.checkboxradio("enable");
                } else {
                    $cexpire.checkboxradio("disable");
                }
                $(".token-expired-count").text(settings.json.expireCount);
            }
        }

    });
    tokenTable = $token.DataTable();
    // Apply the search


    $(".token-add").button({
        "icon": "ui-icon-circle-plus"
    }).button("disable").on("click", function ()
    {
        $(".token-form-add").submit();
        $(this).button("disable"); // Prevent double click
    });

    $("body").on("click", ".token-delete", function ()
    {
        var $dialog = $("#token-deletion-confirm");
        var token = $(this).data("tokenid");
        var $tr = $token.find('tr[data-token="' + token + '"]');

        $tr.addClass("token-to-delete").removeClass("token-added");
        $dialog.attr("title", $(".token-info").dialog("option", "title"));

        $dialog.dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            close: function (event)
            {
                $tr.removeClass("token-to-delete");
                            $(event.target).dialog("destroy");
            },
            buttons: [
                {
                    text: $dialog.data("close"),
                    icon: "ui-icon-close",
                    "click": function ()
                    {
                        $tr.removeClass("token-to-delete");
                        $(this).dialog("destroy");
                    }
                },
                {
                    text: $dialog.data("confirm"),

                    "class": "token-confirm-delete ui-button--red",
                    icon: "ui-icon-trash ",

                    "click": function ()
                    {
                        var url = "?app=AUTHENTUI&action=TOKEN_METHOD&method=delete&token=" + token;
                        var $info = $(".token-info");
                        $info.dialog("close");
                        $.getJSON(url).done(function (data)
                        {
                            tokenTable.draw();
                            if (data && data.message) {
                                $('<div/>').html(data.message).dialog({
                                    "open": function (event, ui)
                                    {
                                        $(event.target).parent().find(".ui-dialog-titlebar").hide();
                                        window.setTimeout(function ()
                                        {
                                            $(event.target).dialog("destroy");
                                        }, 2000);
                                    }
                                });
                            }

                        }).fail(function (response)
                        {
                            var $div = $('<div/>');
                            try {
                                var info=JSON.parse(response.responseText);
                                if (info.error) {
                                    $div.text(info.error);
                                    tokenTable.draw();
                                }
                            } catch (e) {
                                $div.html(response.responseText);
                                $div.find("link").remove();
                            }

                            $div.dialog({title:"Error", modal:true});
                        });
                        $(this).dialog("close");
                    }
                }
            ]

        });


    });
    $token.on("click", ".token-info-button", function ()
    {
        var $tr = $(this).closest("tr");
        var token = $tr.find(".token-id input").val();
        var $info = $(".token-info");
        var oldWidth=0;

        if (!$info.data("uiDialog")) {

            $info.dialog({
                width: "auto",
                hide: false,
                show: false,
                close: function (event)
                {
                    oldWidth=$info.width();
                    $(".token-info-selected").removeClass("token-info-selected");
                    if (event.currentTarget) {
                        $(event.target).dialog("destroy");
                    }
                },
                open: function () {
                    if (oldWidth) {
                        $info.width(oldWidth);
                    }
                }
            });
        } else {
            $info.dialog("close");
        }
        // $(".token-info-selected").removeClass(".token-info-selected");
        $tr.addClass("token-info-selected");
        $.getJSON(
            "?app=AUTHENTUI&action=TOKEN_INFO&token=" + token
        ).done(function (info)
        {
            var data = info.data;
            var $ctxAdd = $info.find(".token-add-key");
            $info.find(".token-delete").button({
                icon: "ui-icon-trash",
                "classes": { "ui-button": "token-delete ui-button--red" }
            }).data("tokenid", data.token);

            $info.dialog("option", "title", data.title);
            $info.find("input[name=description]").val(data.description);
            $info.find("input[name=author]").val(data.author);
            $info.find("input[name=tokenid]").val(data.token);
            $info.find("input[name=user]").val(data.user);


            if (data.expire === "infinity") {
                $info.find("input[name=expiredate]").val("");
                $info.find("input[name=expiretime]").val("");
            } else {
                $info.find("input[name=expiredate]").val(data.expire.substring(0, 10));
                $info.find("input[name=expiretime]").val(data.expire.substring(11));
            }

            $info.find("input[name=expireinfinite]").val((data.expire === "infinity") ? "false" : "true");

            $info.find(".token-infinity").button("enable");
            $info.find(".token-infinity").trigger("click");
            $info.find(".token-infinity").button("disable");

            $info.find("input[type=radio]").checkboxradio("enable");
            if (data.expendable) {
                $info.find("input[name=expandable][value=one]").trigger("click");
            } else {
                $info.find("input[name=expandable][value=always]").trigger("click");
            }
            $info.find("input").prop("readonly", true);
            $info.find("input[type=radio]").checkboxradio("disable");

            $info.find(".context-param tbody tr").remove();

            $info.find("select").prop("disabled", true);
            if (data.context) {
                var $option = $info.find('option');
                $option.last().prop("selected", true);
                if (data.context.app && data.context.action) {
                    $option = $info.find('option[value="' + data.context.app + ':' + data.context.action + '"]');
                    if ($option.length > 0) {
                        $option.prop("selected", true);
                        data.context.app = undefined;
                        data.context.action = undefined;
                    }
                }

                if ($info.find(".context-param tfoot input.token-param-key").length > 0) {
                    for (var key in data.context) {
                        //noinspection JSUnfilteredForInLoop
                        if (data.context[key] !== undefined) {
                            $ctxAdd.trigger("click");
                            //noinspection JSUnfilteredForInLoop
                            $info.find(".context-param tbody input.token-param-key").last().val(key);
                            //noinspection JSUnfilteredForInLoop
                            $info.find(".context-param tbody input.token-param-val").last().val(data.context[key]);
                        }
                    }
                }
                if ($info.find(".context-param tbody tr").length === 0) {
                    $info.find(".context-param thead").hide();
                } else {
                    $info.find(".context-param thead").show();
                }
            }

            $token.trigger("token.info", [data]);
            $info.dialog("open");

        }).fail(function (xhr) {

            $info.dialog("close");
            try {
                var info=JSON.parse(xhr.responseText);
                if (info.error) {
                    var $div = $('<div/>');
                    $div.text(info.error);
                    $div.dialog({title:"Error", modal:true});
                }
            } catch (e) {
                alert(xhr.responseText);
            }
        });
    });

    $(".token-form-add").hide().on("submit", function (event)
    {
        event.preventDefault();
        $.ajax(
            {
                type: "POST",
                dataType: "json",
                data: $(this).serialize(),
                url: $(this).attr("action")
            }).done(function (data)
        {
            tokenTable.draw();
            if (data && data.message) {
                $(".lastToken--id").text(data.token);
                $(".lastToken").show();
                $token.data("addedToken", data.token);
                $('<div/>').html(data.message).dialog({
                    "open": function (event, ui)
                    {
                        $(event.target).parent().find(".ui-dialog-titlebar").hide();
                        window.setTimeout(function ()
                        {
                            $(event.target).dialog("destroy");
                        }, 3000);
                    }
                });
            }

            $(".token-form-add").dialog("close");
            $(".token-add").button("enable");
        }).fail(function (response)
        {
            var $div = $('<div/>');
            try {
                var jsonResponse = JSON.parse(response.responseText);
                if (jsonResponse.error) {
                    $div.text(jsonResponse.error);
                }
            } catch (e) {
                $div.html(response.responseText);
                $div.find("link").remove();
            }
            window.setTimeout(function ()
            {
                $(".token-add").button("enable");
            }, 1000);
            $div.dialog({title:"Error", modal:true});
        });
    });


    $("#iuser").combobox({
        source: "?app=AUTHENTUI&action=TOKEN_USERDATA"
    });

    $("#iuser, #idescription").on("change", function ()
    {
        if ($("#iuser").val() && $("#idescription").val()) {
            $(".token-add").button("enable");
        } else {
            $(".token-add").button("disable");
        }
    });

    $(".lastToken").hide();

    $(".token-infinity").on("click", function (event)
    {
        var $input = $(this).parent().find("input[name=expireinfinite]");
        var value = $input.val();
        event.preventDefault();

        if (value === "false") {
            $input.val("true");
            $(this).addClass("token-infinity--selected");
            $("input[name=expiredate], input[name=expiretime]").prop("disabled", true);
        } else {
            $input.val("false");
            $(this).removeClass("token-infinity--selected");
            $("input[name=expiredate], input[name=expiretime]").prop("disabled", false);
        }
    });

    $(".token-form input[type=date]").each(function ()
    {
        if (!this.valueAsDate) {
            var datepickerFr = {
                closeText: "Fermer",
                prevText: "Précédent",
                nextText: "Suivant",
                currentText: "Aujourd'hui",
                monthNames: ["janvier", "février", "mars", "avril", "mai", "juin",
                    "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
                monthNamesShort: ["janv.", "févr.", "mars", "avr.", "mai", "juin",
                    "juil.", "août", "sept.", "oct.", "nov.", "déc."],
                dayNames: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
                dayNamesShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
                dayNamesMin: ["D", "L", "M", "M", "J", "V", "S"],
                weekHeader: "Sem.",
                dateFormat: "yy-mm-dd",
                firstDay: 1,
                isRTL: false,
                showMonthAfterYear: false,
                yearSuffix: ""
            };

            if (lang === "fr") {
                $(this).datepicker(datepickerFr);
            } else {
                $(this).datepicker({
                    dateFormat: "yy-mm-dd"
                });
            }
        }
    });
    $("input[type=time]").each(function ()
    {
        if (!this.valueAsDate) {
            $(this).attr("maxlength", 5);
        }
    });


})
;