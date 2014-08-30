<?php
/**
 * API framework front controller.
 *
 * @package api-framework
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();

if (get_magic_quotes_gpc()) {
	function strip_quote_slashes(&$var) {
		if (is_string($var))
			$var = str_replace(array('\\\\', '\\\'', '\\"'), array('\\', '\'', '"'), $var);
		elseif (is_array($var))
			foreach ($var as  $key => $val)
				strip_quote_slashes($var[$key]);
	}
	strip_quote_slashes($_GET);
	strip_quote_slashes($_POST);
	strip_quote_slashes($_FILES);
	strip_quote_slashes($_COOKIE);
	strip_quote_slashes($_REQUEST);
}

function normalizeNewlines($text) {
	return str_replace(
		array("\r\n", "\r"),
		"\n",
		$text);
}
$_GET = normalizeNewlines($_GET);
$_POST = normalizeNewlines($_POST);
$_FILES = normalizeNewlines($_FILES);
$_COOKIE = normalizeNewlines($_COOKIE);
$_REQUEST = normalizeNewlines($_REQUEST);


require 'config.php';

/**
 * Generic class autoloader.
 *
 * @param string $class_name
 */
function autoload_class($class_name) {
	$directories = array(
		'classes/',
		'classes/controllers/',
		'classes/models/'
	);
	foreach ($directories as $directory) {
		$filename = $directory . $class_name . '.php';
		if (is_file($filename)) {
			require($filename);
			break;
		}
	}
}


/**
 * Register autoloader functions.
 */
spl_autoload_register('autoload_class');

/**
 * Parse the incoming request.
 */
$request = new Request();

if (isset($_GET['path'])) {
	$path_info = $_GET['path'];
} else {
	$path_info = str_replace(
		'>' . dirname($_SERVER['PHP_SELF']),
		'',
		'>' . $_SERVER['REQUEST_URI']);
	$path_info = preg_replace('/\?.*$/', '', $path_info);
}
$path_info = trim($path_info, '/');

if ($path_info !== '')
	$request->url_elements = explode('/', $path_info);

$request->method = strtoupper($_SERVER['REQUEST_METHOD']);
switch ($request->method) {
	case 'GET':
		$request->parameters = $_GET;
	break;
	case 'POST':
		$request->parameters = $_POST;
	break;
	case 'PUT':
		parse_str(file_get_contents('php://input'), $request->parameters);

		if (get_magic_quotes_gpc())
			strip_quote_slashes($request->parameters);
	break;
}

/**
 * Route the request.
 */
if (!empty($request->url_elements)) {
	$controller_name = $request->url_elements[0];
	$controller_name = str_replace('-', ' ', $controller_name);
	$controller_name = ucwords($controller_name);
	$controller_name = str_replace(' ', '', $controller_name);
	$controller_name .= 'Controller';
	if (class_exists($controller_name)) {
		$controller = new $controller_name;
		try {
			$response = $controller->request($request);
		} catch (ApiException $e) {
			$response = $e;
		} catch (Exception $e) {
			header('HTTP/1.1 500 Internal Server Error');
			$response = new ApiException($e->getMessage(), 'internal_server_error', array(
				'original_exception' => json_encode($e),
			));
		}
	}
	else {
		header('HTTP/1.1 404 Not Found');
		$response = new ApiException('Unknown request: ' . $request->url_elements[0], 'not_found');
	}
}
else {
	header('HTTP/1.1 404 Not Found');
	$response = new ApiException('Unknown request', 'not_found');
}


/**
 * Send the response to the client.
 */
if ($response instanceof ApiException)
	$response = $response->data();
elseif (empty($response['status']))
	$response['status'] = 'ok';

$response_obj = Response::create($response, $_SERVER['HTTP_ACCEPT']);
echo $response_obj->render();
