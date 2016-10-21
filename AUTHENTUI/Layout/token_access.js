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

        $tbody.append($tr.clone(true));

    });

    $token.dataTable({

        "dom": 'i<"token-header-add"><"token-header-nav"p>er',
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
            url: "?app=AUTHENTUI&action=TOKEN_DATA",
            type: "POST",
            data: function (d)
            {
                d.showExpired = $("#ctoken-expired").attr("checked") === "checked";
                return d;
            }
        },
        columns: [
            { data: 'button', "class": "token-button" },
            { data: 'token', "class": "token-id" },
            { data: 'user', "class": "token-user" },
            { data: 'expire', "class": "token-expire" },
            { data: 'expendable', "class": "token-expendable" },
            { data: 'description', "class": "token-description" },
            { data: 'context', "class": "token-context" }
        ],
        "initComplete": function (settings)
        {
            $(".token-header-add").append($(".token-header"));
            $(".dataTables_wrapper").addClass("ui-state-default");
            $("#ctoken-expired").checkboxradio().on("click", function ()
            {
                tokenTable.draw();
            });  // Apply the search
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
            $(".token th input, .token-form-add input").addClass("ui-button ui-widget");
            $(".token-form-add button").button();

            settings.oInit.customExpired(settings);

        },
        "drawCallback": function (settings)
        {
            // Add delete button
            $(".token-button a", settings.nTBody).button({
                icon: "ui-icon-trash",
                "classes": { "ui-button": "token-delete" }
            });

            $(".token-info-anchor", settings.nTBody).button({
            icon: "ui-icon-info",
            "classes": { "ui-button": "token-info-button" }
        });



            settings.oInit.customExpired(settings);

        },
        "rowCallback": function (row, data)
        {
            var $tokenCell=$('.token-id', row);
            if (data.hasExpired) {
                $('.token-expire', row).addClass("token-expired");
            }
            $tokenCell.html($("<input type='text'/>").attr("readonly", "readonly").attr("size", "40").val(data.token));
            $tokenCell.append($("<a/>").addClass("token-info-anchor"));
            if (data.token === $token.data("addedToken")) {
                $(row).addClass("token-added");
            }
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

    $token.on("click", ".token-delete", function ()
    {
        var $dialog = $("#token-deletion-confirm");
        var $tr = $(this).closest("tr");
        var token = $tr.find(".token-id input").val();

        $tr.addClass("token-to-delete").removeClass("token-added");
        $dialog.attr("title", token);

        $dialog.dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
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

                    icon: "ui-icon-trash",
                    "click": function ()
                    {
                        var url = "?app=AUTHENTUI&action=TOKEN_METHOD&method=delete&token=" + token;
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
                            var $div = $('<div/>').html(response.responseText);
                            $div.find("link").remove();
                            $div.dialog();
                        });
                        $(this).dialog("close");
                    }
                }
            ]

        });
    });
    $token.on("click", ".token-info-anchor", function ()
    {
        var $tr = $(this).closest("tr");
        var token = $tr.find(".token-id input").val();
        var $info = $(".token-info");

        if ($info.length === 0) {
            $info = $("<div/>").addClass("token-info");
            $info.dialog({
                width: "auto",
                hide: false,
                show: false,
                close: function () {
                    $(".token-info-selected").removeClass("token-info-selected");
                }
            });
        } else {
            $info.dialog("close");
        }
       // $(".token-info-selected").removeClass(".token-info-selected");
        $tr.addClass("token-info-selected");
        $.ajax(
            {
                url: "?app=AUTHENTUI&action=TOKEN_INFO&token=" + token
            }).done(function (data)
        {
            $info.html(data);
            $info.dialog("option", "title", $info.find(">div").attr("title"));
            $info.dialog("open");
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
            $div.dialog();
        });
    });


    $("#iuser").on("change", function ()
    {
        if ($(this).val()) {
            $(".token-add").button("enable");
        } else {
            $(".token-add").button("disable");
        }
    }).combobox({
        source: "?app=AUTHENTUI&action=TOKEN_USERDATA"
    });


    $(".lastToken").hide();

    $(".token-infinity").on("click", function (event)
    {
        var $input = $("input[name=expireinfinite]");
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

    $("input[type=date]").each(function ()
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