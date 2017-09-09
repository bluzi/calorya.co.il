var menuData = [];
var table;
var categories = [];
var latestItemClientId = 1;
var latestCategoryClientId = 1;

// Charts
var voedselgroepeChart = null;

function gramRenderer(data, type, row) {
    return data + ' גרם';
}

function caloriesRenderer(data, type, row) {
    return data + " קל'";
}

function removeMenuItem(clientId) {
    var menuItem = menuData.find(function(x) { return x.clientId == clientId });
    if (menuItem)
    {
        var index = menuData.indexOf(menuItem);
        menuData.splice(index, 1);
        table.refreshTable();
    }
}

function setMenuItemSelection(clientId, isSelected) {
    var menuItem = menuData.find(function(x) { return x.clientId == clientId });
    if (menuItem)
    {
        menuItem.isSelected = isSelected;
    }
}
function addMenuItem(title, category, amount, units, calories, crabs, protein, fat) {
    amountAndUnits = amount + ' ' + units;
    menuData.push({
        'clientId': ++latestItemClientId,
        'title': title,
        'amount': amountAndUnits,
        'calories': parseFloat(calories).toFixed(2),
        'protein': parseFloat(protein).toFixed(2),
        'crabs': parseFloat(crabs).toFixed(2),
        'fat': parseFloat(fat).toFixed(2),
        'position': menuData.length + 1,
        'isSelected': false,
        'category': category,
    });

    table.refreshTable();
}

function addCategory(title, color, id = NaN) {
    if (isNaN(parseInt(id))) {
        id = latestCategoryClientId++;
    }

    var newCategory = {
        clientId: id,
        title: title,
        color: color
    };

    categories.push(newCategory);

    var option = $('<option></option>')
                    .attr('value', newCategory.clientId)
                    .text(newCategory.title);

    if (color != null) {
        $(option).css('background-color', newCategory.color);
    }
    else {
        $(option).css('background-color', 'white');
    }

    $('#category-dropdown').append(option);

    $('#category-dropdown').val(newCategory.clientId);
    $('#category-dropdown').change();
}

function reloadCharts(protein, crabs, fat) {
    if (voedselgroepeChart != null) {
        voedselgroepeChart.destroy();
    }

    voedselgroepeChart = new Chart($('#voedselgroepe-chart'),{
        type: 'pie',
        data: {
            labels: [
                "חלבון (גרם)",
                "פחמימות (גרם)",
                "שומן (גרם)"
            ],
            datasets: [
                {
                    data: [protein, crabs, fat],
                    backgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFCE56"
                    ],
                    hoverBackgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFCE56"
                    ]
                }]
        },
        options: {
            legend: {
                display: false
            },
            responsive: true
        }
    });
}

function reloadCategories() {
    $('#category-dropdown').empty();
    $(categories).each(function(i, category) {
        var option = $('<option></option>')
                        .attr('value', category.clientId)
                        .text(category.title);

        if (category.color != null) {
            $(option).css('background-color', category.color);
        }
        else {
            $(option).css('background-color', 'white');
        }

        $('#category-dropdown').append(option);
    });


    $('#category-dropdown').css('background-color', 'white');
}

function addDefaultCategory() {
    addCategory("ללא קטגוריה", null, 0);
}

function reloadUnits() {
    $("#food-unit-dropdown").empty();
    $('#food-unit-dropdown').append($('<option></option>')
                                .attr('value', 1)
                                .text('גרם'));

    var title = $("#search-food").val();
    $.post("server/food/units", {title: title}, function(result) {
        $(result).each(function(i, unit) {
            $('#food-unit-dropdown').append($('<option></option>')
                                        .attr('value', unit.weight)
                                        .text(unit.title));
        });
    });
}

function tryFindFood(callback) {
    var title = $("#search-food").val();
    var amount = $("#food-amount-input").val();
    var unitScale = $("#food-unit-dropdown").val();

    if (title && amount) {
        var multiplier = amount * unitScale / 100;
        $.post("server/food", {title: title}, function(data) {
            $("#calories-input").val((data.calories * multiplier).toFixed(2));
            $("#crabs-input").val((data.crabs * multiplier).toFixed(2));
            $("#protein-input").val((data.protein * multiplier).toFixed(2));
            $("#fat-input").val((data.fat * multiplier).toFixed(2));
        })
        .always(function() {
            if ($.isFunction(callback)) {
                callback();
            }
        });
    }
}

