<?php
require 'vendor/autoload.php';
require 'medoo.php';
require 'data.php';

$database = new medoo([
	'database_type' => 'mysql',
	'database_name' => 'cookiese_calorya',
	'server' => '127.0.0.1',
	'username' => 'cookiesession',
	'password' => 's7590168',
	'charset' => 'utf8',
	'port' => 3306
]);

$app = new \Slim\App;

require 'routes.php';

$app->run();
