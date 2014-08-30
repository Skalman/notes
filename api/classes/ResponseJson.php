<?php
/**
 * JSON response class.
 *
 * @package api-framework
 * @author  Martin Bean <martin@martinbean.co.uk>
 */
class ResponseJson
{
	/**
	 * Response data.
	 *
	 * @var string
	 */
	protected $data;

	/**
	 * Constructor.
	 *
	 * @param string $data
	 */
	public function __construct($data)
	{
		$this->data = $data;
		return $this;
	}

	/**
	 * Render the response as JSON.
	 *
	 * @return string
	 */
	public function render()
	{
		header('Content-Type: application/json');
		return json_encode($this->data);
	}
}