function addFood(hasRefound = false) {
    var title = $("#search-food").val();
    var amount = parseFloat($("#food-amount-input").val());
    var unitsTitle = $("#food-unit-dropdown option:selected").text();
    var category = parseInt($("#category-dropdown").val());
    var calories = parseFloat($("#calories-input").val());
    var crabs = parseFloat($("#crabs-input").val());
    var protein = parseFloat($("#protein-input").val());
    var fat = parseFloat($("#fat-input").val());

    if (!hasRefound && (isNaN(calories) || isNaN(crabs) || isNaN(protein) || isNaN(fat))) {
        tryFindFood(function() {
            addFood(true);
        });
        return;
    }

    if (isNaN(amount) || isNaN(calories) || isNaN(crabs) || isNaN(protein) || isNaN(fat) || isNaN(category)) {
        showNotification('#notification-area', 'danger', 'אנא מלא את כל השדות');
        return;
    }

    addMenuItem(title, category, amount, unitsTitle, calories, crabs, protein, fat);

    $("#fat-input, #protein-input, #crabs-input, #calories-input, #search-food, #food-amount-input").val('');

    $("#search-food").focus();
}

function tableDrawCallback() {
    $('#menuTable tr input[type="checkbox"]').each(function(i, checkbox) {
        var clientId = $(checkbox).data('client-id');
        var menuItem = menuData.find(function(x) { return x.clientId == clientId });
        if (menuItem.isSelected) {
            $(checkbox).prop('checked', true);
        }
    });

    $('#menuTable tbody tr').each(function(i, menuItemRow) {
        var checkbox = $(this).find('input[type="checkbox"]');
        if (checkbox.length > 0) {
            var clientId = checkbox.data('client-id');
            var menuItem = menuData.find(function(x) { return x.clientId == clientId });
            if (menuItem.category > 0) {
                var category = categories.find(function(x) { return x.clientId == menuItem.category });

                if (category.color != null) {
                    $(this).css('background-color', category.color);
                }
            }
            else {
                $(this).css('background-color', "");
            }
        }
    });
}

