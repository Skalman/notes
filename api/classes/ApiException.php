<?php

/**
 * API exception.
 */
class ApiException extends Exception
{
	private $data;

	public function __construct($message, $code = null, $array = null)
	{
		if ($array === null && is_array($message)) {
			$array = $message;
			$message = true;
		}

		if ($array === null)
			$array = array();

		if (empty($array['status']))
			$array['status'] = 'error';

		if (empty($array['error']))
			$array['error'] = $message;

		if (empty($array['error_code']) && $code !== null)
			$array['error_code'] = $code;

		$this->data = $array;

		parent::__construct($array['error']);
	}

	public function data()
	{
		return $this->data;
	}

	public function __toString()
	{
		if (isset($this->data['error']))
			return 'API error: ' . $this->data['error'];
		else
			return 'API error';
	}
}
