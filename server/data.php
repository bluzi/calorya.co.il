<?php
    class Food {
        public $id;
        public $title;
        public $calories;
        public $protein;
        public $crabs;
        public $fat;

        public function __construct($id, $title, $calories, $protein, $crabs, $fat) {
            $this->id = $id;
            $this->title = $title;
            $this->calories = $calories;
            $this->protein = $protein;
            $this->crabs = $crabs;
            $this->fat = $fat;
        }

        public static function getAll() {
            global $database;
            $result = array();
            $foodRows = $database->select('food', '*');

            foreach ($foodRows as $foodRow) {
                $result[] = new Food($foodRow['food_id'], $foodRow['title'], $foodRow['calories'], $foodRow['protein'], $foodRow['crabs'], $foodRow['fat']);
            }

            return $result;
        }

        public static function find($title) {
            global $database;
            return $database->get('food', '*', ['title' => $title]);
        }
    }

    class User {
        public $id;
        public $email;
        public $password;
        public $birthdate;
        public $latestWeight;
        public $latestFatPercentage;
        public $age;
        public $height;
        public $menus;

        public static function attemptToLogin($email, $password) {
            global $database;
            $user = $database->get("users", "*",
                [
                    "AND" => ['email' => $email, 'password' => md5($password)]
                ]
            );

            if ($user) {
                setcookie("user_id", $user['user_id'], time() + 3600 * 24 * 30 * 12, '/');
                setcookie("password", $user['password'], time() + 3600 * 24 * 30 * 12, '/');
                return true;
            }

            return false;
        }

        public static function logout() {
            setcookie("user_id", null, time() - 3600, '/');
            setcookie("password", null, time() - 3600, '/');
        }

        public static function create($email, $password, $birthdate) {
            global $database;
            $user_id = $database->insert("users", [
                'email' => $email,
                'password' => md5($password),
                'birthdate' => $birthdate
            ]);

            return $user_id;
        }

        public static function isEmailExists($email) {
            global $database;
            return $database->has("users", ['email' => $email]);
        }

        public static function getCurrentSession() {
            if (isset($_COOKIE['user_id']) && isset($_COOKIE['password'])) {
                $user = User::getUserById($_COOKIE['user_id']);

                if ($user) {
                    if ($user->password == $_COOKIE['password']) {
                        return $user;
                    }
                }
            }

            return false;
        }

        public static function getUserById($id) {
            global $database;
            $userRow = $database->get("users", "*",
                [
                    'user_id' => $id
                ]
            );

            $weightLogRecords = $database->select("weight_log", "*",
                [
                    'user_id' => $id
                ]
            );


            if (is_array($weightLogRecords) == false) {
                $latestWeight = 0;
                $latestFatPercentage = 0;
            }
            else {
                $latestWeightLog = end($weightLogRecords);
                $latestWeight = $latestWeightLog['weight'];
                $latestFatPercentage = $latestWeightLog['fat_percentage'];
            }

            $user = new User();

            $user->id = $userRow['user_id'];
            $user->email = $userRow['email'];
            $user->password = $userRow['password'];
            $user->birthdate = $userRow['birthdate'];
            $user->latestWeight = $latestWeight;
            $user->latestFatPercentage = $latestFatPercentage;
            $user->age = $user->getAge();
            $user->height = $userRow['height'];

            $user->menus = $database->select("menus", "*",
                [
                    'user_id' => $id,
                    'ORDER' => 'start_date'
                ]
            );

            return $user;
        }

        private function getAge(){
            $date = new DateTime($this->birthdate);
             $now = new DateTime();
             $interval = $now->diff($date);
             return $interval->y;
        }

        public function updateLog($weight, $fatPercentage, $date) {
            global $database;

            $existingRecord = $database->get('weight_log', "*", [
                'AND' => [
                    'timestamp' => $date,
                    'user_id' => $this->id
                ]
            ]);

            if ($existingRecord) {
                $record_id = $database->update("weight_log", [
                    'weight' => $weight,
                    'fat_percentage' => $fatPercentage
                ],
                [
                    'record_id' => $existingRecord['record_id']
                ]);
            }
            else {
                $record_id = $database->insert("weight_log", [
                    'user_id' => $this->id,
                    'weight' => $weight,
                    'fat_percentage' => $fatPercentage,
                    'timestamp' => $date
                ]);
            }

            return true;
        }

        public function getWeightForGraph($from, $to, $frequency) {
            global $database;

            if ($frequency == 0) { // Day
                $weightLogRecords = $database->select("weight_log", "*",
                    [
                        "AND" => [
                            'user_id' => $this->id,
                            'timestamp[>=]' => $from,
                            'timestamp[<=]' => $to,
                        ]
                    ]
                );
            }
            else if ($frequency == 1) { // Week
                $weightLogRecords = $database->query('SELECT AVG(weight) as weight, timestamp FROM weight_log WHERE user_id = ' . $this->id . ' and timestamp >= ' . $database->quote($from) . ' and timestamp <= ' . $database->quote($to) . ' GROUP BY week(timestamp);')->fetchAll();
            }
            else if ($frequency == 2) { // Month
                $weightLogRecords = $database->query('SELECT AVG(weight) as weight, month(timestamp) as timestamp FROM weight_log WHERE user_id = ' . $this->id . ' and timestamp >= ' . $database->quote($from) . ' and timestamp <= ' . $database->quote($to) . ' GROUP BY month(timestamp);')->fetchAll();
            }
            else if ($frequency == 3) { // Month
                $weightLogRecords = $database->query('SELECT AVG(weight) as weight, year(timestamp) as timestamp FROM weight_log WHERE user_id = ' . $this->id . ' and timestamp >= ' . $database->quote($from) . ' and timestamp <= ' . $database->quote($to) . ' GROUP BY year(timestamp);')->fetchAll();
            }

            $result = array();
            $index = 0;
            foreach ($weightLogRecords as $record) {
                $result[] = new GraphPoint($record['timestamp'], floatval($record['weight']));
            }

            return $result;
        }

        public function getFatPercentageForGraph($from, $to, $frequency) {
            global $database;

            if ($frequency == 0) { // Day
                $weightLogRecords = $database->select("weight_log", "*",
                    [
                        "AND" => [
                            'user_id' => $this->id,
                            'timestamp[>=]' => $from,
                            'timestamp[<=]' => $to,
                        ]
                    ]
                );
            }
            else if ($frequency == 1) { // Week
                $weightLogRecords = $database->query('SELECT AVG(fat_percentage) as fat_percentage, timestamp FROM weight_log WHERE user_id = ' . $this->id . ' and timestamp >= ' . $database->quote($from) . ' and timestamp <= ' . $database->quote($to) . ' GROUP BY week(timestamp);')->fetchAll();
            }
            else if ($frequency == 2) { // Month
                $weightLogRecords = $database->query('SELECT AVG(fat_percentage) as fat_percentage, month(timestamp) as timestamp FROM weight_log WHERE user_id = ' . $this->id . ' and timestamp >= ' . $database->quote($from) . ' and timestamp <= ' . $database->quote($to) . ' GROUP BY month(timestamp);')->fetchAll();
            }
            else if ($frequency == 3) { // Month
                $weightLogRecords = $database->query('SELECT AVG(fat_percentage) as fat_percentage, year(timestamp) as timestamp FROM weight_log WHERE user_id = ' . $this->id . ' and timestamp >= ' . $database->quote($from) . ' and timestamp <= ' . $database->quote($to) . ' GROUP BY year(timestamp);')->fetchAll();
            }

            $result = array();
            foreach ($weightLogRecords as $record) {
                $result[] = new GraphPoint(explode(' ', $record['timestamp'])[0], floatval($record['fat_percentage']));
            }

            return $result;
        }

        public function getMenuSumForGraph($from, $to, $frequency, $columnName, $scale = 1) {
            global $database;

            if ($frequency == 0) { // Day
                $menu_items = $database->query('SELECT SUM(menu_items.' . $columnName . ') as value, menus.start_date as timestamp
                                    FROM menus
                                    INNER JOIN menu_items
                                    ON menus.menu_id = menu_items.menu_id
                                    WHERE menus.user_id = ' . $this->id . ' and menus.start_date >= ' . $database->quote($from) . ' and menus.start_date <= ' . $database->quote($to) . '
                                    GROUP BY menus.start_date')->fetchAll();
            }
            else if ($frequency == 1) { // Week
                $menu_items = $database->query('SELECT SUM(menu_items.' . $columnName . ') as value, menus.start_date as timestamp
                                    FROM menus
                                    INNER JOIN menu_items
                                    ON menus.menu_id = menu_items.menu_id
                                    WHERE menus.user_id = ' . $this->id . ' and menus.start_date >= ' . $database->quote($from) . ' and menus.start_date <= ' . $database->quote($to) . '
                                    GROUP BY week(menus.start_date)')->fetchAll();
            }
            else if ($frequency == 2) { // Month
                $menu_items = $database->query('SELECT SUM(menu_items.' . $columnName . ') as value, month(menus.start_date) as timestamp
                                    FROM menus
                                    INNER JOIN menu_items
                                    ON menus.menu_id = menu_items.menu_id
                                    WHERE menus.user_id = ' . $this->id . ' and menus.start_date >= ' . $database->quote($from) . ' and menus.start_date <= ' . $database->quote($to) . '
                                    GROUP BY month(menus.start_date)')->fetchAll();
            }
            else if ($frequency == 3) { // Month
                $menu_items = $database->query('SELECT SUM(menu_items.' . $columnName . ') as value, year(menus.start_date) as timestamp
                                    FROM menus
                                    INNER JOIN menu_items
                                    ON menus.menu_id = menu_items.menu_id
                                    WHERE menus.user_id = ' . $this->id . ' and menus.start_date >= ' . $database->quote($from) . ' and menus.start_date <= ' . $database->quote($to) . '
                                    GROUP BY year(menus.start_date)')->fetchAll();
            }


            $result = array();
            foreach ($menu_items as $menu_item) {
                $result[] = new GraphPoint($menu_item['timestamp'], round(floatval($menu_item['value']) * $scale, 2));
            }

            return $result;
        }
    }

    class Menu {
        public $id;
        public $start_date;
        public $menuItems;
        public $categories;
        public $user_id;

        public static function create($user_id, $start_date, $menuItems, $categories) {
            global $database;
            $menu_id = $database->insert("menus", [
                'start_date' => $start_date,
                'user_id' => $user_id
            ]);

            foreach ($menuItems as $menuItem) {
                $database->insert("menu_items", [
                    'menu_id' => $menu_id,
                    'title' => $menuItem['title'],
                    'amount' => $menuItem['amount'],
                    'calories' => $menuItem['calories'],
                    'crabs' => $menuItem['crabs'],
                    'protein' => $menuItem['protein'],
                    'fat' => $menuItem['fat'],
                    'category_id' => $menuItem['category']
                ]);
            }

            foreach ($categories as $category) {
                $database->insert("categories", [
                    'menu_id' => $menu_id,
                    'title' => $category['title'],
                    'color' => $category['color']
                ]);
            }

            return true;
        }

        public static function find($menu_id) {
            global $database;
            $menuRow = $database->get('menus', '*', ['menu_id' => $menu_id]);
            $menu = new Menu();
            $menu->id = $menuRow['menu_id'];
            $menu->start_date = $menuRow['start_date'];
            $menu->user_id = $menuRow['user_id'];
            $menu->menuItems = array();
            $menu->categories = array();

            $menuItemRows = $database->select("menu_items", "*",
                [
                    'menu_id' => $menu->id
                ]
            );

            $clientIdCounter = 0;
            foreach ($menuItemRows as $menuItemRow) {
                $menuItem = new MenuItem();
                $menuItem->amount = $menuItemRow['amount'];
                $menuItem->title = $menuItemRow['title'];
                $menuItem->calories = $menuItemRow['calories'];
                $menuItem->protein = $menuItemRow['protein'];
                $menuItem->crabs = $menuItemRow['crabs'];
                $menuItem->fat = $menuItemRow['fat'];
                $menuItem->category = $menuItemRow['category_id'];
                $menuItem->clientId = $clientIdCounter++;
                $menuItem->isSelected = false;
                $menuItem->position = $menuItem->clientId + 1;

                $menu->menuItems[] = $menuItem;
            }

            $categoryRows = $database->select("categories", "*",
                [
                    'menu_id' => $menu->id
                ]
            );

            $clientIdCounter = 1;
            foreach ($categoryRows as $categoryRow) {
                $category = new Category();
                $category->title = $categoryRow['title'];
                $category->color = $categoryRow['color'];
                $category->clientId = $clientIdCounter++;

                $menu->categories[] = $category;
            }

            return $menu;
        }

        public function override($menuItems, $categories) {
            global $database;
            $database->delete("menu_items",
                [
                    'menu_id' => $this->id
                ]
            );

            $database->delete("categories",
                [
                    'menu_id' => $this->id
                ]
            );

            foreach ($menuItems as $menuItem) {
                $database->insert("menu_items", [
                    'menu_id' => $this->id,
                    'title' => $menuItem['title'],
                    'amount' => $menuItem['amount'],
                    'calories' => $menuItem['calories'],
                    'crabs' => $menuItem['crabs'],
                    'protein' => $menuItem['protein'],
                    'fat' => $menuItem['fat'],
                    'category_id' => $menuItem['category']
                ]);
            }

            foreach ($categories as $category) {
                $database->insert("categories", [
                    'menu_id' => $this->id,
                    'title' => $category['title'],
                    'color' => $category['color']
                ]);
            }

            return true;
        }
    }

    class MenuItem {
        public $amount;
        public $title;
        public $calories;
        public $protein;
        public $crabs;
        public $fat;
        public $clientId;
        public $category;
        public $isSelected;
        public $position;

    }

    class Category {
        public $title;
        public $color;
        public $clientId;
    }

    class GraphPoint {
        public $x;
        public $y;

        public function __construct($x, $y) {
            $this->x = $x;
            $this->y = $y;
        }
    }

    class Unit {
        public $id;
        public $title;
        public $weight;
        public $food_id;

        public static function findByFood($title) {
            global $database;

            $food = Food::find($title);

            if (!$food) {
                return false;
            }


            $unitRows = $database->select("units", "*",
                [
                    'food_id' => $food['food_id']
                ]
            );

            $units = array();
            foreach ($unitRows as $unitRow) {
                $unit = new Unit();
                $unit->id = $unitRow['unit_id'];
                $unit->title = $unitRow['title'];
                $unit->weight = $unitRow['weight'];
                $unit->food_id = $unitRow['food_id'];

                $units[] = $unit;
            }

            return $units;
        }
    }
