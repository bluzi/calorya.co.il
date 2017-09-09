var dynamicGraph;

var legends = [
    {
        label: 'משקל',
        color: '#FF6384',
        ajax: 'server/graph/weight',
        isSelected: true,
    },

    {
        label: 'אחוז שומן',
        color: '#36A2EB',
        ajax: 'server/graph/fat-percentage'
    },

    {
        label: 'קלוריות (במאות)',
        color: 'purple',
        ajax: 'server/graph/calories'
    },

    {
        label: 'פחמימה (גרם)',
        color: 'gold',
        ajax: 'server/graph/crabs'
    },

    {
        label: 'חלבון (גרם)',
        color: 'lightgreen',
        ajax: 'server/graph/protein'
    },

    {
        label: 'שומן (גרם)',
        color: 'pink',
        ajax: 'server/graph/fat'
    }
];

function getUnit() {
    switch (parseInt($('#frequency-dropdown').val())) {
        case 3:
            return 'year';

        case 2:
            return 'month';

        case 1: return 'week';

        default:
            return 'day';
    }
}

function onUserChangesSettings() {
    var datasets = [];
    $(".legend-checkbox:checked").each(function(i, checkbox) {
        var legend = legends[$(checkbox).data('legend-index')];
        $.ajax({
          type: 'POST',
          url: legend.ajax,
          data: {
              startDate: $('#start-date-input').val(),
              endDate: $('#end-date-input').val(),
              frequency: $('#frequency-dropdown').val()
          },
          success: function(result) {
              datasets.push({
                  label: legend.label,
                  fill: false,
                  lineTension: 0.1,
                  backgroundColor: legend.color,
                  borderColor: legend.color,
                  borderCapStyle: 'butt',
                  borderDash: [],
                  borderDashOffset: 0.0,
                  borderJoinStyle: 'miter',
                  pointBorderColor: legend.color,
                  pointBackgroundColor: "#fff",
                  pointBorderWidth: 1,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: legend.color,
                  pointHoverBorderColor: legend.color,
                  pointHoverBorderWidth: 2,
                  pointRadius: 5,
                  pointHitRadius: 10,
                  data: result,
                  spanGaps: false,
              })
          },
          dataType: 'json',
          async: false
        })
        .fail(function(a,b,c) {
            debugger;
        });;
    }).promise().done(function() {
        recreateGraph(datasets);
    });
}

function recreateGraph(datasets) {
    if (dynamicGraph != null) {
        dynamicGraph.destroy();
    }

    dynamicGraph = new Chart($("#voedselgroepe-chart"), {
        type: 'line',
        showXLabels: 10,
        data: {
            datasets: datasets
        },
        options: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'label'
            },
            responsive: true,
            scales: {
                xAxes: [{
                    type: 'time',
                    position: 'bottom',
                    time: {
                        unit: getUnit()
                    },
                    afterTickToLabelConversion: function(data){
                        data.ticks.forEach(function (labels, i) {
                            if (i % Math.floor(data.ticks.length / 10) != 1){
                                data.ticks[i] = '';
                            }
                        });
                    }
                }]
            }
        }
    });
}

$(document).on('userLoad', function() {
    if (currentSession.menus.length > 0) {
        var firstMenu = currentSession.menus[0];

        $("#start-date-input").datepicker("setDate", new Date(firstMenu.start_date));
        $("#end-date-input").datepicker("setDate", new Date());
    }
    else {
        $("#start-date-input").datepicker("setDate", new Date());
        $("#end-date-input").datepicker("setDate", new Date());
    }

    $('body').on('change', '.legend-checkbox', onUserChangesSettings);
    $('#start-date-input, #end-date-input, #frequency-dropdown').change(onUserChangesSettings);

    $(legends).each(function(i, line) {
        $("#legends").append(`<div class="row" style="margin-bottom: 10px;">
            <div class="col-md-2">
                <input type="checkbox" ` + (line.isSelected === true ? 'checked=""' : '') + ` class="legend-checkbox" id='legend_` + i + `' data-legend-index="` + i + `" />
            </div>
            <div class="col-md-10" style="color: ` + line.color + `; font-size: 14px">
                <label for='legend_` + i + `'>` + line.label + `
            </div>
        </div>`);
    }).promise().done(onUserChangesSettings);
});
