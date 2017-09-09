<?php
    use \Psr\Http\Message\ServerRequestInterface as Request;
    use \Psr\Http\Message\ResponseInterface as Response;

    /*
    *    Food
    */

    $app->get('/food/all', function (Request $request, Response $response) {
        $response = $response->withJson(Food::getAll(), 200);
        return $response;
    });

    $app->post('/food', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $title = $data['title'];
        $food = Food::find($title);
        if ($food != null) {
            $response = $response->withJson($food, 200);
        }
        else {
            $response = $response->withJson(array(), 404);
        }
        return $response;
    });

    $app->post('/food/units', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $title = $data['title'];
        $units = Unit::findByFood($title);
        return $response->withJson($units, 200);
        if ($units != null) {
            $response = $response->withJson($units, 200);
        }
        else {
            $response = $response->withJson(array(), 404);
        }
        return $response;
    });

    /*
    *    Users
    */

    $app->get('/user/current', function (Request $request, Response $response) {
        $response = $response->withJson(User::getCurrentSession(), 200);

        return $response;
    });

    $app->post('/user/login', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $email = $data['email'];
        $password = $data['password'];

        $response = $response->withJson(User::attemptToLogin($email, $password), 200);

        return $response;
    });

    $app->post('/user/logout', function (Request $request, Response $response) {
        User::logout();

        $response = $response->withJson(true, 200);

        return $response;
    });

    $app->post('/user/create', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $email = $data['email'];
        $password = $data['password'];
        $birthdate = $data['birthdate'];
        $currentWeight = $data['currentWeight'];
        $currentFatPercentage = $data['currentFatPercentage'];

        if (User::isEmailExists($email)) {
            $response = $response->withJson(false, 200);
        }
        else {
            $creationResult = User::create($email, $password, $birthdate);

            if ($creationResult) {
                $loginResult = User::attemptToLogin($email, $password);
                if ($loginResult) {
                    User::getCurrentSession()->updateLog($currentWeight, $currentFatPercentage, date("d-m-Y"));
                    $response = $response->withJson(true, 201);
                }
                else {
                    $response = $response->withJson(false, 201);
                }
            }
            else {
                $response = $response->withJson(false, 200);
            }
        }

        return $response;
    });

    /*
    *    Menus
    */

    $app->post('/menu/save', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        if (array_key_exists('date', $data)) {
            $date = $data['date'];
        }
        else if (array_key_exists('menuId', $data)) {
            $menuId = $data['menuId'];
        }

        $menuItems = $data['menuItems'];
        $categories = $data['categories'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $user_id = $currentSession->id;

            if (isset($date)) {
                // Save new
                $response = $response->withJson(Menu::create($user_id, $date, $menuItems, $categories), 200);
            }
            else if (isset($menuId)) {
                // Override existing menu
                $existingMenu = Menu::find($menuId);
                $response = $response->withJson($existingMenu->override($menuItems, $categories), 200);
            }
        }

        return $response;
    });

    $app->get('/menu/{menu_id}', function (Request $request, Response $response) {
        $menu_id = $request->getAttribute('menu_id');
        $menu = Menu::find($menu_id);
        if ($menu != null) {
            $response = $response->withJson($menu, 200);
        }
        else {
            $response = $response->withJson(false, 404);
        }
        return $response;
    });

    /*
    *    Weight log
    */

    $app->post('/user/log/update', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $weight = $data['weight'];
        $fatPercentage = $data['fatPercentage'];
        $date = $data['date'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $response = $response->withJson($currentSession->updateLog($weight, $fatPercentage, $date), 200);
        }

        return $response;
    });

    /*
    *   Graph
    */

    $app->post('/graph/weight', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $frequency = $data['frequency'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $response = $response->withJson($currentSession->getWeightForGraph($startDate, $endDate, $frequency), 200);
        }

        return $response;
    });

    $app->post('/graph/fat-percentage', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $frequency = $data['frequency'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $response = $response->withJson($currentSession->getFatPercentageForGraph($startDate, $endDate, $frequency), 200);
        }

        return $response;
    });

    $app->post('/graph/calories', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $frequency = $data['frequency'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $response = $response->withJson($currentSession->getMenuSumForGraph($startDate, $endDate, $frequency, "calories", 0.1), 200);
        }

        return $response;
    });

    $app->post('/graph/crabs', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $frequency = $data['frequency'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $response = $response->withJson($currentSession->getMenuSumForGraph($startDate, $endDate, $frequency, "crabs"), 200);
        }

        return $response;
    });

    $app->post('/graph/protein', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $frequency = $data['frequency'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $response = $response->withJson($currentSession->getMenuSumForGraph($startDate, $endDate, $frequency, "protein"), 200);
        }

        return $response;
    });

    $app->post('/graph/fat', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $frequency = $data['frequency'];

        $currentSession = User::getCurrentSession();

        if (!$currentSession) {
            $response = $response->withJson(false, 200);
        }
        else {
            $response = $response->withJson($currentSession->getMenuSumForGraph($startDate, $endDate, $frequency, "fat"), 200);
        }

        return $response;
    });
