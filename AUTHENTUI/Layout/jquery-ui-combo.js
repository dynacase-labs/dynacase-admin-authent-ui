$(document).ready(function ()
{

    "use strict";

    $.widget("custom.combobox", {
        _create: function ()
        {
            this.wrapper = $("<span>")
                .addClass("custom-combobox")
                .insertAfter(this.element);

            this.element.hide();
            this._createAutocomplete();
            this._createShowAllButton();
        },

        _createAutocomplete: function ()
        {
            var selected = this.element.children(":selected"),
                value = selected.val() ? selected.text() : "",
                options = this.options,
                $originalInput=this.element;


            this.input = $("<input type='text'>")
                .appendTo(this.wrapper)
                .val(value)
                .attr("title", "")
                .attr("placeholder", this.element.attr("placeholder"))
                .addClass("custom-combobox-input ui-widget ui-widget-content  ui-corner-left")
                .autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: this.options.source,
                    open: function( event, ui ) {
                        var $dialog=$(event.target).closest(".ui-dialog");

                        if ($dialog.length > 0) {
                            var zIndex = parseInt($dialog.css("z-index"));
                            var $menu = $(event.target).autocomplete("widget");

                            if (zIndex > 100) {
                                $dialog.css("z-index",100);
                            }
                            $menu.css("z-index", zIndex + 1);
                        }
                    }
                })
                .tooltip({
                    classes: {
                        "ui-tooltip": "ui-state-highlight"
                    }
                });

            this.input.addClass("ui-button");

            this.input.on("keypress, change", function () {
                $originalInput.val("");
                $originalInput.trigger("change");
            });

            this._on(this.input, {
                autocompleteselect: function (event, ui)
                {
                    if (ui.item.id) {
                        this.element.val(ui.item.value);
                    } else {
                        this.element.val("");
                    }
                    this.element.trigger("change");

                },
                autocompletechange: "_removeIfInvalid"
            });
        },

        _createShowAllButton: function ()
        {
            var input = this.input,
                wasOpen = false;

            $("<a>")
                .attr("tabIndex", -1)
                .attr("title", "Show All Items")
                .tooltip()
                .appendTo(this.wrapper)
                .button({
                    icons: {
                        primary: "ui-icon-triangle-1-s"
                    },
                    text: false
                })
                .removeClass("ui-corner-all")
                .addClass("custom-combobox-toggle ui-corner-right")
                .on("mousedown", function ()
                {
                    wasOpen = input.autocomplete("widget").is(":visible");
                })
                .on("click", function ()
                {
                    input.trigger("focus");

                    // Close if already visible
                    if (wasOpen) {
                        return;
                    }

                    // Pass empty string as value to search for, displaying all results
                    input.autocomplete("search", "");
                });
        },


        _removeIfInvalid: function (event, ui)
        {

            // Selected an item, nothing to do
            if (ui.item) {
                return;
            }

            // Search for a match (case-insensitive)
            var value = this.input.val(),
                valueLowerCase = value.toLowerCase(),
                valid = false;
            this.element.children("option").each(function ()
            {
                if ($(this).text().toLowerCase() === valueLowerCase) {
                    this.selected = valid = true;
                    return false;
                }
            });

            // Found a match, nothing to do
            if (valid) {
                return;
            }

            // Remove invalid value
            this.input
                .val("")
                .attr("title", value + " didn't match any item")
                .tooltip("open");
            this.element.val("");
            this._delay(function ()
            {
                this.input.tooltip("close").attr("title", "");
            }, 2500);
            this.input.autocomplete("instance").term = "";
        },

        _destroy: function ()
        {
            this.wrapper.remove();
            this.element.show();
        }
    });
});