<?php
/**
 * Account controller.
 *
 * @package api-framework
 */
class AccountsController extends AbstractController
{
	/**
	 * Get currently logged in account.
	 *
	 * @param  $request
	 * @return array Response
	 */
	public function GET_account()
	{
		if (empty($_SESSION['account']))
			throw new ApiException('No account is logged in', 'not_logged_in');
		else
			return array(
				'email' => $_SESSION['account']['email'],
			);
	}

	private function set_login_token()
	{
		$_SESSION['login_token'] = str_replace(
			array('+', '/'),
			array('-', '_'),
			base64_encode(openssl_random_pseudo_bytes(30))
		);
		return $_SESSION['login_token'];
	}

	/**
	 * Login.
	 *
	 * @param  $request
	 * @return array Response
	 */
	public function POST_login($request)
	{
		if (!isset($_SESSION['login_token']))
			$this->set_login_token();

		if (!isset($request->parameters['login_token']))
			throw new ApiException('Need token', 'no_token', array(
				'login_token' => $_SESSION['login_token'],
			));

		elseif ($request->parameters['login_token'] !== $_SESSION['login_token'])
			throw new ApiException('Bad token', 'bad_token', array(
				'login_token' => $_SESSION['login_token'],
			));

		$this->assertParameter($request, 'assertion');

		$persona = new Persona();

		$verification = $persona->verifyAssertion($request->parameters['assertion']);

		if ($verification['status'] !== 'okay')
			throw new ApiException($verification['reason'], 'verification_failure');

		// Success
		unset($_SESSION['login_token']);
		$_SESSION['account']['email'] = $verification['email'];

		return $this->GET_account($request);
	}

	/**
	 * Log out.
	 *
	 * @param  $request
	 * @return array response
	 */
	public function GET_logout($request) { return $this->POST_logout($request); }
	public function POST_logout($request)
	{
		unset($_SESSION['account']);

		if (isset($request->parameters['returnUrl'])) {
			header("Location: {$request->parameters['returnUrl']}");
			exit;
		}

		return array(
			// Reset the login token.
			'login_token' => $this->set_login_token(),
		);
	}
}
