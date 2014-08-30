<?php

function get_mysqli()
{
	$conf = @$GLOBALS['config']['mysql'];
	if (!isset(
			$conf['host'],
			$conf['username'],
			$conf['password'],
			$conf['database']))
		throw new ApiException('MySQL configuration is missing or incomplete', 'config_error');

	$mysqli = new Mysqli(
		$conf['host'],
		$conf['username'],
		$conf['password'],
		$conf['database']);

	if ($mysqli->connect_errno)
		throw new ApiException("Failed to connect to MySQL: ({$mysqli->connect_errno}) {$mysqli->connect_error}", 'db_error');

	return $mysqli;
}

function mysqli_value_to_string(MySQLi $mysqli, $val)
{
	if ($val === null)
		return 'NULL';
	else
		return "'" . $mysqli->real_escape_string($val) . "'";
}

function mysqli_query_sprintf(MySQLi $mysqli, $query, $params)
{
	$query = preg_replace_callback('/\{([a-zA-Z0-9_.-]+)\}/', function ($match) use ($mysqli, $params) {
		if (!array_key_exists($match[1], $params))
			throw new ApiException("Expected parameter '$match[1]' in mysqli_query_sprintf", 'internal_error');

		return mysqli_value_to_string($mysqli, $params[$match[1]]);
	}, $query);

	return $mysqli->query($query);
}

function mysqli_query_to_array(MySQLi $mysqli, $query, $params = null, $key = null) {
	if (is_array($params))
		$result = mysqli_query_sprintf($mysqli, $query, $params);
	else
		$result = $mysqli->query($query);

	if ($result === false)
		return false;

	$data = array();
	if ($key === null) {
		while ($row = $result->fetch_assoc()) {
			$data[] = $row;
		}
	} else {
		while ($row = $result->fetch_assoc()) {
			$data[$row[$key]] = $row;
		}
	}
	$result->free();
	return $data;
}
