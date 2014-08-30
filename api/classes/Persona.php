<?php
/**
 * Persona assertion verifier.
 *
 * @package api-framework
 */

class Persona
{
	/**
	 * Scheme, hostname and port
	 */
	protected $audience;

	/**
	 * Constructs a new Persona (optionally specifying the audience)
	 */
	public function __construct($audience = NULL)
	{
		$this->audience = $audience ? $audience : $this->guessAudience();
	}

	/**
	 * Verify the validity of the assertion received from the user
	 *
	 * @param string $assertion The assertion as received from the login dialog
	 * @return object The response from the Persona online verifier
	 */
	public function verifyAssertion($assertion)
	{
		$postdata = 'assertion=' . urlencode($assertion) . '&audience=' . urlencode($this->audience);

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, "https://verifier.login.persona.org/verify");
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
		$response = curl_exec($ch);
		curl_close($ch);

		return json_decode($response, true);
	}

	/**
	 * Verify the validity of the assertion and that the issuer is trusted
	 */
	public function verifyAssertionAndIssuer($assertion)
	{
		$verification = $this->verifyAssertion($assertion);

		if ($verification['status'] !== 'okay')
			return $verification;

		// The domain owner is trusted.
		if ($verification['issuer'] === preg_replace('/^[^@]+@/', '', $verification['email']))
			return $verification;

		// login.persona.org and its subdomains are trusted.
		if (preg_match('/^([^.]+\.)*login\.persona\.org$/', $verification['issuer']))
			return $verification;

		// Assertion is correct, but issuer is not.
		return array(
			'status' => 'failure',
			'reason' => "Issuer '$verification[issuer]' is not trusted",
		);
	}

	/**
	 * Guesses the audience from the web server configuration
	 */
	protected function guessAudience()
	{
		$audience = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
		$audience .= $_SERVER['SERVER_NAME'] . ':'.$_SERVER['SERVER_PORT'];
		return $audience;
	}
}
