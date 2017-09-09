function updatePersonalParameters() {
    var rmr = parseInt(calculateRmr(currentSession.latestWeight, currentSession.height, currentSession.age));
    var rec = calculateRecommendations(currentSession.latestWeight, rmr);

    $("#weight-input").val(currentSession.latestWeight);
    $("#fat-percentage-input").val(currentSession.latestFatPercentage);
    $("#age-input").val(currentSession.age);
    $("#height-input").val(currentSession.height);
    $("#bmi-input").val(calculateBmi(currentSession.latestWeight, currentSession.height));
    $("#rmr-input").val(rmr);
    $("#recommended-protein-input").val(gramRenderer(rec.protein));
    $("#recommended-crabs-input").val(gramRenderer(rec.crabs));
    $("#recommended-fat-input").val(gramRenderer(rec.fat));
}

function gramRenderer(data, type, row) {
    return data + ' גרם';
}

function caloriesRenderer(data, type, row) {
    return data + " קל'";
}

function calculateBmi(weight, height) {
    return (weight / (height * height)).toFixed(2);
}

function calculateRmr(weight, height, age) {
    return (((10 * weight) + (6.25 * (height * 100)) - (5 * age) + 5) * 1.2).toFixed(0);
}

function calculateRecommendations(weight, rmr) {
    var recommendations = {
        protein: weight * 2,
        fat: weight,
    };

    recommendations.crabs = (rmr - ((recommendations.protein * 4) + (recommendations.fat * 9))) / 4;

    return recommendations;
}

$(document).on('userLoad', function() {
    Tipped.create('.apply_tooltip', '', { position: 'bottom' });
    Tipped.create('.input_tooltip', '', { position: 'bottom', showOn: 'focus', hideOn: 'blur' });

    $("#date-input").datepicker("setDate", new Date());

    $("#update-weight-button").click(function() {
        var weightInput = $("#weight-input").val();
        var fatPercentageInput = $("#fat-percentage-input").val();
        var dateInput = $("#date-input").val();

        if (!weightInput || !fatPercentageInput) {
            showNotification('#notification-area', 'danger', 'אנא מלא את כל השדות');
            return;
        }

        $.post("server/user/log/update", {weight: weightInput, fatPercentage: fatPercentageInput, date: dateInput}, function(result) {
            if (result) {
                showNotification('#notification-area', 'success', 'הנתונים התעדכנו בהצלחה!');
                currentSession.latestWeight = weightInput;
                currentSession.latestFatPercentage = fatPercentageInput;
                updatePersonalParameters();
            }
            else {
                showNotification('#notification-area', 'danger', 'שגיאה! לא ניתן לעדכן את התונים כעת.');
            }
        });
    });

    updatePersonalParameters();
});
