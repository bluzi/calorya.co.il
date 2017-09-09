<?php
require 'vendor/autoload.php';
require 'medoo.php';
require 'data.php';

$database = new medoo([
	'database_type' => 'mysql',
	'database_name' => '',
	'server' => '',
	'username' => '',
	'password' => '',
	'charset' => 'utf8',
	'port' => 3306
]);

$app = new \Slim\App;

require 'routes.php';

$app->run();
