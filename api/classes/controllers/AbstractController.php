<?php
/**
 * Account controller.
 *
 * @package api-framework
 */
abstract class AbstractController
{
	private static $http_methods = array('GET', 'POST', 'PUT', 'DELETE');

	/**
	 * Request action.
	 *
	 * @param  $request
	 * @return mixed Response
	 */
	public function request($request)
	{
		$method = $request->method;
		$name = $request->url_elements[0];
		if (count($request->url_elements) < 2) {
			// No action.
			if (method_exists($this, $method))
				return $this->$method($request);
			else {
				foreach (self::$http_methods as $tmp_method) {
					if (method_exists($this, "{$tmp_method}")) {
						header('HTTP/1.1 405 Method Not Allowed');
						throw new ApiException("'$name' does not support $method", 'method_not_allowed');
					}
				}
				header('HTTP/1.1 404 Not Found');
				throw new ApiException("'$name' requires an action to be specified", 'action_required');
			}
		}
		else {
			$action = $request->url_elements[1];
			$callable = "{$method}_$action";
			if (method_exists($this, $callable)) {
				return $this->$callable($request);
			}
			elseif (method_exists($this, $method))
				return $this->$method($request);
			else {
				foreach (self::$http_methods as $tmp_method) {
					if (method_exists($this, "{$tmp_method}_$action")) {
						header('HTTP/1.1 405 Method Not Allowed');
						throw new ApiException("'$name/$action' does not support $method", 'method_not_allowed');
					}
				}
				header('HTTP/1.1 404 Not Found');
				throw new ApiException("Unknown '$name' action '$action'", 'not_found');
			}
		}
	}

	public function assertParameter($request, $parameter)
	{
	if (!isset($request->parameters[$parameter]))
		throw new MissingParameterException($parameter);
	}
}

class MissingParameterException extends ApiException
{
	function __construct($parameter, $array = array())
	{
		parent::__construct("Expect parameter '$parameter'", 'missing_parameter', array(
			'parameter' => $parameter,
		));
	}
}