$(document).on('userLoad', function() {
    if (currentSession == false) {
        $("#menus-dropdown").prop('disabled', true);
        $("#load-menu-button").prop('disabled', true);
        $("#override-menu-button").prop('disabled', true);
        $("#save-menu-date-input").prop('disabled', true);
        $("#save-menu-button").prop('disabled', true);
    }
    else {
        currentSession.menus.reverse();        
        $(currentSession.menus).each(function(i, menu) {
            $('#menus-dropdown').append($('<option></option>')
                                        .attr('value', menu.menu_id)
                                        .text(menu.start_date));
        });

        if (currentSession.menus.length > 0) {
            $("#load-menu-button").click(function() {
                var menuId = $("#menus-dropdown").val();

                if (menuId) {
                    $.get("server/menu/" + menuId, function(result) {
                        if (result !== false) {
                            menuData = result.menuItems;
                            latestItemClientId = Math.max.apply(Math, menuData.map(function(item) { return item.clientId })) + 1;
                            categories = [];
                            addDefaultCategory();
                            categories = categories.concat(result.categories);
                            reloadCategories();
                            latestCategoryClientId = Math.max.apply(Math, categories.map(function(cat) { return cat.clientId })) + 1;

                            table.refreshTable();
                        }
                        else {
                            showNotification('#notification-area', 'danger', 'שגיאה בטעינת התפריט');
                        }
                    })
                    .fail(function(a, b, c) {
                        debugger;
                    });
                }
            });

            $("#override-menu-button").click(function() {
                var menuIdInput = $("#menus-dropdown").val();

                $.post("server/menu/save", {menuId: menuIdInput, menuItems: menuData, categories: categories.slice(1)}, function(result) {
                    if (result) {
                        showNotification('#notification-area', 'success', 'התפריט נדרס בהצלחה');
                    }
                    else {
                        showNotification('#notification-area', 'danger', 'שגיאה! לא ניתן לשמור את התפריט כעת.');
                    }
                })
                .fail(function(a, b, c) {
                    debugger;
                });
            });
        }
        else {
            $("#menus-dropdown").prop('disabled', true);
            $("#load-menu-button").prop('disabled', true);
            $("#override-menu-button").prop('disabled', true);
        }

        $("#save-menu-button").click(function() {
            var dateInput = $("#save-menu-date-input").val();
            if (!dateInput) {
                showNotification('#notification-area', 'danger', 'יש למלא תאריך');
                return;
            }

            if (menuData.length == 0) {
                showNotification('#notification-area', 'danger', 'התפריט ריק');
                return;
            }

            $.post("server/menu/save", {date: dateInput, menuItems: menuData, categories: categories.slice(1)}, function(result) {
                if (result) {
                    showNotification('#notification-area', 'success', 'התפריט נשמר בהצלחה');
                }
                else {
                    showNotification('#notification-area', 'danger', 'שגיאה! לא ניתן לשמור את התפריט כעת.');
                }
            });
        });
    }

    Tipped.create('.apply_tooltip', '', { position: 'bottom' });
    Tipped.create('.input_tooltip', '', { position: 'bottom', showOn: 'focus', hideOn: 'blur' });

    $("#save-menu-date-input").datepicker("setDate", new Date());

    addDefaultCategory();

    reloadUnits();

    $("#add-button").click(function() {
        addFood()
    });

    $("#fat-input, #protein-input, #crabs-input, #calories-input, #search-food, #food-amount-input").keypress(function(e) {
        if(e.which == 13) {
            addFood();
        }
    });

    $("#search-food, #food-amount-input").focusout(tryFindFood);
    $("#food-unit-dropdown").change(tryFindFood);
    $("#search-food").focusout(reloadUnits);

    $("#clear-button").click(function() {
        menuData = [];
        table.refreshTable();
    });

    $("#add-category-button").click(function() {
        addCategory($("#add-category-input").val(), $("#add-category-color-input").val());
        $("#add-category-input").val('');
        showNotification('#notification-area', 'success', 'הקטגוריה נוספה בהצלחה');
    });

    $("#remove-category-button").click(function() {
        var selectedCategoryId = $("#category-dropdown").val();
        var selectedCategory = categories.find(function(x) { return x.clientId == selectedCategoryId });

        if (selectedCategoryId > 0) {
            var index = categories.indexOf(selectedCategory);
            categories.splice(index, 1);

            $(menuData).each(function(i, menuItem) {
                if (menuItem.category == selectedCategoryId) {
                    menuItem.category = 0;
                }
            }).promise().done(function() {
                table.refreshTable();
                reloadCategories();
                showNotification('#notification-area', 'success', 'הקטגוריה "{0}" נמחקה בהצלחה'.format(selectedCategory.title));
            });
        }
    });

    $("#add-category-color-input").spectrum({
        preferredFormat: "hex",
        clickoutFiresChange: true,
        chooseText: "בחר",
        cancelText: "בטל"
    });

    $('#category-dropdown').change(function() {
        var selectedCategoryId = $("#category-dropdown").val();
        var selectedCategory = categories.find(function(x) { return x.clientId == selectedCategoryId });

        if (selectedCategory && selectedCategory.color != null) {
            $(this).css('background-color', selectedCategory.color);
        }
        else {
            $(this).css("background-color", "");
        }
    });

    $('#apply-category-button').click(function() {
        var selectedItems = menuData.filter(function(x) { return x.isSelected });
        var selectedCategoryId = $("#category-dropdown").val();
        var selectedCategory = categories.find(function(x) { return x.clientId == selectedCategoryId });

        if (selectedItems.length == 0) {
            showNotification('#notification-area', 'danger', 'יש לסמן פריטים בתפריט וללחוץ שנית');
            return;
        }

        $(selectedItems).each(function(i, menuItem) {
            menuItem.category = selectedCategoryId;
            menuItem.isSelected = false;
        }).promise().done(function() {
            table.refreshTable();
            showNotification('#notification-area', 'success', 'הקטגוריה "{0}" הופעלה בהצלחה על {1} פריטים'.format(selectedCategory.title, selectedItems.length));
        });
    });

    var ajax = new XMLHttpRequest();
    ajax.open("GET", "server/food/all", true);
    ajax.onload = function() {
        var list = JSON.parse(ajax.responseText).map(function(i) { return i.title; });
        new Awesomplete(document.querySelector("#search-food"),{ list: list, autoFirst: true, minChars: 1 });
    };
    ajax.send();

    table = $('#menuTable').DataTable({
        searching: false,
        lengthChange: false,
        info: false,
        paging: false,

        colReorder: true,

        drawCallback: tableDrawCallback,

        rowReorder: {
            selector: 'td:not(:first-child):not(:last-child)',
            update: false
        },

        order: [[ 0, "asc" ]],

        language: {
                "emptyTable":   "התפריט ריק. הוסף מזון לתפריט על ידי תיבת החיפוש שמעל לטבלה."
        },

        columns: [
            { "data": "position", visible: false },
            {
                orderable: false,
                render: function(data, type, row) {
                    return "<input type='checkbox' data-client-id='" + row.clientId + "' onchange='setMenuItemSelection(" + row.clientId + ", this.checked)' />";
                },
            },
            { "data": "title", className: 'text-center' },
            { "data": "amount" },
            { "data": "calories", render: caloriesRenderer },
            { "data": "protein", render: gramRenderer },
            { "data": "crabs", render: gramRenderer },
            { "data": "fat", render: gramRenderer },
            {
                render: function(data, type, row) {
                    return "<button class='btn btn-primary btn-sm' onclick='removeMenuItem(" + row.clientId + ")'>הסר</button>";
                },
                orderable: false,
            }
        ]
    });

    table.on('row-reorder', function ( e, diff, edit ) {
        table.order([0, 'asc'])

        for ( var i=0, ien=diff.length ; i<ien ; i++ ) {
            var newPosition = diff[i].newPosition;
            var rowData = table.row(diff[i].node).data();
            menuData.find(function(x) { return x == rowData }).position = newPosition;
        }

        menuData.sort(function(a, b) {
            if (a.position > b.position) {
                return 1;
            }
            else if (b.position > a.position) {
                return -1;
            }

            return 0;
        });

        table.refreshTable();
        e.preventDefault();
    });

    table.refreshTable = function() {
        var totalCalories = 0;
        var totalProtein = 0;
        var totalCrabs = 0;
        var totalFat = 0;

        $(menuData).each(function(i, data) {
            totalCalories += parseFloat(data.calories);
            totalProtein += parseFloat(data.protein);
            totalCrabs += parseFloat(data.crabs);
            totalFat += parseFloat(data.fat);

            data.position = i + 1;
        });

        $("#total-calories").html(caloriesRenderer(totalCalories.toFixed(2)));
        $("#total-protein").html(gramRenderer(totalProtein.toFixed(2)));
        $("#total-crabs").html(gramRenderer(totalCrabs.toFixed(2)));
        $("#total-fat").html(gramRenderer(totalFat.toFixed(2)));

        reloadCharts(totalProtein, totalCrabs, totalFat);

        table.clear();
        table.rows.add(menuData);
        table.draw();

        // $(menuData).each(function(i, menuItem) {
        //     if (menuItem.type == "category") {
        //     }
        //     else {
        //         table.rows.add([menuItem]);
        //     }
        // }).promise().done(function() {
        //     table.draw();
        // });
        //
        // $(menuData).each(function(i, menuItem) {
        //     if (menuItem.type == "category") {
        //         $("#menuTable").find("tbody > tr:nth-child(" + (i) + ")").after(
        //             $("<tr />")
        //                 .append(
        //                     $("<td />")
        //                         .attr('colspan', 6)
        //                         .attr('class', 'text-center')
        //                         .text(menuItem.title)
        //                 )
        //         );
        //     }
        // });
    }

    table.refreshTable();
});
